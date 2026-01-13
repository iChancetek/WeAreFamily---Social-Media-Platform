import { PostCard } from "./post-card";
import { cn } from "@/lib/utils";

interface MasonryFeedProps {
    posts: any[];
    currentUserId?: string;
    className?: string;
}

export function MasonryFeed({ posts, currentUserId, className }: MasonryFeedProps) {
    if (!posts || posts.length === 0) return null;

    // STABILITY FIX:
    // Replaced react-masonry-css with Native CSS Columns.
    // This removes all Javascript-based layout calculations and hydration risks.
    // CSS Columns are 100% crash-proof and performant.

    return (
        <div className={cn("w-full block", className)}>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {posts.map((post) => (
                    <div key={post.id} className="break-inside-avoid-column mb-4">
                        <PostCard post={post} currentUserId={currentUserId} />
                    </div>
                ))}
            </div>
        </div>
    );
}
