import { getPostGlobal } from "@/app/actions/posts";
import { MainLayout } from "@/components/layout/main-layout";
import { PostCard } from "@/components/feed/post-card";
import { getUserProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Metadata, ResolvingMetadata } from "next";
import { isUrlVideo, extractYouTubeId, fetchYouTubeTitle } from "@/lib/media-utils";

type Props = {
    params: Promise<{ postId: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

import { generateContentMetadata } from "@/lib/metadata";

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { postId } = await params;

    const post = await getPostGlobal(postId);

    if (!post || post.engagementSettings?.privacy === 'private') {
        return {
            title: 'Post Unavailable | Famio',
            description: 'This content is private or does not exist.'
        };
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
        || 'https://we-are-family-221.web.app';

    const postUrl = `${baseUrl}/post/${postId}`;
    const embedUrl = `${baseUrl}/embed/post/${postId}`;

    return generateContentMetadata(post, postUrl, embedUrl);
}



export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
    const { postId } = await params;
    const post = await getPostGlobal(postId);

    if (!post) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
                    <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
                    <p className="text-muted-foreground mb-6">This post may have been deleted or does not exist.</p>
                    <Link href="/">
                        <Button>
                            <ArrowLeft className="mr-2 w-4 h-4" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </MainLayout>
        );
    }

    const user = await getUserProfile();

    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto py-8">
                <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                    <ArrowLeft className="mr-1 w-4 h-4" />
                    Back to Feed
                </Link>
                <PostCard post={post} currentUserId={user?.id} />
            </div>
        </MainLayout>
    );
}
