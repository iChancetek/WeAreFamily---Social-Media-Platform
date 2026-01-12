
export function isUrlVideo(url: string | null | undefined): boolean {
    if (!url) return false;
    // Check for common video extensions
    if (/\.(mp4|webm|ogg|mov)$/i.test(url)) return true;
    // Check for Firebase Storage video paths (often have tokens but the path has extension)
    if (url.includes("/o/") && (url.includes(".mp4") || url.includes(".webm") || url.includes(".mov"))) return true;

    // Check for YouTube/Vimeo/etc links explicitly if we consider those "Video Content" in terms of OG Tags?
    // User prompt implies "Famio content (videos, photos...)" which usually means uploaded media.
    // YouTube links embedded in posts are "links", not necessarily "Famio Videos".
    // But if the post content IS a YouTube link, we might treat it as video?
    // For now, focusing on uploaded files.
    return false;
}

export function getMediaType(url: string): 'video' | 'image' | 'unknown' {
    if (isUrlVideo(url)) return 'video';
    if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url)) return 'image';
    if (url.includes("/o/") && (url.includes(".jpg") || url.includes(".png") || url.includes(".webp"))) return 'image';
    return 'unknown';
}

export function extractYouTubeId(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace(/^(www\.|m\.)/, '');

        if (hostname === 'youtube.com' && urlObj.pathname === '/watch') {
            return urlObj.searchParams.get('v');
        }
        if (hostname === 'youtube.com' && urlObj.pathname.startsWith('/shorts/')) {
            return urlObj.pathname.split('/')[2];
        }
        if (hostname === 'youtu.be') {
            return urlObj.pathname.slice(1);
        }
        if (hostname === 'youtube.com' && urlObj.pathname.startsWith('/embed/')) {
            return urlObj.pathname.split('/embed/')[1];
        }

        return null;
    } catch {
        return null;
    }
}

export async function fetchYouTubeTitle(videoId: string): Promise<string | null> {
    try {
        const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!res.ok) return null;

        const data = await res.json();
        return data.title || null;
    } catch (error) {
        console.error("Error fetching YouTube title:", error);
        return null;
    }
}
