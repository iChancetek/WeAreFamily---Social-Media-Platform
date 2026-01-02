import { getUserProfile } from "@/lib/auth"
import { getPosts } from "@/app/actions/posts"
import { PostCard } from "./post-card"

export async function FeedList() {
    try {
        const user = await getUserProfile()
        const posts = await getPosts()

        if (posts.length === 0) {
            return (
                <div className="text-center py-10 text-gray-500">
                    <p>No moments shared yet. Be the first to share something special!</p>
                </div>
            )
        }

        return (
            <div className="space-y-4">
                {posts.map((post) => (
                    <PostCard key={post.id} post={post as any} currentUserId={user?.id} />
                ))}
            </div>
        )
    } catch (error) {
        console.error("Error loading feed:", error)
        return (
            <div className="text-center py-10 text-red-500">
                <p>Unable to load feed. Please refresh the page.</p>
            </div>
        )
    }
}
