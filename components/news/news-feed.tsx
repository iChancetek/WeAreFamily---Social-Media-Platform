'use client';

import { useState, useEffect, useCallback } from "react";
import { getNews, NewsItem } from "@/app/actions/news";
import { NewsCard } from "./news-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
    { id: 'general', label: 'Top Stories' },
    { id: 'sports', label: 'Sports' },
    { id: 'tech', label: 'Tech' },
    { id: 'business', label: 'Business' },
    { id: 'world', label: 'World' },
];

export function NewsFeed() {
    const [category, setCategory] = useState('general');
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    const loadNews = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getNews(category);
            setNews(data);
        } catch (error) {
            console.error("Failed to load news", error);
        } finally {
            setLoading(false);
        }
    }, [category]);

    useEffect(() => {
        loadNews();
    }, [loadNews]);

    // Auto-refresh news every 30 minutes
    useEffect(() => {
        const intervalId = setInterval(() => {
            loadNews();
        }, 30 * 60 * 1000); // 30 minutes in milliseconds

        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
    }, [loadNews]); // Re-create interval when loadNews changes

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    <Newspaper className="w-4 h-4" />
                    <span>News Feed</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground"
                    onClick={() => loadNews()}
                    disabled={loading}
                >
                    <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
                </Button>
            </div>

            {/* Category Selector */}
            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide px-2">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={cn(
                            "text-xs px-2 py-1 rounded-full whitespace-nowrap transition-colors",
                            category === cat.id
                                ? "bg-primary text-primary-foreground font-medium"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-1 min-h-[300px]">
                {loading && news.length === 0 ? (
                    <div className="flex flex-col gap-3 p-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="w-16 h-16 bg-muted rounded-md" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-3 bg-muted rounded w-3/4" />
                                    <div className="h-3 bg-muted rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {news.map((item, i) => (
                            <NewsCard key={i} item={item} />
                        ))}
                    </>
                )}

                {!loading && news.length === 0 && (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                        Unable to load news at the moment.
                    </div>
                )}
            </div>

            <div className="text-[10px] text-center text-muted-foreground mt-2 border-t border-border pt-2 mx-4">
                Powered by Public RSS & Famio
            </div>
        </div>
    );
}
