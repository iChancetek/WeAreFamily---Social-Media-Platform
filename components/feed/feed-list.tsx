'use client'

import { useAuth } from "@/components/auth-provider"
import { useLanguage } from "@/components/language-context"
import { PostCard } from "./post-card"
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

    return (
        <div className="space-y-4">
            {posts.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    <p>{t("feed.empty")}</p>
                </div>
            )}

            {posts.map((post) => (
                <PostCard key={post.id} post={post as any} currentUserId={profile?.id} />
            ))}

            {/* DEBUG FOOTER - TEMPORARY */}
            <div className="p-4 bg-black/5 text-xs font-mono text-center rounded mt-8 break-all">
                <p className="font-bold text-red-500 mb-1">--- SYSTEM DIAGNOSTICS ---</p>
                <div className="text-left space-y-1 inline-block">
                    <p>Connected DB: <span className="font-bold">{debugInfo?.projectId}</span></p>
                    <p>Target Env: <span className="font-bold">{debugInfo?.envProjectId}</span></p>
                    <p>Total Posts in DB: <span className="font-bold">{debugInfo?.numPosts}</span></p>
                    <p>Auth Mode: {debugInfo?.serviceAccount}</p>
                    {debugInfo?.error && <p className="text-red-600">DB Error: {debugInfo.error}</p>}
                </div>
            </div>
        </div>
    )
}
