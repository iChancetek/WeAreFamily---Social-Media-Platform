"use server";

import { db } from "@/db";
import { stories, users } from "@/db/schema";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { desc, gt, eq } from "drizzle-orm";

export async function createStory(mediaUrl: string, mediaType: 'image' | 'video') {
    const user = await getUserProfile();

    if (!user) {
        throw new Error("Unauthorized");
    }

    if (user.role !== 'member' && user.role !== 'admin') {
        throw new Error("Only members can create stories");
    }

    // Default expiration: 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(stories).values({
        authorId: user.id,
        mediaUrl,
        mediaType,
        expiresAt,
    });

    revalidatePath("/");
    return { success: true };
}

export async function getActiveStories() {
    // Get stories that haven't expired
    const now = new Date();

    const activeStories = await db.query.stories.findMany({
        where: gt(stories.expiresAt, now),
        with: {
            author: true,
        },
        orderBy: [desc(stories.createdAt)],
    });

    // Group stories by user
    const userStoriesMap = new Map();

    for (const story of activeStories) {
        const authorId = story.authorId;
        if (!userStoriesMap.has(authorId)) {
            userStoriesMap.set(authorId, {
                user: story.author,
                stories: [],
            });
        }
        userStoriesMap.get(authorId).stories.push(story);
    }

    return Array.from(userStoriesMap.values());
}
