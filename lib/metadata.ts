
import { Metadata } from 'next';
import { isUrlVideo, extractYouTubeId, fetchYouTubeTitle } from '@/lib/media-utils';

// Default Fallback Image — must be public-facing and permanently accessible
const OG_IMAGE_FALLBACK = "https://famio.us/icons/famio-logo.png";

type PostData = {
    content?: string;
    // New format: array of {type, url} objects (from getPostGlobal)
    media?: { type: string; url: string }[];
    // Legacy format: plain URL array
    mediaUrls?: string[];
    thumbnailUrl?: string | null;
    author?: {
        displayName?: string;
    } | null;
};

/** Normalise whichever media shape the post uses into a flat string[] of URLs */
function resolveMediaUrls(post: PostData): string[] {
    if (post.media && post.media.length > 0) {
        return post.media.map(m => m.url).filter(Boolean);
    }
    if (post.mediaUrls && post.mediaUrls.length > 0) {
        return post.mediaUrls.filter(Boolean);
    }
    return [];
}

export async function generateContentMetadata(
    post: PostData,
    canonicalUrl: string,
    embedUrl?: string
): Promise<Metadata> {

    // 1. YouTube Logic
    const youtubeUrlMatch = post.content?.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/\S+/gi);
    const youtubeUrl = youtubeUrlMatch ? youtubeUrlMatch[0].replace(/[\s.,!?;:]+$/, '').trim() : null;

    let videoTitle = null;
    if (youtubeUrl) {
        const yId = extractYouTubeId(youtubeUrl);
        if (yId) {
            videoTitle = await fetchYouTubeTitle(yId);
        }
    }

    // Title Logic
    const authorName = post.author?.displayName || "famio User";
    const title = videoTitle || (post.content ? truncate(post.content, 60) : `${authorName} on famio`);

    // Description Logic: Strip URLs to avoid ugly links in preview
    const cleanContent = post.content ? post.content.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '').trim() : '';
    const description = cleanContent
        ? truncate(cleanContent, 160)
        : (videoTitle ? `Watch "${videoTitle}" on famio` : `View this post on famio.`);


    // 2. Image Selection Logic — normalise media to URLs first
    const resolvedUrls = resolveMediaUrls(post);
    let imageUrl = OG_IMAGE_FALLBACK;
    let type = 'article';
    let videoUrlForOg: string | undefined = undefined;

    // Priority 1: YouTube
    if (youtubeUrl) {
        const yId = extractYouTubeId(youtubeUrl);
        if (yId) {
            imageUrl = `https://img.youtube.com/vi/${yId}/maxresdefault.jpg`;
            type = 'video.other';
            videoUrlForOg = youtubeUrl;
        }
    }
    // Priority 2: Explicit Thumbnail (Uploaded Video)
    else if (post.thumbnailUrl) {
        imageUrl = post.thumbnailUrl;
        if (resolvedUrls.length > 0 && isUrlVideo(resolvedUrls[0])) {
            type = 'video.other';
            videoUrlForOg = resolvedUrls[0];
        }
    }
    // Priority 3: Uploaded Media (Photo/Video)
    else if (resolvedUrls.length > 0) {
        const firstMedia = resolvedUrls[0];
        if (isUrlVideo(firstMedia)) {
            // For video: use the thumbnail if present on the media object, else famio logo
            const mediaItem = post.media?.find(m => m.url === firstMedia) as any;
            imageUrl = mediaItem?.thumbnailUrl || post.thumbnailUrl || OG_IMAGE_FALLBACK;
            type = 'video.other';
            videoUrlForOg = firstMedia;
        } else {
            // Photo — use directly as the OG image
            imageUrl = firstMedia;
        }
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: type as any,
            url: canonicalUrl,
            siteName: 'famio',
            locale: 'en_US',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                    type: 'image/jpeg'
                }
            ],
            // Enhanced video metadata for player embeds
            ...(videoUrlForOg && {
                videos: [
                    {
                        url: videoUrlForOg,
                        secureUrl: videoUrlForOg.startsWith('https') ? videoUrlForOg : undefined,
                        type: 'video/mp4',
                        width: 1280,
                        height: 720,
                    }
                ]
            }),
            // Additional metadata for better SEO
            ...(post.author?.displayName && {
                article: {
                    authors: [post.author.displayName],
                    publishedTime: new Date().toISOString(),
                }
            })
        },
        twitter: {
            card: videoUrlForOg ? 'player' : 'summary_large_image',
            title,
            description,
            images: [imageUrl],
            site: '@famio',
            creator: post.author?.displayName ? `@${post.author.displayName.replace(/\s+/g, '')}` : '@famio',
            // Twitter player for videos
            ...(videoUrlForOg && {
                players: [{
                    playerUrl: embedUrl || canonicalUrl,
                    streamUrl: videoUrlForOg,
                    width: 1280,
                    height: 720,
                }]
            })
        },
        // Additional tags for rich previews
        metadataBase: new URL(new URL(canonicalUrl).origin),
        alternates: {
            canonical: canonicalUrl
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-image-preview': 'large',
                'max-snippet': -1,
                'max-video-preview': -1
            }
        }
    };
}

function truncate(str: string, n: number) {
    return (str.length > n) ? str.slice(0, n - 1) + '...' : str;
}
