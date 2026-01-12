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
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

type Props = {
    params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { userId } = await params;

    try {
        const userDoc = await adminDb.collection("users").doc(userId).get();

        if (!userDoc.exists) {
            return {
                title: 'Profile Not Found | Famio',
                description: 'This profile does not exist.'
            };
        }

        const userData = userDoc.data()!;
        // Show metadata by default, only hide if explicitly set to false (private)
        const isExplicitlyPrivate = userData.isPublicProfile === false;

        // Privacy: Only hide metadata for explicitly private profiles
        if (isExplicitlyPrivate) {
            return {
                title: 'Famio Profile',
                description: 'This profile is private.',
                openGraph: {
                    type: 'website',
                    title: 'Famio Profile',
                    description: 'This profile is private.',
                    siteName: 'Famio'
                }
            };
        }

        // Build display name
        const displayName = ((userData.displayName && userData.displayName !== "Family Member")
            ? userData.displayName
            : null)
            || (userData.profileData?.firstName
                ? `${userData.profileData.firstName} ${userData.profileData.lastName || ''}`.trim()
                : null)
            || "Famio Member";

        const bio = userData.bio || "Member on Famio. View profile and activity.";

        // Use actual image URL from Firebase Storage or fallback to a placeholder
        // Firebase Storage URLs are publicly accessible if the bucket has public read rules
        const imageUrl = userData.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=400&background=random`;

        // Use the actual deployment URL (production or preview)
        // This ensures the URLs work regardless of where the app is hosted
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
            || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
            || 'https://we-are-family-221.web.app';

        const profileUrl = `${baseUrl}/u/${userId}`;

        return {
            title: `${displayName} | Famio`,
            description: bio,
            openGraph: {
                type: 'profile',
                title: displayName,
                description: bio,
                url: profileUrl,
                siteName: 'Famio',
                images: [
                    {
                        url: imageUrl,
                        width: 400,
                        height: 400,
                        alt: `${displayName}'s profile photo`
                    }
                ]
            },
            twitter: {
                card: 'summary',
                title: `${displayName} | Famio`,
                description: bio,
                images: [imageUrl]
            }
        };
    } catch (error) {
        console.error('Error generating profile metadata:', error);
        return {
            title: 'Famio Profile',
            description: 'Member profile on Famio'
        };
    }
}


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

    // Privacy Logic: Owner OR Family OR Public Profile
    const userData = userDoc.data()!;
    const isPublicProfile = userData.isPublicProfile === true;

    // STRICT ACCESS CHECK
    const hasAccess = isOwnProfile || familyStatus.status === 'accepted' || currentUser.role === 'admin' || isPublicProfile;

    // Sanitize user data based on access
    // If public but NOT family/owner, we show LIMITED data.
    const isFamilyOrOwner = isOwnProfile || familyStatus.status === 'accepted' || currentUser.role === 'admin';
    const showFullProfile = isFamilyOrOwner;

    const user = sanitizeData({
        id: userDoc.id,
        displayName: ((userData.displayName && userData.displayName !== "Family Member") ? userData.displayName : null) || (userData.profileData?.firstName ? `${userData.profileData.firstName} ${userData.profileData.lastName || ''}`.trim() : null) || userData.email?.split('@')[0] || "Unknown",
        imageUrl: userData.imageUrl,
        // Public Data (Allowed for everyone)
        isPublicProfile: userData.isPublicProfile,

        // Private Data (Only for Owner/Family)
        ...(showFullProfile ? userData : {}),

        // Explicit overrides for safety
        coverUrl: showFullProfile ? userData.coverUrl : null,
        coverType: showFullProfile ? userData.coverType : null,
        bio: showFullProfile ? userData.bio : null,
        email: showFullProfile ? userData.email : null,
    });

    // Fetch user posts
    console.log(`Checking profile access for viewer ${currentUser.id} to target ${userId}`);
    console.log(`Access status: isOwn=${isOwnProfile}, family=${familyStatus.status}, pub=${isPublicProfile}`);
    console.log(`Has Access: ${hasAccess}`);

    const userPosts = hasAccess ? await getUserPosts(userId) : [];
    console.log(`Fetched ${userPosts.length} posts for profile ${userId}`);

    const { getUserFamilyMembers } = await import("@/app/actions/family");
    const userFamily = hasAccess ? await getUserFamilyMembers(userId) : [];

    // Check if user is blocked by current user
    const { getBlockedUsers } = await import("@/app/actions/security");
    const blockedQueue = await getBlockedUsers();
    const isBlocked = blockedQueue.some(u => u.id === userId);

    return (
        <MainLayout>
            <ProfileHeader
                user={user}
                isCurrentUser={isOwnProfile}
                isBlocked={isBlocked}
            />
            <div className="mt-8">
                {!hasAccess ? (
                    <div className="flex flex-col items-center justify-center p-10 bg-slate-50 dark:bg-card rounded-lg border border-slate-200 dark:border-border text-center">
                        <div className="bg-slate-200 dark:bg-muted p-4 rounded-full mb-4">
                            <Lock className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Private Profile</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">
                            This profile is private. You must be family to view {user.displayName || "this user"}'s posts and photos.
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
