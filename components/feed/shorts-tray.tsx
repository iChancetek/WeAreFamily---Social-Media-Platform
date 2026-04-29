"use client";

import { Play, Flame, Loader2 } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { getTrendingShorts } from "@/app/actions/posts";
import { useRouter } from "next/navigation";

export interface ShortVideo {
    id: string;
    title: string;
    views: string;
    thumbnail: string;
}

interface ShortsTrayProps {
    shorts?: ShortVideo[];
}

export function ShortsTray({ shorts: initialShorts = [] }: ShortsTrayProps) {
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [shorts, setShorts] = useState<ShortVideo[]>(initialShorts);
    const [isLoading, setIsLoading] = useState(initialShorts.length === 0);
    const [playingId, setPlayingId] = useState<string | null>(null);

    const mockShorts: ShortVideo[] = [
        {
            id: "short1",
            title: "Morning Routine in the Cloud",
            views: "245K",
            thumbnail: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=533&fit=crop",
        },
        {
            id: "short2",
            title: "10 Fast Coding Tips",
            views: "1.1M",
            thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&h=533&fit=crop",
        },
        {
            id: "short3",
            title: "Office Setup 2026",
            views: "89K",
            thumbnail: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=300&h=533&fit=crop",
        },
        {
            id: "short4",
            title: "Life as an AI Engineer",
            views: "530K",
            thumbnail: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=300&h=533&fit=crop",
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
    }, [initialShorts]);

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
                    const isMp4 = short.thumbnail?.match(/\.(mp4|webm|mov)(\?.*)?$/i);
                    const isPlaying = playingId === short.id;

                    return (
                    <div 
                        key={short.id} 
                        className="relative shrink-0 w-[140px] md:w-[160px] aspect-[9/16] rounded-xl overflow-hidden group snap-start shadow-sm border border-border/50"
                    >
                        {isPlaying ? (
                            <video 
                                src={short.thumbnail} 
                                className="w-full h-full object-cover" 
                                autoPlay 
                                controls 
                                playsInline 
                            />
                        ) : (
                            <div className="w-full h-full cursor-pointer" onClick={() => setPlayingId(short.id)}>
                                {isMp4 ? (
                                    <video 
                                        src={`${short.thumbnail}#t=0.1`} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                        preload="metadata"
                                        muted 
                                        playsInline
                                    />
                                ) : (
                                    <img 
                                        src={short.thumbnail || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=533&fit=crop"} 
                                        alt={short.title} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80" />
                                
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                                        <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
                                    </div>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-1">
                                    <h3 className="text-white text-sm font-semibold line-clamp-2 leading-tight drop-shadow-md" onClick={(e) => { e.stopPropagation(); router.push(`/post/${short.id}`); }}>
                                        {short.title}
                                    </h3>
                                    <p className="text-white/80 text-xs font-medium flex items-center gap-1 drop-shadow-md">
                                        {short.views} views
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )})}
            </div>
        </div>
    );
}
