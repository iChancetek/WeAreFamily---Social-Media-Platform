'use server'

import { db } from "@/db"
import { posts, users, comments } from "@/db/schema"
import { getUserProfile } from "@/lib/auth"
import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function createPost(content: string, mediaUrls: string[] = []) {
    const user = await getUserProfile()
    if (!user || user.role === 'pending') {
        throw new Error("Unauthorized")
    }

    await db.insert(posts).values({
        authorId: user.id,
        content,
        mediaUrls,
    })

    revalidatePath('/')
}

export async function toggleLike(postId: number) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    const post = await db.query.posts.findFirst({
        where: eq(posts.id, postId),
    })

    if (!post) throw new Error("Post not found")

    const currentLikes = post.likes || []
    const isLiked = currentLikes.includes(user.id)

    const newLikes = isLiked
        ? currentLikes.filter(id => id !== user.id)
        : [...currentLikes, user.id]

    await db.update(posts)
        .set({ likes: newLikes })
        .where(eq(posts.id, postId))

    revalidatePath('/')
}

export async function addComment(postId: number, content: string) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    await db.insert(comments).values({
        postId,
        authorId: user.id,
        content,
    })

    revalidatePath('/')
}

export async function getPosts() {
    const user = await getUserProfile()
    if (!user || user.role === 'pending') {
        throw new Error("Unauthorized")
    }

    // Fetch posts with author info and comments
    const allPosts = await db.query.posts.findMany({
        orderBy: [desc(posts.createdAt)],
        with: {
            author: true,
            comments: {
                with: { author: true },
                orderBy: (comments, { asc }) => [asc(comments.createdAt)]
            }
        }
    })

    return allPosts
}

export async function deletePost(postId: number) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    const post = await db.query.posts.findFirst({
        where: eq(posts.id, postId),
    })

    if (!post) throw new Error("Post not found")

    if (post.authorId !== user.id && user.role !== 'admin') {
        throw new Error("Forbidden")
    }

    // Delete comments first (cascade or manual) - typically DB cascade handles this if set, 
    // but Drizzle/Neon might need manual cleanup if FK constraint isn't CASCADE. 
    // Assuming standard FK default, we might need to delete comments.
    // Safe bet: delete comments first.
    await db.delete(comments).where(eq(comments.postId, postId))
    await db.delete(posts).where(eq(posts.id, postId))

    revalidatePath('/')
}
