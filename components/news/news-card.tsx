'use client';

import { NewsItem } from "@/app/actions/news";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function NewsCard({ item }: { item: NewsItem }) {
    const [showAI, setShowAI] = useState(false);

    let timeAgo = '';
    try {
        if (item.pubDate) {
            timeAgo = formatDistanceToNow(new Date(item.pubDate), { addSuffix: true });
        }
    } catch { timeAgo = 'Just now' }

    const hasAI = item.aiSummary && item.aiSummary.length > 0;

    const sentimentConfig = {
        positive: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-500/10' },
        negative: { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-500/10' },
        neutral: { icon: Minus, color: 'text-gray-600', bg: 'bg-gray-500/10' }
    };

    const config = item.sentiment ? sentimentConfig[item.sentiment] : sentimentConfig.neutral;
    const SentimentIcon = config.icon;

    return (
        <div className="flex flex-col gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0">
            <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 group items-start"
            >
                {item.thumbnail && (
                    <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-gray-200">
                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}
                <div className="flex flex-col flex-1 min-w-0">
                    <h4 className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-primary/80">{item.source}</span>
                        <span>•</span>
                        <span>{timeAgo}</span>
                        {item.sentiment && (
                            <>
                                <span>•</span>
                                <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded", config.bg)}>
                                    <SentimentIcon className={cn("w-3 h-3", config.color)} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </a>

            {/* AI Insights Section */}
            {hasAI && (
                <div className="mt-2 space-y-2">
                    <button
                        onClick={() => setShowAI(!showAI)}
                        className="flex items-center gap-1.5 text-xs font-medium text-primary/80 hover:text-primary transition-colors"
                    >
                        <Sparkles className="w-3 h-3" />
                        <span>AI Summary</span>
                        <span className="text-[10px] ml-1">{showAI ? '▼' : '▶'}</span>
                    </button>

                    {showAI && (
                        <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-lg p-3 space-y-2 text-xs">
                            <div className="space-y-1.5">
                                {item.aiSummary?.map((bullet, i) => (
                                    <div key={i} className="flex gap-2">
                                        <span className="text-primary/60 flex-shrink-0">•</span>
                                        <span className="text-foreground/80">{bullet}</span>
                                    </div>
                                ))}
                            </div>

                            {item.whyItMatters && (
                                <div className="pt-2 border-t border-primary/10">
                                    <div className="font-semibold text-primary/80 mb-1">Why It Matters</div>
                                    <p className="text-foreground/70 italic">{item.whyItMatters}</p>
                                </div>
                            )}

                            <div className="text-[10px] text-muted-foreground/60 pt-1 border-t border-primary/5">
                                AI-generated summary. Read full article for complete context.
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
