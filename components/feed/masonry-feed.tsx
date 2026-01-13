"use client";

import Masonry from "react-masonry-css";
import { PostCard } from "./post-card";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface MasonryFeedProps {
    posts: any[];
    currentUserId?: string;
    className?: string;
}

export function MasonryFeed({ posts, currentUserId, className }: MasonryFeedProps) {
    // HYDRATION FIX: 
    // react-masonry-css interacts with window/DOM which can break during initial server-client handshake.
    // We only render Masonry after mount. Before that, we render a simple CSS grid to prevent layout shift (CLS).
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!posts || posts.length === 0) return null;

    // Server-side / Initial Render: Simple 1-col or 3-col grid
    if (!mounted) {
        return (
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
                {posts.map((post) => (
                    <div key={post.id}>
                        <PostCard post={post} currentUserId={currentUserId} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <Masonry
            breakpointCols={{
                default: 3,
                1300: 3,
                1100: 2,
                700: 1
            }}
            className={cn("flex w-auto -ml-4", className)}
            columnClassName="pl-4 bg-clip-padding"
        >
            {posts.map((post) => (
                <div key={post.id} className="mb-4">
                    <PostCard post={post} currentUserId={currentUserId} />
                </div>
            ))}
        </Masonry>
    );
}
