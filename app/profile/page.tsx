import { MainLayout } from "@/components/layout/main-layout";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileHeader } from "@/components/profile/profile-header";
import { FamilyMembersCard } from "@/components/profile/family-members-card";
import { PostCard } from "@/components/feed/post-card";
import { MasonryFeed } from "@/components/feed/masonry-feed";
import { getUserPosts } from "@/app/actions/posts";
import { getFamilyMembers } from "@/app/actions/family";
import { CreatePost } from "@/components/feed/create-post";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const user = await getUserProfile();

    if (!user || user.role === 'pending') {
        redirect("/");
    }

    const [familyMembers, posts] = await Promise.all([
        getFamilyMembers(),
        getUserPosts(user.id)
    ]);

    // DEBUG: Log to server console
    console.log("Profile Debug:", {
        userId: user.id,
        userEmail: user.email,
        postsCount: posts?.length || 0,
        hasPosts: posts && posts.length > 0
    });

    return (
        <MainLayout className="max-w-6xl">
            <div className="pb-16 pt-0">
                {/* DEBUG: Show User ID to verify identity */}
                <div className="text-xs text-center py-2 font-mono text-muted-foreground bg-secondary/20 rounded mb-2">
                    Debug ID: {user.id}
                </div>
                <ProfileHeader user={user as any} isCurrentUser={true} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                    {/* Left Column: Sidebar Info */}
                    <div className="lg:col-span-4 space-y-6">
                        <FamilyMembersCard members={familyMembers as any} />
                    </div>

                    {/* Right Column: Timeline Feed */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Add CreatePost component */}
                        <CreatePost />

                        {posts.length > 0 ? (
                            <MasonryFeed posts={posts} currentUserId={user.id} variant="pinterest-mobile" />
                        ) : (
                            <div className="bg-white dark:bg-card rounded-xl p-12 text-center border border-dashed border-gray-200 dark:border-white/10">
                                <p className="text-muted-foreground">No posts yet. Share your first moment!</p>
                                <p className="text-xs text-muted-foreground mt-2 font-mono">
                                    User ID: {user.id?.substring(0, 12)}... | Posts: {posts?.length || 0}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
