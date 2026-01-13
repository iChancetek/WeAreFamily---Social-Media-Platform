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

import { generateContentMetadata } from "@/lib/metadata";

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
    return generateContentMetadata(post, postUrl);
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
