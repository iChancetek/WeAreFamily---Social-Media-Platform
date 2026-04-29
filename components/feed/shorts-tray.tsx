"use client";

import { Play, Flame, Loader2 } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { getTrendingShorts } from "@/app/actions/posts";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface ShortVideo {
    id: string;
    title: string;
    views: string;
    thumbnail: string;
    videoUrl?: string | null;
}

interface ShortsTrayProps {
    shorts?: ShortVideo[];
}

export function ShortsTray({ shorts: initialShorts = [] }: ShortsTrayProps) {
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [shorts, setShorts] = useState<ShortVideo[]>(initialShorts);
    const [isLoading, setIsLoading] = useState(initialShorts.length === 0);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const mockShorts: ShortVideo[] = [
        {
            id: "short1",
            title: "Morning Routine in the Cloud",
            views: "245K",
            thumbnail: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=533&fit=crop",
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
        },
        {
            id: "short2",
            title: "10 Fast Coding Tips",
            views: "1.1M",
            thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&h=533&fit=crop",
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
        },
        {
            id: "short3",
            title: "Office Setup 2026",
            views: "89K",
            thumbnail: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=300&h=533&fit=crop",
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
        },
        {
            id: "short4",
            title: "Life as an AI Engineer",
            views: "530K",
            thumbnail: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=300&h=533&fit=crop",
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
        }
    ];

    useEffect(() => {
        if (initialShorts.length === 0) {
            const fetchShorts = async () => {
                try {
                    const data = await getTrendingShorts(10);
                    if (data && data.length > 0) {
                        setShorts(data as ShortVideo[]);
                    } else {
                        setShorts(mockShorts);
                    }
                } catch (error) {
                    console.error("Failed to fetch shorts:", error);
                    setShorts(mockShorts);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchShorts();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="mb-6 flex flex-col gap-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 px-1">
                <Flame className="w-5 h-5 text-red-500 fill-red-500" />
                Shorts
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </h2>
            <div 
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory"
            >
                {shorts.map((short) => {
                    const playableUrl = short.videoUrl;
                    const isHovering = hoveredId === short.id;

                    return (
                        <div 
                            key={short.id} 
                            className="flex-shrink-0 w-[140px] md:w-[160px] group cursor-pointer"
                            onMouseEnter={() => setHoveredId(short.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => router.push(`/post/${short.id}`)}
                        >
                            <div className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-sm border border-border/50 mb-2">
                                {playableUrl && isHovering && (
                                    <video 
                                        src={playableUrl} 
                                        className="absolute inset-0 w-full h-full object-cover z-10 group-hover:scale-105" 
                                        muted 
                                        playsInline
                                        loop
                                        autoPlay
                                    />
                                )}
                                <img 
                                    src={short.thumbnail || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=533&fit=crop"} 
                                    alt={short.title} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                
                                {/* Hover Play Overlay */}
                                <div className={cn("absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity z-20", isHovering ? "opacity-0" : "opacity-0 group-hover:opacity-100")}>
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                                        <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 px-1">
                                <h3 className="text-foreground text-sm font-semibold line-clamp-2 leading-tight">
                                    {short.title}
                                </h3>
                                <p className="text-muted-foreground text-xs font-medium">
                                    {short.views} views
                                </p>
                            </div>
                        </div>
                )})}
            </div>
        </div>
    );
}
