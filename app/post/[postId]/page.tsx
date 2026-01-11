import { getPostGlobal } from "@/app/actions/posts";
import { MainLayout } from "@/components/layout/main-layout";
import { PostCard } from "@/components/feed/post-card";
import { getUserProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Metadata, ResolvingMetadata } from "next";
import { isUrlVideo } from "@/lib/media-utils";

type Props = {
    params: Promise<{ postId: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { postId } = await params;

    // Fetch post data
    const post = await getPostGlobal(postId);

    if (!post || post.engagementSettings?.privacy === 'private') {
        return {
            title: 'Post Unavailable | Famio',
            description: 'This content is private or does not exist.'
        };
    }

    const title = `${post.author.displayName} on Famio`;
    const description = post.content || `Check out this post by ${post.author.displayName}`;
    const firstMedia = post.mediaUrls?.[0];
    const isVideo = isUrlVideo(firstMedia);

    // Initial thumbnail fallback: author image or default
    let imageUrl = post.author.imageUrl || 'https://famio.us/og-default.jpg';

    // If it's a photo post, use the photo
    if (firstMedia && !isVideo) {
        imageUrl = firstMedia;
    }
    // If video, we ideally want a thumbnail. Since we don't have one generated yet, 
    // we fallback to author image or site default unless we can extract frame (hard on server).
    // Some platforms scrape video for thumbnail if og:video is present.

    const embedUrl = `https://famio.us/embed/post/${postId}`;

    if (isVideo) {
        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: 'video.other',
                url: `https://famio.us/post/${postId}`,
                siteName: 'Famio',
                images: [
                    {
                        url: imageUrl,
                        width: 1200,
                        height: 630,
                        alt: 'Video Thumbnail'
                    }
                ],
                videos: [
                    {
                        url: embedUrl,
                        width: 1280,
                        height: 720,
                        type: 'text/html' // Secure Iframe
                    },
                    // Optional: Add direct mp4 source if we want "native" native (some platforms prefer direct stream)
                    // { url: firstMedia, type: 'video/mp4', ... } 
                    // But requirement says "match YouTube ID behavior" which implies text/html embed.
                ],
            },
            twitter: {
                card: 'player',
                title,
                description,
                images: [imageUrl],
                players: [
                    {
                        playerUrl: embedUrl,
                        width: 1280,
                        height: 720
                    }
                ]
            }
        };
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            url: `https://famio.us/post/${postId}`,
            siteName: 'Famio',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: 'Post Image'
                }
            ]
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        }
    };
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
