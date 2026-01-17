'use client'

import { useAuth } from "@/components/auth-provider"
import { useLanguage } from "@/components/language-context"
import { PostCard } from "./post-card"
import { MasonryFeed } from "./masonry-feed"
import { useEffect, useState } from "react"
import { getPosts } from "@/app/actions/posts"
import { Loader2 } from "lucide-react"
import { useAutoScroll } from "@/hooks/use-auto-scroll"


import { debugEnv } from "@/app/actions/debug";

interface FeedListProps {
    variant?: 'standard' | 'pinterest-mobile';
    headerAction?: React.ReactNode;
}

export function FeedList({ variant = 'standard', headerAction }: FeedListProps) {
    const { profile, user } = useAuth()
    const { t } = useLanguage()
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [debugInfo, setDebugInfo] = useState<any>(null)

    // Auto-scroll integration
    const {
        isEnabled,
        isPaused,
        containerRef,
    } = useAutoScroll({
        pauseOnHover: true,
        pauseOnInteraction: true,
    });

    // Filters
    const [timeRange, setTimeRange] = useState<'all' | 'day' | 'week' | 'month' | 'year'>('all');
    const [contentType, setContentType] = useState<'all' | 'text' | 'photo' | 'video'>('all');

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                // Parallel fetch for speed + debug
                const [data, debug] = await Promise.all([
                    getPosts(50, { timeRange, contentType }),
                    debugEnv()
                ]);
                setPosts(data)
                setDebugInfo(debug)
            } catch (err) {
                console.error("Error loading feed:", err)
                setError(err instanceof Error ? err.message : "Unknown Load Error")
            } finally {
                setLoading(false)
            }
        }
        fetchPosts()
    }, [timeRange, contentType]) // Re-fetch when filters change

    // Filter UI Components
    const FilterBar = () => (
        <div className="flex flex-wrap items-center gap-2 mb-4 w-full">
            {/* Time Filter */}
            <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="text-xs bg-muted/50 border-none rounded-full px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none cursor-pointer hover:bg-muted transition-colors"
            >
                <option value="all">All Time</option>
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
            </select>

            {/* Content Filter */}
            <div className="flex bg-muted/50 rounded-full p-1 gap-1">
                {(['all', 'text', 'photo', 'video'] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => setContentType(type)}
                        className={`text-xs px-3 py-1 rounded-full transition-all capitalize ${contentType === type
                            ? 'bg-background shadow-sm text-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Custom Header Action (Right Aligned) */}
            {headerAction && (
                <div className="ml-auto">
                    {headerAction}
                </div>
            )}
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
            <div
                ref={containerRef}
                className="max-h-[calc(100vh-200px)] md:max-h-[calc(100vh-250px)] overflow-y-auto scroll-smooth overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
                <MasonryFeed posts={posts} currentUserId={profile?.id} variant={variant} />
            </div>
        </div>
    )
}
