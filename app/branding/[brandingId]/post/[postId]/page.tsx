import { getBrandingPost, getBranding } from "@/app/actions/branding";
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
    params: Promise<{ brandingId: string; postId: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { brandingId, postId } = await params;

    // Dynamically import or just hope it's tree-shaken well, but better to use import like in component or static import.
    // The component used dynamic import: const { getBrandingPost } = await import("@/app/actions/branding");
    // I can do the same.
    const { getBrandingPost } = await import("@/app/actions/branding");

    let post = null;
    try {
        post = await getBrandingPost(brandingId, postId);
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

    const postUrl = `${baseUrl}/branding/${brandingId}/post/${postId}`;

    // Check for YouTube URL in post content
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

    const title = videoTitle || (post.author?.displayName ? `${post.author.displayName} on Famio` : 'Famio Post');
    const description = post.content?.substring(0, 200) || `Check out this post on Famio`;

    // Also check mediaUrls for uploaded videos
    const firstMedia = post.mediaUrls?.[0];
    const isVideo = isUrlVideo(firstMedia);

    let imageUrl: string;
    let hasYouTubeVideo = false;

    // Priority 1: YouTube video thumbnail
    if (youtubeUrl) {
        const youtubeId = extractYouTubeId(youtubeUrl);
        if (youtubeId) {
            hasYouTubeVideo = true;
            imageUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
        } else {
            imageUrl = post.author?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.displayName || 'Page')}&size=1200&background=random`;
        }
    }
    // Priority 2: Photo from mediaUrls
    else if (firstMedia && !isVideo) {
        imageUrl = firstMedia;
    }
    else {
        imageUrl = post.author?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.displayName || 'Page')}&size=1200&background=random`;
    }

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

export default async function BrandingPostPage({ params }: { params: Promise<{ brandingId: string; postId: string }> }) {
    const { brandingId, postId } = await params;
    const branding = await getBranding(brandingId);

    const { getBrandingPost } = await import("@/app/actions/branding");
    const post = await getBrandingPost(brandingId, postId);

    if (!post || !branding) return notFound();

    const user = await getUserProfile();

    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto py-8">
                <Link href={`/branding/${brandingId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                    <ArrowLeft className="mr-1 w-4 h-4" />
                    Back to {branding.name}
                </Link>
                <PostCard post={post} currentUserId={user?.id} />
            </div>
        </MainLayout>
    );
}
