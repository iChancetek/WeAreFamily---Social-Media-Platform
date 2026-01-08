import Link from "next/link";

interface LinkifyProps {
    text: string;
    className?: string;
    onMediaFound?: (url: string) => void;
}

export function Linkify({ text, className, onMediaFound }: LinkifyProps) {
    if (!text) return null;

    // Regex to find URLs (http/https)
    // We use a simple regex that captures common URL patterns
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const parts = text.split(urlRegex);
    let capturedMedia = false;

    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (part.match(urlRegex)) {
                    const url = part;

                    // Simple check for video URL to notify parent
                    // We only notify the first one we find
                    if (onMediaFound && !capturedMedia) {
                        const lower = url.toLowerCase();
                        const isVideo = lower.includes('youtube.com') ||
                            lower.includes('youtu.be') ||
                            lower.includes('facebook.com') ||
                            lower.includes('linkedin.com') || // LinkedIn video link
                            lower.includes('.mp4') ||
                            lower.includes('vimeo.com') ||
                            lower.includes('dailymotion.com');

                        if (isVideo) {
                            onMediaFound(url);
                            capturedMedia = true;
                        }
                    }

                    return (
                        <Link
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all"
                            onClick={(e) => e.stopPropagation()} // Prevent bubble to card click
                        >
                            {url}
                        </Link>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
}
