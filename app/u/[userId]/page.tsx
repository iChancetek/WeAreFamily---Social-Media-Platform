import { MainLayout } from "@/components/layout/main-layout";
import { db } from "@/db";
import { users, posts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PostCard } from "@/components/feed/post-card";
import { getUserProfile } from "@/lib/auth";

export default async function ProfilePage({ params }: { params: { userId: string } }) {
    const currentUser = await getUserProfile();
    if (!currentUser || currentUser.role === 'pending') {
        redirect("/");
    }

    const userId = params.userId;
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
    });

    if (!user) {
        notFound();
    }

    const userPosts = await db.query.posts.findMany({
        where: eq(posts.authorId, userId),
        orderBy: [desc(posts.createdAt)],
        with: {
            author: true
        }
    });

    return (
        <MainLayout>
            <ProfileHeader user={user} isOwnProfile={currentUser.id === userId} />
            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Personal Timeline</h2>
                {userPosts.length === 0 ? (
                    <p className="text-gray-500">No posts yet.</p>
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
