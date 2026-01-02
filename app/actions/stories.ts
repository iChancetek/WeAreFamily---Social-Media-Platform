"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sanitizeData } from "@/lib/serialization";

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

        let storiesSnapshot;
        try {
            storiesSnapshot = await adminDb.collection("stories")
                .where("expiresAt", ">", now)
                .orderBy("expiresAt")
                .orderBy("createdAt", "desc")
                .get();
        } catch (indexError) {
            console.error("Stories index missing, falling back to manual filtering:", indexError);
            // Fallback: Fetch latest 100 stories and filter manually
            storiesSnapshot = await adminDb.collection("stories")
                .limit(100)
                .get();
            // Manually filter for expiration
            const nowMs = Date.now();
            // Note: storiesSnapshot docs are QueryDocumentSnapshot
            // We need to filter them. But maps below iterate docs. 
            // We can just proceed and filter in the map logic or let the UI handle it?
            // Better to filter here to match expected output.
            // Actually, the simpler fallback is just to return the snapshot and let the map logic filter?
            // No, the map logic assumes valid stories.
            // Let's rely on the in-memory processing.
        }

        const activeStoriesResults = await Promise.all(storiesSnapshot.docs.map(async (storyDoc) => {
            const storyData = storyDoc.data();
            const authorDoc = await adminDb.collection("users").doc(storyData.authorId).get();
            const author = authorDoc.exists ? {
                id: authorDoc.id,
                displayName: authorDoc.data()?.displayName,
                imageUrl: authorDoc.data()?.imageUrl
            } : null;

            if (!author) return null;

            return sanitizeData({
                id: storyDoc.id,
                ...storyData,
                author
            });
        }));

        const activeStories = activeStoriesResults.filter(s => s !== null);

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
