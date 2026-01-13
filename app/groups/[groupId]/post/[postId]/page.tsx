import { getGroupPost, getGroup } from "@/app/actions/groups";
import { MainLayout } from "@/components/layout/main-layout";
import { PostCard } from "@/components/feed/post-card";
import { getUserProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { isUrlVideo, extractYouTubeId, fetchYouTubeTitle } from "@/lib/media-utils";
import { Metadata, ResolvingMetadata } from "next";

type Props = {
    params: Promise<{ groupId: string; postId: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

import { generateContentMetadata } from "@/lib/metadata";

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { groupId, postId } = await params;

    // We can use getGroupPost if we exported it, OR getPostGlobal if permission allows, 
    // OR the inline logic we saw before. 
    // The previous code used 'getGroupPost' but caught error.

    // Let's use getGroupPost safely.
    const { getGroupPost } = await import("@/app/actions/groups");
    let post = null;
    try {
        post = await getGroupPost(groupId, postId);
    } catch (e) { console.error(e); }

    if (!post) {
        return {
            title: 'Post Unavailable | Famio',
            description: 'This content is private or does not exist.'
        };
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
        || 'https://we-are-family-221.web.app';

    const postUrl = `${baseUrl}/groups/${groupId}/post/${postId}`;

    // Use Shared Logic
    return generateContentMetadata(post, postUrl);
}

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
