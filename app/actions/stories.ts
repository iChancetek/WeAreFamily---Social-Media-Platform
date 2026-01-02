"use server";

import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    Timestamp,
    serverTimestamp
} from "firebase/firestore";
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

    await addDoc(collection(db, "stories"), {
        authorId: user.id,
        mediaUrl,
        mediaType,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: serverTimestamp(),
    });

    revalidatePath("/");
    return { success: true };
}

export async function getActiveStories() {
    // Get stories that haven't expired
    const now = Timestamp.now();

    const storiesQuery = query(
        collection(db, "stories"),
        where("expiresAt", ">", now),
        orderBy("expiresAt"),
        orderBy("createdAt", "desc")
    );

    const storiesSnapshot = await getDocs(storiesQuery);

    // Fetch author data for each story
    const activeStories = await Promise.all(storiesSnapshot.docs.map(async (storyDoc) => {
        const storyData = storyDoc.data();
        const authorDoc = await getDoc(doc(db, "users", storyData.authorId));
        const author = authorDoc.exists() ? { id: authorDoc.id, ...authorDoc.data() } : null;

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
}
