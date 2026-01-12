"use client";

import { useState, useEffect } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { LinkPreviewCard } from "./link-preview-card";

// Lazy load ReactPlayer for embeddable sources (Vimeo, SoundCloud, etc.)
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

interface MediaEmbedProps {
    url: string;
}

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

export function MediaEmbed({ url }: MediaEmbedProps) {
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [provider, setProvider] = useState<Provider>('other');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!url) {
            setProvider('other');
            return;
        }

        const detectedProvider = detectProvider(url);
        setProvider(detectedProvider);

        if (detectedProvider === 'youtube') {
            const parsed = parseYouTubeUrl(url);
            if (parsed) {
                setEmbedUrl(parsed);
            }
        }
    }, [url]);

    // YouTube: Render optimized iframe with youtube-nocookie
    if (provider === 'youtube' && embedUrl) {
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

    // LinkedIn, Facebook, Instagram: Render rich preview card (no embed allowed)
    if (provider === 'linkedin' || provider === 'facebook' || provider === 'instagram') {
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
