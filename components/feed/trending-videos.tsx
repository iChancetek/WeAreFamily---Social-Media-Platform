"use client";

import { Play, TrendingUp, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getTrendingVideos } from "@/app/actions/posts";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface TrendingVideo {
    id: string;
    title: string;
    views: string;
    duration: string;
    thumbnail: string;
    videoUrl?: string | null;
}

interface TrendingVideosProps {
    videos?: TrendingVideo[];
}

export function TrendingVideos({ videos: initialVideos = [] }: TrendingVideosProps) {
    const router = useRouter();
    const [videos, setVideos] = useState<TrendingVideo[]>(initialVideos);
    const [isLoading, setIsLoading] = useState(initialVideos.length === 0);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const mockVideos: TrendingVideo[] = [
        {
            id: "mock1",
            title: "Future of Agentic AI in 2026",
            views: "1.2M views",
            duration: "12:45",
            thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&h=169&fit=crop",
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
        },
        {
            id: "mock2",
            title: "Building Scalable Social Platforms",
            views: "850K views",
            duration: "08:20",
            thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=169&fit=crop",
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
        },
        {
            id: "mock3",
            title: "Design Systems for Modern Apps",
            views: "420K views",
            duration: "15:10",
            thumbnail: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=300&h=169&fit=crop",
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
        }
    ];

    useEffect(() => {
        if (initialVideos.length === 0) {
            const fetchVideos = async () => {
                try {
                    const data = await getTrendingVideos(3);
                    if (data && data.length > 0) {
                        setVideos(data as TrendingVideo[]);
                    } else {
                        // Fallback to mock data if database is empty so UI stays beautiful
                        setVideos(mockVideos);
                    }
                } catch (error) {
                    console.error("Failed to fetch trending videos:", error);
                    setVideos(mockVideos);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchVideos();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                Trending Videos
                {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            </h3>
            
            <div className="flex flex-col gap-3">
                {videos.map((video) => {
                    const playableUrl = video.videoUrl;
                    const isHovering = hoveredId === video.id;

                    return (
                    <div 
                        key={video.id} 
                        className="group flex flex-col gap-2"
                        onMouseEnter={() => setHoveredId(video.id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        <div 
                            className="relative aspect-video rounded-xl overflow-hidden shadow-sm border border-border/50 cursor-pointer"
                            onClick={() => router.push(`/post/${video.id}`)}
                        >
                            {playableUrl && isHovering && (
                                <video 
                                    src={playableUrl} 
                                    className="absolute inset-0 w-full h-full object-cover z-10" 
                                    muted 
                                    playsInline
                                    loop
                                    autoPlay
                                />
                            )}
                            {/* Thumbnail: use a video frame if it's an mp4, otherwise an img */}
                            {(video.thumbnail || "").match(/\.(mp4|webm|mov)(\?|#|$)/i) ? (
                                <video
                                    src={`${video.thumbnail}#t=0.5`}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                    preload="metadata"
                                />
                            ) : (
                                <img 
                                    src={video.thumbnail || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=169&fit=crop"} 
                                    alt={video.title} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            )}
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors z-20" />
                            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] font-bold text-white z-20">
                                {video.duration}
                            </div>
                            <div className={cn("absolute inset-0 flex items-center justify-center transition-opacity z-20", isHovering ? "opacity-0" : "opacity-0 group-hover:opacity-100")}>
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                                    <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col px-1 cursor-pointer" onClick={() => router.push(`/post/${video.id}`)}>
                            <h4 className="text-sm font-semibold leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                                {video.title}
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                                {video.views}
                            </p>
                        </div>
                    </div>
                )})}
            </div>
            <button className="text-sm text-primary font-medium hover:underline self-start mt-2 px-1">
                Show more
            </button>
        </div>
    );
}
