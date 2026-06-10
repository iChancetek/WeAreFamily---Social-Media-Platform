'use client'

import { useAuth } from "@/components/auth-provider"
import { useLanguage } from "@/components/language-context"
import { PostCard } from "./post-card"
import { MasonryFeed } from "./masonry-feed"
import { useEffect, useState, useRef } from "react"
import { getPosts } from "@/app/actions/posts"
import { useRouter } from "next/navigation"
import { Loader2, Video } from "lucide-react"
import { useAutoScroll } from "@/hooks/use-auto-scroll"
import { AutoScrollToggle } from "./auto-scroll-toggle"

import { PostFilters } from "@/app/actions/posts";

interface FeedListProps {
    variant?: 'standard' | 'pinterest-mobile';
    headerAction?: React.ReactNode;
    fetcher?: (limit: number, filters: PostFilters, cursor?: string) => Promise<any[] | { posts: any[], nextCursor: string | null }>;
}

export function FeedList({ variant = 'standard', headerAction, fetcher }: FeedListProps) {
    const router = useRouter()
    const { profile, user } = useAuth()
    const { t } = useLanguage()
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [nextCursor, setNextCursor] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(true)

    // Auto-scroll integration
    const {
        isEnabled,
        isPaused,
        toggleAutoScroll,
        containerRef,
        scrollRef,
    } = useAutoScroll({
        pauseOnHover: false,
        pauseOnInteraction: true,
    });

    // Filters
    const [timeRange, setTimeRange] = useState<'all' | 'day' | 'week' | 'month' | 'year'>('all');
    const [contentType, setContentType] = useState<'all' | 'text' | 'photo' | 'video'>('all');

    const fetchPosts = async (isInitial = true) => {
        if (isInitial) {
            setLoading(true);
            setNextCursor(null);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const fetchFn = fetcher || getPosts;
            const response = await fetchFn(20, { timeRange, contentType }, isInitial ? undefined : (nextCursor || undefined));
            
            const newPosts = Array.isArray(response) ? response : response.posts;
            const next = Array.isArray(response) ? null : response.nextCursor;

            if (isInitial) {
                setPosts(newPosts);
            } else {
                // Deduplicate just in case
                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNew = newPosts.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueNew];
                });
            }

            setNextCursor(next);
            setHasMore(!!next && newPosts.length > 0);
        } catch (err) {
            console.error("Error loading feed:", err)
            setError(err instanceof Error ? err.message : "Unknown Load Error")
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    useEffect(() => {
        fetchPosts(true)

        // Zero-refresh: listen for new posts
        const handleNewPost = () => {
            fetchPosts(true);
        };

        window.addEventListener('app:post-created', handleNewPost);
        return () => window.removeEventListener('app:post-created', handleNewPost);
    }, [timeRange, contentType, fetcher]) // Re-fetch when filters change

    // Intersection Observer for Infinite Scroll
    const observerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!hasMore || loading || loadingMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchPosts(false);
                }
            },
            { threshold: 0.1, root: scrollRef.current }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loading, loadingMore, nextCursor]);
    // Filter UI Components
    const FilterBar = () => (
        <div className="flex flex-wrap items-center gap-2 mb-4 w-full">
            {/* Time Filter */}
            <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-3 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer hover:bg-blue-100 transition-colors"
                aria-label="Filter by time"
            >
                <option value="all">All Time</option>
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
            </select>

            {/* Content Filter */}
            <div className="flex bg-blue-50/50 rounded-full p-1 gap-1 overflow-x-auto scrollbar-hide max-w-[150px] md:max-w-none">
                {(['all', 'text', 'photo', 'video'] as const).map((type) => {
                    const labels: Record<string, string> = {
                        all: 'All',
                        text: 'Texts',
                        photo: 'Photos',
                        video: 'Videos'
                    };
                    return (
                        <button
                            key={type}
                            onClick={() => setContentType(type)}
                            className={`text-xs px-3 py-1 rounded-full transition-all whitespace-nowrap ${contentType === type
                                ? 'bg-blue-600 shadow-sm text-white font-medium'
                                : 'text-blue-600 hover:bg-blue-100/50'
                                }`}
                        >
                            {labels[type]}
                        </button>
                    );
                })}
            </div>

            {/* Go Live Action */}
            <button
                onClick={() => router.push('/live/broadcast')}
                className="text-xs px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-all flex items-center gap-1.5 font-medium border border-blue-200/50 dark:border-blue-500/20"
            >
                <Video className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">Go Live</span>
            </button>

            <div className="ml-auto flex items-center gap-2">
                {/* Auto-Scroll Toggle */}
                <AutoScrollToggle
                    isEnabled={isEnabled}
                    isPaused={isPaused}
                    onToggle={toggleAutoScroll}
                />

                {/* Custom Header Action (e.g. Create Post) */}
                {headerAction && (
                    <div className="pl-1 border-l border-border/50">
                        {headerAction}
                    </div>
                )}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-4">
                <FilterBar />
                <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-4">
                <FilterBar />
                <div className="text-center py-10 text-red-500">
                    <p>Unable to load feed. Please pull to refresh.</p>
                    <p className="text-xs mt-2 opacity-50">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <FilterBar />

            {posts.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    <p>{t("feed.empty")}</p>
                </div>
            )}

            {/* Scrollable container with auto-scroll */}
            {/* Added standard vh fallback and dvh for mobile browsers */}
            <div
                ref={containerRef}
                className="max-h-[calc(100vh-200px)] max-h-[calc(100dvh-200px)] md:max-h-[calc(100vh-150px)] md:max-h-[calc(100dvh-150px)] overflow-y-auto overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
                <MasonryFeed posts={posts} currentUserId={profile?.id} variant={variant} />

                {/* Infinite Scroll Anchor */}
                <div ref={observerRef} className="h-10 w-full" />

                {loadingMore && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
                    </div>
                )}

                {!hasMore && posts.length > 0 && (
                    <div className="text-center py-8 text-muted-foreground text-xs italic">
                        {t("feed.end") || "You've reached the end of the family feed."}
                    </div>
                )}
            </div>
        </div>
    )
}
