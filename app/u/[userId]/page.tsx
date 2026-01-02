import { MainLayout } from "@/components/layout/main-layout";
import { db } from "@/db";
import { users, posts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PostCard } from "@/components/feed/post-card";
import { getUserProfile } from "@/lib/auth";

import { getFamilyStatus } from "@/app/actions/family";
import { Lock } from "lucide-react";

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const currentUser = await getUserProfile();
    if (!currentUser || currentUser.role === 'pending') {
        redirect("/");
    }

    const { userId } = await params;
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
    });

    if (!user) {
        notFound();
    }

    const isOwnProfile = currentUser.id === userId;
    const familyStatus = await getFamilyStatus(userId);
    const hasAccess = isOwnProfile || familyStatus.status === 'accepted' || currentUser.role === 'admin';

    const userPosts = hasAccess ? await db.query.posts.findMany({
        where: eq(posts.authorId, userId),
        orderBy: [desc(posts.createdAt)],
        with: {
            author: true
        }
    }) : [];

    return (
        <MainLayout>
            <ProfileHeader user={user} isOwnProfile={isOwnProfile} familyStatus={familyStatus} />
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
