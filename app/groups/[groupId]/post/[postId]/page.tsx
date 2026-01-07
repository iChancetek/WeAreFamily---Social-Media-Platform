import { getGroupPost, getGroup } from "@/app/actions/groups";
import { MainLayout } from "@/components/layout/main-layout";
import { PostCard } from "@/components/feed/post-card";
import { getUserProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function GroupPostPage({ params }: { params: Promise<{ groupId: string; postId: string }> }) {
    const { groupId, postId } = await params;
    const group = await getGroup(groupId);
    // Note: getGroupPost might need to be created if not exists, 
    // BUT we can usually just 'getGroupPosts' and find it, or simpler: use a direct fetch helper.
    // Let's assume we need to add 'getGroupPost' single fetcher or reuse getPostGlobal logic implicitly?
    // Actually, let's look at actions/groups.ts - we don't have getGroupPost (single).
    // I'll add a quick fetch here or add to actions. Adding to actions is cleaner.

    // TEMPORARY: Adding inline fetch logic for speed, then refactor to action if needed.
    // Actually, I can use the 'toggleReaction's helper logic but for reading.

    // Better: let's import the NEW getPostGlobal I just made? 
    // getPostGlobal currently only checks main feed.

    // Let's add 'getGroupPost' to actions/groups.ts quickly.
    // For now, I will error if action not ready.
    // Wait, I can just use getPostGlobal if I update it?
    // No, creating specific page means I know the context.

    // Let's implement getting the post.
    const { getGroupPost } = await import("@/app/actions/groups");
    const post = await getGroupPost(groupId, postId);

    if (!post || !group) return notFound();

    const user = await getUserProfile();

    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto py-8">
                <Link href={`/groups/${groupId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                    <ArrowLeft className="mr-1 w-4 h-4" />
                    Back to {group.name}
                </Link>
                <PostCard post={post} currentUserId={user?.id} />
            </div>
        </MainLayout>
    );
}
