"use client";

import { useState, useEffect } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// Lazy load ReactPlayer for non-YouTube sources (Vimeo, SoundCloud, etc.)
// ssr: false helps avoid hydration mismatch
// using 'as any' to bypass specific type check issues with dynamic import
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

interface MediaEmbedProps {
    url: string;
}

export function MediaEmbed({ url }: MediaEmbedProps) {
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [isYouTube, setIsYouTube] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!url) {
            setIsYouTube(false);
            return;
        }

        const parsed = parseYouTubeUrl(url);
        if (parsed) {
            setEmbedUrl(parsed);
            setIsYouTube(true);
        } else {
            setIsYouTube(false);
        }
    }, [url]);

    // Render Optimized YouTube Iframe (youtube-nocookie)
    if (isYouTube && embedUrl) {
        return (
            <div className="relative w-full overflow-hidden rounded-xl bg-black border border-border mt-3 aspect-video group">
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/10 z-10 pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-lg">
                            <Play className="w-6 h-6 text-white fill-current opacity-90" />
                        </div>
                    </div>
                )}

                <iframe
                    src={embedUrl}
                    className={cn("w-full h-full", !isLoaded && "opacity-0 transition-opacity duration-300")}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setIsLoaded(true)}
                    title="Embedded Video"
                />
            </div>
        );
    }

    // Fallback to ReactPlayer for other providers (FB, Vimeo, LinkedIn)
    // ReactPlayer handles standard YouTube too, but we prioritize the custom iframe for strict requirements.
    return (
        <div className="mt-3 rounded-xl overflow-hidden border border-border bg-black aspect-video relative group">
            <ReactPlayer
                url={url}
                width="100%"
                height="100%"
                controls
                light={false}
                config={{
                    facebook: { appId: '130969678083861' }
                }}
            />
        </div>
    );
}

// Robust YouTube URL Parser
function parseYouTubeUrl(url: string): string | null {
    try {
        // Handle variations: www.youtube.com, youtube.com, m.youtube.com
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace(/^(www\.|m\.)/, '');

        let videoId = null;

        // 1. youtube.com/watch?v=ID
        if (hostname === 'youtube.com' && urlObj.pathname === '/watch') {
            videoId = urlObj.searchParams.get('v');
        }
        // 2. youtube.com/shorts/ID
        else if (hostname === 'youtube.com' && urlObj.pathname.startsWith('/shorts/')) {
            const parts = urlObj.pathname.split('/');
            // /shorts/ID... 
            videoId = parts[2];
        }
        // 3. youtu.be/ID
        else if (hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1);
        }
        // 4. youtube.com/embed/ID (if user pasted raw embed link)
        else if (hostname === 'youtube.com' && urlObj.pathname.startsWith('/embed/')) {
            videoId = urlObj.pathname.split('/embed/')[1];
        }

        if (videoId) {
            // Sanitize ID: Alphanumeric + - _
            // Remove any trailing slash or query params if extracted from pathname incorrectly
            const cleanId = videoId.split('?')[0].replace(/[^a-zA-Z0-9_-]/g, '');
            if (!cleanId) return null;

            // Always force youtube-nocookie
            return `https://www.youtube-nocookie.com/embed/${cleanId}`;
        }

        return null;
    } catch {
        // Not a valid URL
        return null;
    }
}
