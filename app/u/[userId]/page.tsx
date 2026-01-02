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

    const user = sanitizeData({
        id: userDoc.id,
        ...userDoc.data()
    });

    const isOwnProfile = currentUser.id === userId;
    // Fetch family status
    const familyStatus = await getFamilyStatus(userId);
    const hasAccess = isOwnProfile || familyStatus.status === 'accepted' || currentUser.role === 'admin';

    // Fetch user posts
    console.log(`Checking profile access for viewer ${currentUser.id} to target ${userId}`);
    console.log(`Access status: isOwn=${isOwnProfile}, family=${familyStatus.status}, role=${currentUser.role}`);
    console.log(`Has Access: ${hasAccess}`);

    const userPosts = hasAccess ? await getUserPosts(userId) : [];
    console.log(`Fetched ${userPosts.length} posts for profile ${userId}`);

    return (
        <MainLayout>
            <ProfileHeader user={user} isCurrentUser={isOwnProfile} />
            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Personal Timeline</h2>
                {!hasAccess ? (
                    <div className="flex flex-col items-center justify-center p-10 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                        <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-full mb-4">
                            <Lock className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Private Profile</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                            You must be family to view {user.displayName || "this user"}'s posts and photos. Send a family request to connect!
                        </p>
                    </div>
                ) : userPosts.length === 0 ? (
                    <div className="p-8 text-center border rounded-xl bg-slate-50 dark:bg-slate-900">
                        <p className="text-gray-500 mb-2">No posts yet.</p>
                        <details className="text-xs text-left mt-4 text-slate-400">
                            <summary>Debug Info</summary>
                            <pre className="mt-2 p-2 bg-slate-200 dark:bg-slate-800 rounded overflow-auto">
                                {JSON.stringify({
                                    targetUserId: userId,
                                    viewerId: currentUser.id,
                                    hasAccess,
                                    isOwnProfile,
                                    familyStatus: familyStatus.status,
                                    role: currentUser.role
                                }, null, 2)}
                            </pre>
                        </details>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {userPosts.map(post => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
