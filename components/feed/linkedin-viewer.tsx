'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Sparkles, MessageCircle, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";
import { analyzeLinkedInContent, LinkedInContent } from '@/app/actions/linkedin';

interface LinkedInViewerProps {
    url: string;
    title?: string;
    description?: string;
    thumbnail?: string;
}

export function LinkedInViewer({ url, title, description, thumbnail }: LinkedInViewerProps) {
    const [content, setContent] = useState<LinkedInContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [showInsights, setShowInsights] = useState(true);

    useEffect(() => {
        loadContent();
    }, [url]);

    async function loadContent() {
        setLoading(true);
        try {
            const result = await analyzeLinkedInContent(url, { title, description, image: thumbnail });
            setContent(result);
        } catch (error) {
            console.error('Failed to load LinkedIn content:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="mt-3 rounded-xl border border-border bg-card p-6 animate-pulse">
                <div className="flex gap-4">
                    <div className="w-24 h-24 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                </div>
            </div>
        );
    }

    if (!content) return null;

    const hasAI = content.aiSummary && content.aiSummary.keyInsights.length > 0;

    return (
        <div className="mt-3 rounded-xl border-2 border-blue-600/20 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600/10 px-4 py-2 border-b border-blue-600/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                        LinkedIn Content
                    </span>
                </div>
                {hasAI && (
                    <button
                        onClick={() => setShowInsights(!showInsights)}
                        className="flex items-center gap-1 text-xs text-blue-600/80 hover:text-blue-600 transition-colors"
                    >
                        <Sparkles className="w-3 h-3" />
                        <span>AI Insights</span>
                        <span className="text-[10px]">{showInsights ? '▼' : '▶'}</span>
                    </button>
                )}
            </div>

            <div className="p-4">
                {/* Content Preview */}
                <div className="flex gap-4 mb-4">
                    {content.image && (
                        <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-muted">
                            <img
                                src={content.image}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base line-clamp-2 mb-1">
                            {content.title || 'LinkedIn Post'}
                        </h4>
                        {content.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {content.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* AI Insights */}
                {hasAI && showInsights && content.aiSummary && (
                    <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-lg p-4 space-y-3 mb-4">
                        {/* Topic */}
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                                AI Analysis
                            </span>
                        </div>

                        <div className="space-y-3 text-sm">
                            {/* Topic Badge */}
                            <div>
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                                    📌 {content.aiSummary.topic}
                                </span>
                            </div>

                            {/* Key Insights */}
                            <div>
                                <div className="font-semibold text-foreground/90 mb-1.5">Key Insights</div>
                                <div className="space-y-1.5">
                                    {content.aiSummary.keyInsights.map((insight, i) => (
                                        <div key={i} className="flex gap-2">
                                            <span className="text-primary/60 flex-shrink-0">•</span>
                                            <span className="text-foreground/80">{insight}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Why It Matters */}
                            {content.aiSummary.whyItMatters && (
                                <div className="pt-2 border-t border-primary/10">
                                    <div className="font-semibold text-primary/80 mb-1">Why It Matters</div>
                                    <p className="text-foreground/70 italic">{content.aiSummary.whyItMatters}</p>
                                </div>
                            )}

                            {/* Discussion Prompts */}
                            {content.aiSummary.discussionPrompts && content.aiSummary.discussionPrompts.length > 0 && (
                                <div className="pt-2 border-t border-primary/10">
                                    <div className="flex items-center gap-1.5 font-semibold text-primary/80 mb-2">
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span>Discuss</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {content.aiSummary.discussionPrompts.map((prompt, i) => (
                                            <div key={i} className="text-foreground/70 text-xs">
                                                • {prompt}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="text-[10px] text-muted-foreground/60 pt-2 border-t border-primary/5">
                            AI-generated insights. View original for full context.
                        </div>
                    </div>
                )}

                {/* View Original Button */}
                <a
                    href={content.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors",
                        "bg-blue-600 hover:bg-blue-700"
                    )}
                >
                    <span>View Original on LinkedIn</span>
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
}
