'use client';

import { NewsItem } from "@/app/actions/news";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";

export function NewsCard({ item }: { item: NewsItem }) {
    let timeAgo = '';
    try {
        if (item.pubDate) {
            timeAgo = formatDistanceToNow(new Date(item.pubDate), { addSuffix: true });
        }
    } catch { timeAgo = 'Just now' }

    return (
        <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-3 group items-start p-2 rounded-lg hover:bg-muted/50 transition-colors"
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
                </div>
            </div>
        </a>
    )
}
