import Link from "next/link";

interface LinkifyProps {
    text: string;
    className?: string;
    onMediaFound?: (url: string) => void;
    hideUrls?: string[];
}

export function Linkify({ text, className, onMediaFound, hideUrls }: LinkifyProps) {
    if (!text) return null;

    // improved regex to separate punctuation at the end of a URL
    // This captures the URL provided it starts with http/https and doesn't contain whitespace.
    // It blindly captures until a space. We will clean it up inside.
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const parts = text.split(urlRegex);
    let capturedMedia = false;

    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (part.match(urlRegex)) {
                    // Check for trailing punctuation (common issue: "Check this https://link.com.")
                    // match a URL that might end with punctuation
                    const match = part.match(/^(https?:\/\/[^\s]+?)([.,!?;:]?)$/);
                    let url = part;
                    let suffix = "";

                    if (match) {
                        url = match[1];
                        suffix = match[2];
                    }

                    // Simple check for video URL to notify parent
                    if (onMediaFound && !capturedMedia) {
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
                            capturedMedia = true;
                        }
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
