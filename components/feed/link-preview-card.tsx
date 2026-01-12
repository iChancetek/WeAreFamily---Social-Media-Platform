'use client';

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkPreviewCardProps {
    url: string;
    provider: 'linkedin' | 'facebook' | 'instagram' | 'other';
    title?: string;
    description?: string;
    thumbnail?: string;
}

export function LinkPreviewCard({ url, provider, title, description, thumbnail }: LinkPreviewCardProps) {
    const providerConfig = {
        linkedin: {
            name: 'LinkedIn',
            logo: '🔗',
            color: 'bg-blue-600',
            ctaText: 'View on LinkedIn'
        },
        facebook: {
            name: 'Facebook',
            logo: '📘',
            color: 'bg-blue-500',
            ctaText: 'View on Facebook'
        },
        instagram: {
            name: 'Instagram',
            logo: '📷',
            color: 'bg-pink-500',
            ctaText: 'View on Instagram'
        },
        other: {
            name: 'External Link',
            logo: '🔗',
            color: 'bg-gray-600',
            ctaText: 'View Link'
        }
    };

    const config = providerConfig[provider];

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 rounded-xl overflow-hidden border border-border bg-card hover:bg-muted/50 transition-colors group"
        >
            <div className="flex gap-4 p-4">
                {thumbnail && (
                    <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-muted">
                        <img
                            src={thumbnail}
                            alt=""
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                    </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{config.logo}</span>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {config.name}
                        </span>
                    </div>

                    {title && (
                        <h4 className="font-semibold text-sm sm:text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                            {title}
                        </h4>
                    )}

                    {description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
                            {description}
                        </p>
                    )}

                    <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-white self-start",
                        config.color
                    )}>
                        <span>{config.ctaText}</span>
                        <ExternalLink className="w-3 h-3" />
                    </div>
                </div>
            </div>
        </a>
    );
}
