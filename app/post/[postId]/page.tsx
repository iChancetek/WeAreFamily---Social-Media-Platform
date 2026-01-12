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

    // Use actual deployment URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
        || 'https://we-are-family-221.web.app';

    const postUrl = `${baseUrl}/post/${postId}`;
    const embedUrl = `${baseUrl}/embed/post/${postId}`;

    const youtubeUrlMatch = post.content?.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/\S+/gi);
    const youtubeUrl = youtubeUrlMatch ? youtubeUrlMatch[0].replace(/[\s.,!?;:]+$/, '').trim() : null;

    // Fetch YouTube Title if available
    let videoTitle = null;
    if (youtubeUrl) {
        const yId = extractYouTubeId(youtubeUrl);
        if (yId) {
            videoTitle = await fetchYouTubeTitle(yId);
        }
    }

    const title = videoTitle || `${post.author.displayName} on Famio`;
    const description = post.content?.substring(0, 200) || `Check out this post by ${post.author.displayName}`;

    // Also check mediaUrls for uploaded videos
    const firstMedia = post.mediaUrls?.[0];
    const isVideo = isUrlVideo(firstMedia);

    // PRIORITY ORDER for thumbnail selection:
    // 1. YouTube video thumbnail (highest priority)
    // 2. Photo from mediaUrls
    // 3. Native video (future: poster frame)
    // 4. Author avatar (last resort)

    let imageUrl: string;
    let hasYouTubeVideo = false;

    // Priority 1: YouTube video thumbnail
    if (youtubeUrl) {
        const youtubeId = extractYouTubeId(youtubeUrl);
        if (youtubeId) {
            hasYouTubeVideo = true;
            // Try maxresdefault first, with fallbacks
            imageUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
        } else {
            imageUrl = post.author.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.displayName)}&size=1200&background=random`;
        }
    }
    // Priority 2: Photo from mediaUrls
    else if (firstMedia && !isVideo) {
        imageUrl = firstMedia;
    }
    // Priority 3: Native video (future enhancement for poster frame)
    // Priority 4: Author avatar (fallback)
    else {
        imageUrl = post.author.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.displayName)}&size=1200&background=random`;
    }

    // Determine if this is a video post (YouTube or uploaded video)
    const isVideoPost = hasYouTubeVideo || isVideo;

    if (isVideoPost) {
        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: 'video.other',
                url: postUrl,
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
                        type: 'text/html'
                    }
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
                        streamUrl: embedUrl,
                        width: 1280,
                        height: 720
                    }
                ]
            }
        };
    }

    // Photo or text post
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            url: postUrl,
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
