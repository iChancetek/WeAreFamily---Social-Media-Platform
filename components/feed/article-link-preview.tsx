'use client';

import { ExternalLink, Globe } from "lucide-react";

interface ArticleLinkPreviewProps {
    linkPreview: {
        url: string;
        image?: string | null;
        title?: string;
        description?: string | null;
        siteName?: string | null;
        source?: string;
    };
}

export function ArticleLinkPreview({ linkPreview }: ArticleLinkPreviewProps) {
    if (!linkPreview || !linkPreview.title) return null;

    let domain = '';
    try {
        domain = new URL(linkPreview.url).hostname.replace(/^www\./, '');
    } catch {
        domain = 'link';
    }

    return (
        <a
            href={linkPreview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 mb-1 rounded-xl overflow-hidden border border-border/60 bg-muted/20 hover:bg-muted/40 transition-all group shadow-sm"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Image Banner */}
            {linkPreview.image && (
                <div className="w-full h-40 sm:h-48 overflow-hidden bg-muted">
                    <img
                        src={linkPreview.image}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                </div>
            )}

            {/* Content */}
            <div className="px-3.5 py-3 space-y-1.5">
                {/* Domain */}
                <div className="flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        {linkPreview.siteName || domain}
                    </span>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {linkPreview.title}
                </h4>

                {/* Description */}
                {linkPreview.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {linkPreview.description}
                    </p>
                )}

                {/* CTA */}
                <div className="flex items-center gap-1.5 pt-1 text-xs font-medium text-primary/80 group-hover:text-primary transition-colors">
                    <span>Read Article</span>
                    <ExternalLink className="w-3 h-3" />
                </div>
            </div>
        </a>
    );
}
