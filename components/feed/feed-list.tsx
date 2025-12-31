import { currentUser } from "@clerk/nextjs/server"
import { getPosts } from "@/app/actions/posts"
import { PostCard } from "./post-card"

export async function FeedList() {
    const user = await currentUser()
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
                <PostCard key={post.id} post={post} currentUserId={user?.id} />
            ))}
        </div>
    )
}
