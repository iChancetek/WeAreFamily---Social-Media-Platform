"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

    await adminDb.collection("stories").add({
        authorId: user.id,
        mediaUrl,
        mediaType,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: FieldValue.serverTimestamp(),
    });

    revalidatePath("/");
    return { success: true };
}

export async function getActiveStories() {
    try {
        // Get stories that haven't expired
        const now = Timestamp.now();

        const storiesSnapshot = await adminDb.collection("stories")
            .where("expiresAt", ">", now)
            .orderBy("expiresAt")
            .orderBy("createdAt", "desc")
            .get();

        // Fetch author data for each story
        const activeStories = await Promise.all(storiesSnapshot.docs.map(async (storyDoc) => {
            const storyData = storyDoc.data();
            const authorDoc = await adminDb.collection("users").doc(storyData.authorId).get();
            const author = authorDoc.exists ? { id: authorDoc.id, ...authorDoc.data() } : null;

            return {
                id: storyDoc.id,
                ...storyData,
                author,
                createdAt: storyData.createdAt?.toDate() || new Date(),
                expiresAt: storyData.expiresAt?.toDate() || new Date(),
            };
        }));

        // Group stories by user
        const userStoriesMap = new Map();

        for (const story of activeStories) {
            const storyData = story as any;
            const authorId = storyData.authorId;
            if (!userStoriesMap.has(authorId)) {
                userStoriesMap.set(authorId, {
                    user: storyData.author,
                    stories: [],
                });
            }
            userStoriesMap.get(authorId).stories.push(story);
        }

        return Array.from(userStoriesMap.values());
    } catch (error) {
        console.error("Error fetching active stories:", error);
        return [];
    }
}
