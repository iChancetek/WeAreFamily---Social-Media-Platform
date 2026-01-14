import Link from "next/link";
import React, { useState, useEffect } from "react";

interface LinkifyProps {
    text: string;
    className?: string;
    onMediaFound?: (url: string) => void;
    hideUrls?: string[];
}

export function Linkify({ text, className, onMediaFound, hideUrls }: LinkifyProps) {
    // improved regex to separate punctuation at the end of a URL
    // This captures the URL provided it starts with http/https and doesn't contain whitespace.
    // It blindly captures until a space. We will clean it up inside.
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);



    // Detect media in a side effect, not during render
    useEffect(() => {
        if (!mounted || !onMediaFound) return;

        // Re-scan text for media to notify parent (idempotent check ideally handled by parent or here)
        // For simplicity, we just find the first video and report it once if needed.
        // But since we can't easily sync "capturedMedia" across renders without state,
        // we'll skip the complex deduping here and assume onMediaFound handles it or is stable.

        let found = false;
        const matches = text.match(urlRegex) || [];

        for (const url of matches) {
            const lower = url.toLowerCase();
            const isVideo = lower.includes('youtube.com') ||
                lower.includes('youtu.be') ||
                lower.includes('facebook.com') ||
                lower.includes('linkedin.com') ||
                lower.includes('.mp4') ||
                lower.includes('vimeo.com') ||
                lower.includes('dailymotion.com');

            if (isVideo) {
                onMediaFound(url);
                found = true;
                break; // Only report the first one
            }
        }
    }, [text, mounted, onMediaFound]); // urlRegex is constant enough or we can recreate logic

    if (!text) return null;

    if (!mounted) return <span className={className}>{text}</span>;

    const parts = text.split(urlRegex);

    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (part.match(urlRegex)) {
                    // This part is a URL
                    let url = part;
                    let suffix = '';

                    // Basic cleanup for punctuation at the end of a URL
                    const lastChar = url[url.length - 1];
                    if (lastChar && (lastChar === '.' || lastChar === ',' || lastChar === '!' || lastChar === '?')) {
                        url = url.slice(0, -1);
                        suffix = lastChar;
                    }

                    // Check if this URL should be hidden (e.g. because it's embedded)
                    // We check if the exact clean URL is in the hidden list
                    if (hideUrls && hideUrls.includes(url)) {
                        return <span key={i}>{suffix}</span>;
                    }

                    return (
                        <span key={i}>
                            <Link
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline break-all"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {url}
                            </Link>
                            {suffix}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
}
