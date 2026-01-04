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

    const docRef = await adminDb.collection("stories").add({
        authorId: user.id,
        mediaUrl,
        mediaType,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: FieldValue.serverTimestamp(),
    });

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("story.create", {
        targetType: "story",
        targetId: docRef.id,
        details: { mediaUrl: mediaUrl.substring(0, 50) } // don't log full url if long
    });



    revalidatePath("/", 'layout'); // Revalidate everything to be safe
    return { success: true };
}

export async function getActiveStories() {
    try {
        // Get stories that haven't expired
        const now = Timestamp.now();

        const user = await getUserProfile();
        if (!user) return [];

        const { getFamilyMemberIds } = await import("./family");
        const familyIds = await getFamilyMemberIds(user.id).catch(e => { console.error("Story family fetch error:", e); return []; });

        // Allowed authors: Myself + Family
        const allowedAuthorIds = [user.id, ...familyIds];
        const queries: Promise<any>[] = [];

        if (allowedAuthorIds.length > 0) {
            const chunks = chunkArray(allowedAuthorIds, 10);
            chunks.forEach(chunk => {
                queries.push(
                    adminDb.collection("stories")
                        .where("authorId", "in", chunk)
                        .where("expiresAt", ">", now)
                        .orderBy("expiresAt", "asc")
                        .get()
                        .then(snap => snap.docs)
                        .catch(async err => {
                            console.warn("Family stories ordered query failed, trying robust fallback:", err);
                            // Fallback: Query ONLY by authorId, filter date in memory
                            // This avoids needing complex composite indexes for 'in' + 'range'
                            try {
                                const fallbackSnap = await adminDb.collection("stories")
                                    .where("authorId", "in", chunk)
                                    .get(); // Fetch ALL stories for these authors

                                const nowMillis = Date.now();
                                return fallbackSnap.docs.filter(doc => {
                                    const data = doc.data();
                                    const exp = data.expiresAt?.toMillis ? data.expiresAt.toMillis() : 0;
                                    return exp > nowMillis;
                                });
                            } catch (fallbackErr) {
                                console.error("Family stories fallback query also failed:", fallbackErr);
                                return [];
                            }
                        })
                );
            });
        }

        const results = await Promise.all(queries);
        const storiesDocs = results.flat();

        // Mock snapshot structure for compatibility with existing map logic
        const storiesSnapshot = { docs: storiesDocs };

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

function chunkArray(array: any[], size: number) {
    const chunked = [];
    let index = 0;
    while (index < array.length) {
        chunked.push(array.slice(index, size + index));
        index += size;
    }
    return chunked;
}
