"use client";

import Masonry from "react-masonry-css";
import { PostCard } from "./post-card";
import { cn } from "@/lib/utils";

interface MasonryFeedProps {
    posts: any[];
    currentUserId?: string;
    className?: string;
}

export function MasonryFeed({ posts, currentUserId, className }: MasonryFeedProps) {
    const breakpointColumnsObj = {
        default: 3,
        1300: 3,
        1100: 2,
        700: 1
    };

    if (!posts || posts.length === 0) return null;

    return (
        <Masonry
            breakpointCols={breakpointColumnsObj}
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
