"use client";

import { Play, TrendingUp } from "lucide-react";

// Mock data for trending videos
const TRENDING_VIDEOS = [
    {
        id: "v1",
        title: "The Future of AI in Enterprise Software",
        views: "1.2M views",
        duration: "10:45",
        thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=200&h=112&fit=crop",
    },
    {
        id: "v2",
        title: "How to Build a Scalable Startup from Scratch",
        views: "850K views",
        duration: "15:20",
        thumbnail: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=200&h=112&fit=crop",
    },
    {
        id: "v3",
        title: "Top 5 Leadership Traits for 2026",
        views: "420K views",
        duration: "08:12",
        thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&h=112&fit=crop",
    },
    {
        id: "v4",
        title: "Remote Work: Maintaining Team Culture",
        views: "315K views",
        duration: "05:55",
        thumbnail: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=200&h=112&fit=crop",
    },
];

export function TrendingVideos() {
    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Trending Videos
            </h3>
            <div className="flex flex-col gap-3">
                {TRENDING_VIDEOS.map((video) => (
                    <div key={video.id} className="flex gap-3 group cursor-pointer hover:bg-muted/50 p-1.5 -mx-1.5 rounded-lg transition-colors">
                        <div className="relative w-20 h-14 shrink-0 rounded-md overflow-hidden bg-muted">
                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <Play className="w-5 h-5 text-white opacity-80 group-hover:opacity-100 drop-shadow-md" fill="currentColor" />
                            </div>
                            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded font-medium">
                                {video.duration}
                            </span>
                        </div>
                        <div className="flex flex-col justify-center overflow-hidden">
                            <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                {video.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{video.views}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="text-sm text-primary font-medium hover:underline self-start mt-2 px-1">
                Show more
            </button>
        </div>
    );
}
