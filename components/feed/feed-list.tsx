'use client'

import { useAuth } from "@/components/auth-provider"
import { useLanguage } from "@/components/language-context"
import { PostCard } from "./post-card"
import { MasonryFeed } from "./masonry-feed"
import { useEffect, useState } from "react"
import { getPosts } from "@/app/actions/posts"
import { Loader2 } from "lucide-react"


import { debugEnv } from "@/app/actions/debug";

export function FeedList() {
    const { profile, user } = useAuth()
    const { t } = useLanguage()
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [debugInfo, setDebugInfo] = useState<any>(null)

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                // Parallel fetch for speed + debug
                const [data, debug] = await Promise.all([
                    getPosts(),
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
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-10 text-red-500">
                <p>Unable to load feed. Please pull to refresh.</p>
                <p className="text-xs mt-2 opacity-50">{error}</p>
            </div>
        )
    }

    const [timeRange, setTimeRange] = useState<'all' | 'day' | 'week' | 'month' | 'year'>('all');

    const filteredPosts = posts.filter(post => {
        if (!post.createdAt) return false;
        if (timeRange === 'all') return true;

        const date = new Date(post.createdAt.seconds ? post.createdAt.seconds * 1000 : post.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (timeRange) {
            case 'day': return diffDays <= 1;
            case 'week': return diffDays <= 7;
            case 'month': return diffDays <= 30;
            case 'year': return diffDays <= 365;
            default: return true;
        }
    });

    return (
        <div className="space-y-4">

            {/* Filter Controls */}
            <div className="flex items-center justify-between pb-2">
                <div className="flex gap-2">
                    <button
                        onClick={() => setTimeRange('all')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${timeRange === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted text-muted-foreground border-border'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setTimeRange('day')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${timeRange === 'day' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted text-muted-foreground border-border'}`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setTimeRange('week')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${timeRange === 'week' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted text-muted-foreground border-border'}`}
                    >
                        Week
                    </button>
                    <button
                        onClick={() => setTimeRange('month')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${timeRange === 'month' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted text-muted-foreground border-border'}`}
                    >
                        Month
                    </button>
                    <button
                        onClick={() => setTimeRange('year')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border hidden sm:block ${timeRange === 'year' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted text-muted-foreground border-border'}`}
                    >
                        Year
                    </button>
                </div>
            </div>

            {filteredPosts.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    <p>{posts.length > 0 ? "No posts in this time range." : t("feed.empty")}</p>
                </div>
            )}

            <MasonryFeed posts={filteredPosts} currentUserId={profile?.id} />

        </div>
    )
}
