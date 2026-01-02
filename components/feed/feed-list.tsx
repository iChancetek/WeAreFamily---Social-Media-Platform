'use client'

import { useAuth } from "@/components/auth-provider"
import { useLanguage } from "@/components/language-context"
import { PostCard } from "./post-card"
import { useEffect, useState } from "react"
import { getPosts } from "@/app/actions/posts"
import { Loader2 } from "lucide-react"

export function FeedList() {
    const { profile, user } = useAuth()
    const { t } = useLanguage()
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const data = await getPosts()
                setPosts(data)
            } catch (err) {
                console.error("Error loading feed:", err)
                setError(true)
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
                <p>Unable to load feed. Please refresh the page.</p>
            </div>
        )
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                <p>{t("feed.empty")}</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <PostCard key={post.id} post={post as any} currentUserId={profile?.id} />
            ))}
        </div>
    )
}
