"use client";

import { useState, useEffect } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { LinkPreviewCard } from "./link-preview-card";
import { LinkedInViewer } from "./linkedin-viewer";

// Lazy load ReactPlayer for embeddable sources (Vimeo, SoundCloud, etc.)
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

type Provider = 'youtube' | 'linkedin' | 'facebook' | 'instagram' | 'vimeo' | 'other';

function detectProvider(url: string): Provider {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace(/^(www\.|m\.)/, '');

        if (hostname.includes('youtube.com') || hostname === 'youtu.be') {
            return 'youtube';
        }
        if (hostname.includes('linkedin.com')) {
            return 'linkedin';
        }
        if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) {
            return 'facebook';
        }
        if (hostname.includes('instagram.com')) {
            return 'instagram';
        }
        if (hostname.includes('vimeo.com')) {
            return 'vimeo';
        }

        return 'other';
    } catch {
        return 'other';
    }
}

// YouTube Metadata Component — fetches title & channel via oEmbed
function YouTubeMetadata({ url }: { url: string }) {
    const [metadata, setMetadata] = useState<{ title: string; author_name: string } | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (!cancelled && data) setMetadata(data);
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [url]);

    if (!metadata) return null;

    return (
        <div className="px-3.5 py-2.5 bg-card/80 border-t border-border/30 space-y-0.5">
            <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{metadata.title}</p>
            <p className="text-xs text-muted-foreground">{metadata.author_name}</p>
        </div>
    );
}

interface MediaEmbedProps {
    url: string;
    playInline?: boolean;
    onPlayRequest?: () => void;
}

export function MediaEmbed({ url, playInline = true, onPlayRequest }: MediaEmbedProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    // Derived state (no effects needed)
    const provider = detectProvider(url || '');
    const embedUrl = provider === 'youtube' && url ? parseYouTubeUrl(url) : null;

    // YouTube: ALWAYS render inline iframe + metadata
    if (provider === 'youtube' && embedUrl) {
        return (
            <div className="relative w-full overflow-hidden rounded-xl bg-black border border-border mt-3">
                <div className="aspect-video relative">
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

                {/* YouTube Title & Channel Metadata */}
                <YouTubeMetadata url={url} />
            </div>
        );
    }

    // LinkedIn: Render AI-powered content viewer (no embed allowed)
    if (provider === 'linkedin') {
        return (
            <LinkedInViewer
                url={url}
                title={extractTitle(url, provider)}
                description={extractDescription(provider)}
            />
        );
    }

    // Facebook, Instagram: Render rich preview card (no embed allowed)
    if (provider === 'facebook' || provider === 'instagram') {
        return (
            <LinkPreviewCard
                url={url}
                provider={provider}
                title={extractTitle(url, provider)}
                description={extractDescription(provider)}
            />
        );
    }

    // Vimeo and other embeddable providers: Use ReactPlayer
    // If !playInline, we use 'light' mode which shows thumbnail.
    return (
        <div
            className="mt-3 rounded-xl overflow-hidden border border-border bg-black aspect-video relative group cursor-pointer"
            onClick={!playInline && onPlayRequest ? (e) => { e.stopPropagation(); onPlayRequest(); } : undefined}
        >
            <ReactPlayer
                url={url}
                width="100%"
                height="100%"
                controls={playInline}
                light={!playInline} // Shows thumbnail if not inline
                // If light=true, clicking it normally plays it. We intercept via wrapper onClick if needed.
                // However, ReactPlayer 'light' mode usually handles click to play.
                // To force our custom enlargement, we might need a custom overlay or use playIcon prop.
                playIcon={
                    !playInline ? (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-6 h-6 text-white fill-current" />
                            </div>
                        </div>
                    ) : undefined
                }
                config={{
                    facebook: { appId: '130969678083861' }
                }}
            />
        </div>
    );
}

// Helper: Extract title from URL
function extractTitle(url: string, provider: Provider): string {
    try {
        const urlObj = new URL(url);

        if (provider === 'linkedin') {
            if (url.includes('/feed/update')) {
                return 'LinkedIn Post';
            }
            if (url.includes('/posts/')) {
                return 'LinkedIn Post';
            }
            if (url.includes('/video/')) {
                return 'LinkedIn Video';
            }
            return 'LinkedIn Content';
        }

        if (provider === 'facebook') {
            return 'Facebook Post';
        }

        if (provider === 'instagram') {
            return 'Instagram Post';
        }

        return 'Shared Content';
    } catch {
        return 'Shared Link';
    }
}

// Helper: Extract description based on provider
function extractDescription(provider: Provider): string {
    const descriptions: Record<Provider, string> = {
        youtube: '',
        linkedin: 'View this post on LinkedIn',
        facebook: 'View this post on Facebook',
        instagram: 'View this post on Instagram',
        vimeo: '',
        other: 'Click to view content'
    };

    return descriptions[provider];
}

// Robust YouTube URL Parser
function parseYouTubeUrl(url: string): string | null {
    try {
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
            videoId = parts[2];
        }
        // 3. youtu.be/ID
        else if (hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1);
        }
        // 4. youtube.com/embed/ID
        else if (hostname === 'youtube.com' && urlObj.pathname.startsWith('/embed/')) {
            videoId = urlObj.pathname.split('/embed/')[1];
        }

        if (videoId) {
            const cleanId = videoId.split('?')[0].replace(/[^a-zA-Z0-9_-]/g, '');
            if (!cleanId) return null;

            return `https://www.youtube-nocookie.com/embed/${cleanId}`;
        }

        return null;
    } catch {
        return null;
    }
}
