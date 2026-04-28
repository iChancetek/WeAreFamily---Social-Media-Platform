"use client";

import { Play, Flame } from "lucide-react";
import { useRef } from "react";

// Mock data for shorts
const SHORTS_VIDEOS = [
    {
        id: "s1",
        title: "Quick Office Hacks 💡",
        views: "1.5M",
        thumbnail: "https://images.unsplash.com/photo-1516383740770-fbcc5ccbece0?w=300&h=533&fit=crop",
    },
    {
        id: "s2",
        title: "Morning Routine for Devs",
        views: "900K",
        thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&h=533&fit=crop",
    },
    {
        id: "s3",
        title: "React Server Components in 60s",
        views: "2.1M",
        thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&h=533&fit=crop",
    },
    {
        id: "s4",
        title: "Setup Tour 2026 🔥",
        views: "3.4M",
        thumbnail: "https://images.unsplash.com/photo-1606228281437-dd22cd2d54e8?w=300&h=533&fit=crop",
    },
    {
        id: "s5",
        title: "Fixing bugs like...",
        views: "500K",
        thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&h=533&fit=crop",
    },
];

export function ShortsTray() {
    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <div className="mb-6 flex flex-col gap-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 px-1">
                <Flame className="w-5 h-5 text-red-500 fill-red-500" />
                Shorts
            </h2>
            <div 
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory"
            >
                {SHORTS_VIDEOS.map((short) => (
                    <div 
                        key={short.id} 
                        className="relative shrink-0 w-[140px] md:w-[160px] aspect-[9/16] rounded-xl overflow-hidden group cursor-pointer snap-start shadow-sm border border-border/50"
                    >
                        <img 
                            src={short.thumbnail} 
                            alt={short.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80" />
                        
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                                <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
                            </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-1">
                            <h3 className="text-white text-sm font-semibold line-clamp-2 leading-tight drop-shadow-md">
                                {short.title}
                            </h3>
                            <p className="text-white/80 text-xs font-medium flex items-center gap-1 drop-shadow-md">
                                {short.views} views
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
