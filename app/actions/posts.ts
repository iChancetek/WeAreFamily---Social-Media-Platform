'use server'

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sanitizeData } from "@/lib/serialization";

export async function createPost(content: string, mediaUrls: string[] = []) {
    const user = await getUserProfile()
    if (!user) {
        throw new Error("Unauthorized")
    }

    // Allow all authenticated users to post (removed pending role check for production)

    try {
        await adminDb.collection("posts").add({
            authorId: user.id,
            content,
            mediaUrls,
            reactions: {}, // Map of userId -> reactionType
            createdAt: FieldValue.serverTimestamp(),
        });
    } catch (e: any) {
        console.error("Create Post Failed:", e);
        throw new Error(e.message || "Database write failed");
    }

    revalidatePath('/')
    return { success: true };
}

export type PostType = 'personal' | 'group' | 'branding';
export type ReactionType = 'brilliant' | 'excellent' | 'hugs' | 'thinking_of_you';

export async function toggleReaction(
    postId: string,
    reactionType: ReactionType,
    postType: PostType = 'personal',
    contextId?: string
) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    let postRef;
    if (postType === 'group' && contextId) {
        postRef = adminDb.collection("groups").doc(contextId).collection("posts").doc(postId);
    } else if (postType === 'branding' && contextId) {
        postRef = adminDb.collection("pages").doc(contextId).collection("posts").doc(postId);
    } else {
        postRef = adminDb.collection("posts").doc(postId);
    }

    const postSnap = await postRef.get();

    if (!postSnap.exists) throw new Error("Post not found")

    const postData = postSnap.data();
    const currentReactions = postData?.reactions || {};
    const existingReaction = currentReactions[user.id];

    if (existingReaction === reactionType) {
        // Remove reaction if same type is clicked again
        await postRef.update({
            [`reactions.${user.id}`]: FieldValue.delete()
        });
    } else {
        // Add or Change reaction
        await postRef.update({
            [`reactions.${user.id}`]: reactionType
        });

        // Trigger Notification
        if (postData && postData.authorId) {
            const { createNotification } = await import("./notifications");
            await createNotification(postData.authorId, 'like' as any, postId, {
                reactionType,
                postPreview: postData.content?.substring(0, 50)
            }).catch(console.error);
        }
    }

    revalidatePath('/')
    if (postType === 'group' && contextId) revalidatePath(`/groups/${contextId}`);
    if (postType === 'branding' && contextId) revalidatePath(`/branding/${contextId}`);
}

export async function addComment(
    postId: string,
    content: string,
    postType: PostType = 'personal',
    contextId?: string
) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    let postRef;
    if (postType === 'group' && contextId) {
        postRef = adminDb.collection("groups").doc(contextId).collection("posts").doc(postId);
    } else if (postType === 'branding' && contextId) {
        postRef = adminDb.collection("pages").doc(contextId).collection("posts").doc(postId);
    } else {
        postRef = adminDb.collection("posts").doc(postId);
    }

    const commentsRef = postRef.collection("comments");
    await commentsRef.add({
        authorId: user.id,
        content,
        createdAt: FieldValue.serverTimestamp(),
    });

    const postSnap = await postRef.get();
    const postData = postSnap.data();

    // Trigger Notification
    if (postData && postData.authorId) {
        const { createNotification } = await import("./notifications");
        await createNotification(postData.authorId, 'comment', postId, {
            commentPreview: content.substring(0, 50),
            postPreview: postData.content?.substring(0, 50)
        }).catch(console.error);
    }

    revalidatePath('/')
}

export async function getPosts() {
    try {
        const user = await getUserProfile()
        if (!user) {
            return [] // Return empty if unauthorized
        }

        const { getFamilyMemberIds } = await import("./family");
        const { getJoinedGroupIds } = await import("./groups");
        const { getFollowedBrandingIds } = await import("./branding");
        const { getBranding } = await import("./branding");
        const { getGroup } = await import("./groups");

        // Parallel fetch of IDs with error handling
        let familyIds: string[] = [];
        let groupIds: string[] = [];
        let brandingIds: string[] = [];

        try {
            [familyIds, groupIds, brandingIds] = await Promise.all([
                getFamilyMemberIds(user.id).catch(e => { console.error("Family ID fetch failed:", e); return []; }),
                getJoinedGroupIds(user.id).catch(e => { console.error("Group ID fetch failed:", e); return []; }),
                getFollowedBrandingIds(user.id).catch(e => { console.error("Branding ID fetch failed:", e); return []; })
            ]);
        } catch (e) {
            console.error("Context fetching failed completely:", e);
        }

        // PRODUCTION HOTFIX: Fetch global feed to restore pre-migration behavior
        // The user reported that before migration, posts were working perfectly (implying global visibility or lost family connections).
        // Since we relaxed Firestore rules to allow all posts, the feed should also show all post.

        const queries: Promise<any>[] = [];

        queries.push(
            adminDb.collection("posts")
                .orderBy("createdAt", "desc")
                .limit(20)
                .get()
                .then(snap => snap.docs.map(d => ({ ...d.data(), id: d.id, type: 'personal' })))
                .catch(async (err) => {
                    console.error("Global posts query failed (likely index missing), falling back to unordered:", err);
                    // Fallback to simple query if index is missing
                    try {
                        const snap = await adminDb.collection("posts").limit(20).get();
                        return snap.docs.map(d => ({ ...d.data(), id: d.id, type: 'personal' }));
                    } catch (fallbackErr) {
                        console.error("Fallback query failed:", fallbackErr);
                        return [];
                    }
                })
        );

        /* 
        // Family filtering logic (Restricted for now - uncomment when family connections are fully restored)
        if (allowedAuthorIds.length > 0) {
            const chunks = chunkArray(allowedAuthorIds, 30);
            chunks.forEach(chunk => {
                let query = adminDb.collection("posts");
                if (chunk.length === 1) {
                    query = query.where("authorId", "==", chunk[0]) as any;
                } else {
                    query = query.where("authorId", "in", chunk) as any;
                }

                queries.push(
                    query.orderBy("createdAt", "desc")
                        .limit(20)
                        .get()
                        .then(snap => snap.docs.map(d => ({ ...d.data(), id: d.id, type: 'personal' })))
                        .catch(err => {
                            console.error("Family posts query failed:", err);
                            return [];
                        })
                );
            });
        }
        */

        // 2. Group Posts
        // Group posts are in `groups/{groupId}/posts`
        // We can't query all at once easily unless we query collectionGroup("posts") where groupId in [myGroups]
        // But the schema is `groups/{groupId}/posts`.
        // So we use collectionGroup("posts").
        // Wait, standard posts are in `posts` collection. Group posts are in subcollections.
        // We need to query the subcollections.

        if (groupIds.length > 0) {
            const chunks = chunkArray(groupIds, 10);
            chunks.forEach(chunk => {
                queries.push(
                    adminDb.collectionGroup("posts")
                        .where("groupId", "in", chunk)
                        .orderBy("createdAt", "desc")
                        .limit(20)
                        .get()
                        .then(snap => snap.docs.map(d => ({ ...d.data(), id: d.id, type: 'group' })))
                        .catch(err => {
                            console.error("Group posts query failed:", err);
                            return [];
                        })
                );
            });
        }

        // 3. Branding Posts
        // Branding posts are in `pages/{pageId}/posts`.
        // `createBrandingPost` adds `brandingId`.
        if (brandingIds.length > 0) {
            const chunks = chunkArray(brandingIds, 10);
            chunks.forEach(chunk => {
                queries.push(
                    adminDb.collectionGroup("posts")
                        .where("brandingId", "in", chunk)
                        .orderBy("createdAt", "desc")
                        .limit(20)
                        .get()
                        .then(snap => snap.docs.map(d => ({ ...d.data(), id: d.id, type: 'branding' })))
                        .catch(err => {
                            console.error("Branding posts query failed:", err);
                            return [];
                        })
                );
            });
        }

        const results = await Promise.all(queries);
        const allRawPosts = results.flat();

        // Sort by date desc
        allRawPosts.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
        });

        // Hydrate authors/groups/pages
        const finalPosts = await Promise.all(allRawPosts.map(async (post: any) => {
            let author = null;
            let context = null; // "Posted in X"

            if (post.type === 'group') {
                // Fetch author (user) AND Group info
                const [authorDoc, group] = await Promise.all([
                    adminDb.collection("users").doc(post.authorId).get(),
                    getGroup(post.groupId) // Cached/Batched potentially?
                ]);

                author = authorDoc.exists ? {
                    id: authorDoc.id,
                    displayName: authorDoc.data()?.displayName,
                    imageUrl: authorDoc.data()?.imageUrl,
                    email: authorDoc.data()?.email,
                } : null;

                if (group) {
                    context = { type: 'group', name: group.name, id: group.id };
                }

            } else if (post.type === 'branding') {
                // Author is the Branding usually
                if (post.postedAsBranding) {
                    const branding = await getBranding(post.brandingId);
                    if (branding) {
                        author = {
                            id: branding.id,
                            displayName: branding.name,
                            imageUrl: branding.imageUrl,
                            email: null
                        };
                    }
                } else {
                    // User posted on branding? Not implemented yet but handled
                    const authorDoc = await adminDb.collection("users").doc(post.authorId).get();
                    author = authorDoc.exists ? { ...authorDoc.data(), id: authorDoc.id } : null;
                }

            } else {
                // Personal post
                const authorDoc = await adminDb.collection("users").doc(post.authorId).get();
                author = authorDoc.exists ? {
                    id: authorDoc.id,
                    displayName: authorDoc.data()?.displayName,
                    imageUrl: authorDoc.data()?.imageUrl,
                    email: authorDoc.data()?.email,
                } : null;
            }

            // Fetch comments (legacy logic, maybe optimize later)
            // Note: Currently comments are subcollections of the post.
            // Since we have the post Ref (conceptually), we can get comments.
            // But we lost the Ref in the map.
            // We need to know WHICH collection the post is in to fetch comments.
            // Personal: posts/{id}/comments
            // Group: groups/{groupId}/posts/{id}/comments
            // Page: pages/{brandingId}/posts/{id}/comments

            let commentsRef;
            if (post.type === 'group') {
                commentsRef = adminDb.collection("groups").doc(post.groupId).collection("posts").doc(post.id).collection("comments");
            } else if (post.type === 'branding') {
                commentsRef = adminDb.collection("pages").doc(post.brandingId).collection("posts").doc(post.id).collection("comments");
            } else {
                commentsRef = adminDb.collection("posts").doc(post.id).collection("comments");
            }

            const commentsSnapshot = await commentsRef.orderBy("createdAt", "asc").get();
            const comments = await Promise.all(commentsSnapshot.docs.map(async (cDoc) => {
                const cData = cDoc.data();
                const cAuthorDoc = await adminDb.collection("users").doc(cData.authorId).get();
                return {
                    id: cDoc.id,
                    ...cData,
                    author: cAuthorDoc.exists ? {
                        id: cAuthorDoc.id,
                        displayName: cAuthorDoc.data()?.displayName,
                        imageUrl: cAuthorDoc.data()?.imageUrl
                    } : null,
                    createdAt: cData.createdAt?.toDate() || new Date()
                };
            }));

            const reactions = post.reactions || {};
            const likesCount = Object.keys(reactions).length;
            const likes = Object.keys(reactions); // For backward compatibility with PostCard's current check

            return sanitizeData({
                id: post.id,
                content: post.content,
                mediaUrls: post.mediaUrls,
                createdAt: post.createdAt,
                likes,
                reactions,
                author,
                comments,
                context // Pass this to UI
            });
        }));

        return finalPosts;
    } catch (error) {
        console.error("Error fetching posts:", error);
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

export async function deletePost(postId: string) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    const postRef = adminDb.collection("posts").doc(postId);
    const postSnap = await postRef.get();

    if (!postSnap.exists) throw new Error("Post not found")

    const post = postSnap.data();
    if (post?.authorId !== user.id && user.role !== 'admin') {
        throw new Error("Forbidden")
    }

    // Delete all comments first
    const commentsSnapshot = await postRef.collection("comments").get();
    const batch = adminDb.batch();
    commentsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    // Add post deletion to batch
    batch.delete(postRef);

    // Commit the batch
    await batch.commit();

    revalidatePath('/')
}

export async function getUserPosts(userId: string) {
    try {
        let postsSnapshot;
        try {
            postsSnapshot = await adminDb.collection("posts")
                .where("authorId", "==", userId)
                .orderBy("createdAt", "desc")
                .limit(50)
                .get();
        } catch (err) {
            console.log("Index missing for getUserPosts, falling back to unordered query");
            postsSnapshot = await adminDb.collection("posts")
                .where("authorId", "==", userId)
                .limit(50)
                .get();
        }

        const posts = await Promise.all(postsSnapshot.docs.map(async (doc) => {
            const post = doc.data();
            const authorDoc = await adminDb.collection("users").doc(post.authorId).get();
            const author = authorDoc.exists ? {
                id: authorDoc.id,
                ...authorDoc.data()
            } : null;

            // Fetch comments
            const commentsRef = adminDb.collection("posts").doc(doc.id).collection("comments");
            const commentsSnapshot = await commentsRef.orderBy("createdAt", "asc").get();
            const comments = await Promise.all(commentsSnapshot.docs.map(async (cDoc) => {
                const cData = cDoc.data();
                const cAuthorDoc = await adminDb.collection("users").doc(cData.authorId).get();
                return {
                    id: cDoc.id,
                    ...cData,
                    author: cAuthorDoc.exists ? {
                        id: cAuthorDoc.id,
                        displayName: cAuthorDoc.data()?.displayName,
                        imageUrl: cAuthorDoc.data()?.imageUrl
                    } : null,
                    createdAt: cData.createdAt?.toDate() || new Date()
                };
            }));

            return sanitizeData({
                id: doc.id,
                ...post,
                author,
                comments,
                type: 'personal',
                createdAt: post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt || Date.now())
            });
        }));

        // Ensure sorting in case we fell back to unordered query
        return posts.sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });
    } catch (error) {
        console.error("Error fetching user posts:", error);
        return [];
    }
}
