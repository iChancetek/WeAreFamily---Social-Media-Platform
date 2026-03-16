'use client';

import { PostCard } from "./post-card";
import { cn } from "@/lib/utils";

interface MasonryFeedProps {
    posts: any[];
    currentUserId?: string;
    className?: string;
    variant?: 'standard' | 'pinterest-mobile';
}

export function MasonryFeed({
    posts,
    currentUserId,
    className,
    variant = 'standard'
}: MasonryFeedProps) {
    if (!posts || posts.length === 0) return null;

    // Pinterest mode: active when variant is pinterest-mobile (works on all screen sizes)
    // The grid itself handles responsive column counts (2 on mobile, 3 on desktop)
    const isPinterestMode = variant === 'pinterest-mobile';

    // STABILITY FIX:
    // Replaced react-masonry-css with Native CSS Columns.
    // This removes all Javascript-based layout calculations and hydration risks.
    // CSS Columns are 100% crash-proof and performant.

    return (
        <div className={cn("w-full block", className)}>
            <div className={cn(
                isPinterestMode
                    ? "columns-2 lg:columns-3 gap-8 lg:gap-12 space-y-0" // Pinterest
                    : "columns-1 sm:columns-2 lg:columns-3 gap-8 lg:gap-12 space-y-0" // Standard
            )}>
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className="break-inside-avoid-column"
                    >
                        <PostCard
                            post={post}
                            currentUserId={currentUserId}
                            variant={isPinterestMode ? 'pinterest' : 'standard'}
                        />
                        <div className="h-8 lg:h-10" /> {/* Larger Explicit Spacer */}
                    </div>
                ))}
            </div>
        </div>
    );
}
