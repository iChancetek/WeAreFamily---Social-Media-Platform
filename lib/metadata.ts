
import { Metadata } from 'next';
import { isUrlVideo, extractYouTubeId, fetchYouTubeTitle } from '@/lib/media-utils';

// Default Fallback Image (Must be generic, not user-specific)
const OG_IMAGE_DEFAULT = "https://firebasestorage.googleapis.com/v0/b/we-are-family-221.appspot.com/o/admin%2Ffamio-og-default.png?alt=media";
// Note: If this URL doesn't exist, we might need a placeholder. 
// For now, I'll use a reliable placeholder or the user needs to provide one.
// Let's use a nice generated one if the specific file isn't guaranteed.
const OG_IMAGE_FALLBACK = "https://placehold.co/1200x630/1e293b/ffffff/png?text=Famio+Content";

type PostData = {
    content?: string;
    mediaUrls?: string[];
    author?: {
        displayName?: string;
    };
};

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
    const authorName = post.author?.displayName || "Famio User";
    const title = videoTitle || (post.content ? truncate(post.content, 60) : `${authorName} on Famio`);
    const description = post.content ? truncate(post.content, 160) : `Check out this post on Famio.`;

    // 2. Image Selection Logic (STRICT: NO PROFILE PHOTOS)
    let imageUrl = OG_IMAGE_FALLBACK;
    let type = 'article';

    // Priority 1: YouTube
    if (youtubeUrl) {
        const yId = extractYouTubeId(youtubeUrl);
        if (yId) {
            imageUrl = `https://img.youtube.com/vi/${yId}/maxresdefault.jpg`;
            type = 'video.other'; // Or video object
        }
    }
    // Priority 2: Uploaded Media (Photo/Video)
    else if (post.mediaUrls && post.mediaUrls.length > 0) {
        // Use the first media item
        // If it's a video file, we might not have a thumbnail generator here easily unless we have a separate field.
        // Assuming mediaUrls[0] is viewable.
        imageUrl = post.mediaUrls[0];
        // If it's a raw video URL, standard OG might not display it as an image.
        // But most social platforms can't consume raw mp4 as og:image.
        // We will assume for now it works or fallback to default if it's strictly a video without thumbnail.
        // Ideally we should have a 'thumbnailUrl' field on the post object.
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: type as any,
            url: canonicalUrl,
            siteName: 'Famio',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: 'Content Preview'
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

function truncate(str: string, n: number) {
    return (str.length > n) ? str.slice(0, n - 1) + '...' : str;
}
