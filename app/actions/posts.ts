'use server'

import { db } from "@/db"
import { posts, users } from "@/db/schema"
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

export async function getPosts() {
    const user = await getUserProfile()
    if (!user || user.role === 'pending') {
        throw new Error("Unauthorized")
    }

    // Fetch posts with author info
    const allPosts = await db.query.posts.findMany({
        orderBy: [desc(posts.createdAt)],
        with: {
            author: true
        }
    })

    return allPosts
}
