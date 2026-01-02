import { MainLayout } from "@/components/layout/main-layout";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileHeader } from "@/components/profile/profile-header";
import { FamilyMembersCard } from "@/components/profile/family-members-card";
import { PostCard } from "@/components/feed/post-card";
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

    return (
        <MainLayout className="max-w-6xl">
            <div className="pb-16 pt-0">
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
                            posts.map((post) => (
                                <PostCard key={post.id} post={post as any} currentUserId={user.id} />
                            ))
                        ) : (
                            <div className="bg-white dark:bg-card rounded-xl p-12 text-center border border-dashed border-gray-200 dark:border-white/10">
                                <p className="text-muted-foreground">No posts yet. Share your first moment!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
