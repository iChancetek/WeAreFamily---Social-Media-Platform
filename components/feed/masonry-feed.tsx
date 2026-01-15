'use client';

import { PostCard } from "./post-card";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/device-detection";

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
    const isMobile = useIsMobile();

    if (!posts || posts.length === 0) return null;

    // Pinterest mode: only active on mobile with pinterest-mobile variant
    const isPinterestMode = variant === 'pinterest-mobile' && isMobile;

    // STABILITY FIX:
    // Replaced react-masonry-css with Native CSS Columns.
    // This removes all Javascript-based layout calculations and hydration risks.
    // CSS Columns are 100% crash-proof and performant.

    return (
        <div className={cn("w-full block", className)}>
            <div className={cn(
                isPinterestMode
                    ? "columns-2 gap-3 space-y-0" // Pinterest mobile: always 2 cols, tight gap
                    : "columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4" // Standard: responsive
            )}>
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className={cn(
                            "break-inside-avoid-column",
                            isPinterestMode ? "mb-3" : "mb-4"
                        )}
                    >
                        <PostCard
                            post={post}
                            currentUserId={currentUserId}
                            variant={isPinterestMode ? 'pinterest' : 'standard'}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
