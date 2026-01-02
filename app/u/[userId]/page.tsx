import { MainLayout } from "@/components/layout/main-layout";
import { adminDb } from "@/lib/firebase-admin";
import { notFound, redirect } from "next/navigation";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PostCard } from "@/components/feed/post-card";
import { getUserProfile } from "@/lib/auth";
import { sanitizeData } from "@/lib/serialization";

import { getFamilyStatus } from "@/app/actions/family";
import { getUserPosts } from "@/app/actions/posts";
import { Lock } from "lucide-react";

import { ProfileTabs } from "@/components/profile/profile-tabs";

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const currentUser = await getUserProfile();
    if (!currentUser || currentUser.role === 'pending') {
        redirect("/");
    }

    const { userId } = await params;
    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
        notFound();
    }

    const isOwnProfile = currentUser.id === userId;
    // Fetch family status
    const familyStatus = await getFamilyStatus(userId);
    const hasAccess = isOwnProfile || familyStatus.status === 'accepted' || currentUser.role === 'admin';

    // Sanitize user data based on access
    const userData = userDoc.data()!;
    const user = sanitizeData({
        id: userDoc.id,
        displayName: userData.displayName,
        imageUrl: userData.imageUrl,
        // Only show full profile data if has access
        ...(hasAccess ? userData : {}),
        // Always allow cover photo? Or hide it? "photos" implies cover too potentially.
        // Let's hide bio and cover if private as requested "info, data, etc".
        // But keep coverUrl if we want the header to look okay-ish?
        // User said "cannot have access to... photos". Cover IS a photo.
        // Let's strip coverUrl and bio if !hasAccess.
        coverUrl: hasAccess ? userData.coverUrl : null,
        coverType: hasAccess ? userData.coverType : null,
        bio: hasAccess ? userData.bio : null,
    });

    // Fetch user posts
    console.log(`Checking profile access for viewer ${currentUser.id} to target ${userId}`);
    console.log(`Access status: isOwn=${isOwnProfile}, family=${familyStatus.status}, role=${currentUser.role}`);
    console.log(`Has Access: ${hasAccess}`);

    const userPosts = hasAccess ? await getUserPosts(userId) : [];
    console.log(`Fetched ${userPosts.length} posts for profile ${userId}`);

    const { getUserFamilyMembers } = await import("@/app/actions/family");
    const userFamily = hasAccess ? await getUserFamilyMembers(userId) : [];

    return (
        <MainLayout>
            <ProfileHeader user={user} isCurrentUser={isOwnProfile} />
            <div className="mt-8">
                {!hasAccess ? (
                    <div className="flex flex-col items-center justify-center p-10 bg-slate-50 dark:bg-card rounded-lg border border-slate-200 dark:border-border text-center">
                        <div className="bg-slate-200 dark:bg-muted p-4 rounded-full mb-4">
                            <Lock className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Private Profile</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                            You must be family to view {user.displayName || "this user"}'s posts and photos. Send a family request to connect!
                        </p>
                    </div>
                ) : (
                    <ProfileTabs
                        posts={userPosts}
                        familyMembers={userFamily}
                        isOwnProfile={isOwnProfile}
                        currentUserId={currentUser.id}
                    />
                )}
            </div>
        </MainLayout >
    );
}
