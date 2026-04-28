"use client";

import { Play, TrendingUp, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getTrendingVideos } from "@/app/actions/posts";

export interface TrendingVideo {
    id: string;
    title: string;
    views: string;
    duration: string;
    thumbnail: string;
}

interface TrendingVideosProps {
    videos?: TrendingVideo[];
}

export function TrendingVideos({ videos: initialVideos = [] }: TrendingVideosProps) {
    const [videos, setVideos] = useState<TrendingVideo[]>(initialVideos);
    const [isLoading, setIsLoading] = useState(initialVideos.length === 0);

    useEffect(() => {
        if (initialVideos.length === 0) {
            const fetchVideos = async () => {
                try {
                    const data = await getTrendingVideos(5);
                    setVideos(data as TrendingVideo[]);
                } catch (error) {
                    console.error("Failed to fetch trending videos:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchVideos();
        }
    }, [initialVideos]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-xs">Loading trends...</p>
            </div>
        );
    }

    if (!videos || videos.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Trending Videos
            </h3>
            <div className="flex flex-col gap-3">
                {videos.map((video) => (
                    <div key={video.id} className="flex gap-3 group cursor-pointer hover:bg-muted/50 p-1.5 -mx-1.5 rounded-lg transition-colors">
                        <div className="relative w-20 h-14 shrink-0 rounded-md overflow-hidden bg-muted">
                            <img 
                                src={video.thumbnail || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&h=112&fit=crop"} 
                                alt={video.title} 
                                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                            />
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
