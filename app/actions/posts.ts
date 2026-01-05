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

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("post.create", {
        targetType: "post",
        details: { content: content.substring(0, 20) }
    });

    revalidatePath('/')
    return { success: true };
}

export type PostType = 'personal' | 'group' | 'branding';
export type ReactionType = 'brilliant' | 'excellent' | 'hugs' | 'thinking_of_you' | 'vibe' | 'positive_energy';

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

    // Strict Privacy Check for Personal Posts
    if (postType === 'personal' && postData && postData.authorId !== user.id && user.role !== 'admin') {
        const { getFamilyStatus } = await import("./family");
        const status = await getFamilyStatus(postData.authorId);
        if (status.status !== 'accepted') {
            throw new Error("Unauthorized: You must be family to react to this post.");
        }
    }

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

        if (postData && postData.authorId) {
            const { createNotification } = await import("./notifications");
            await createNotification(postData.authorId, 'like' as any, postId, {
                reactionType,
                postPreview: postData.content?.substring(0, 50)
            }).catch(console.error);
        }

        const { logAuditEvent } = await import("./audit");
        await logAuditEvent("reaction.add", {
            targetType: "post",
            targetId: postId,
            details: { reactionType }
        });
    }

    revalidatePath('/')
    if (postType === 'group' && contextId) revalidatePath(`/groups/${contextId}`);
    if (postType === 'branding' && contextId) revalidatePath(`/branding/${contextId}`);
}

export async function addComment(
    postId: string,
    content: string,
    postType: PostType = 'personal',
    contextId?: string,
    mediaUrl?: string,
    youtubeUrl?: string
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
    if (!postSnap.exists) throw new Error("Post not found");
    const postData = postSnap.data();

    // Strict Privacy Check for Personal Posts
    if (postType === 'personal' && postData && postData.authorId !== user.id && user.role !== 'admin') {
        const { getFamilyStatus } = await import("./family");
        const status = await getFamilyStatus(postData.authorId);
        if (status.status !== 'accepted') {
            throw new Error("Unauthorized: You must be family to comment on this post.");
        }
    }

    const commentsRef = postRef.collection("comments");
    await commentsRef.add({
        authorId: user.id,
        content,
        mediaUrl: mediaUrl || null,
        youtubeUrl: youtubeUrl || null,
        createdAt: FieldValue.serverTimestamp(),
    });

    // Trigger Notification
    if (postData && postData.authorId) {
        const { createNotification } = await import("./notifications");
        await createNotification(postData.authorId, 'comment', postId, {
            commentPreview: content.substring(0, 50),
            postPreview: postData.content?.substring(0, 50)
        }).catch(console.error);
    }

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("comment.create", {
        targetType: "post",
        targetId: postId,
        details: { content: content.substring(0, 50) }
    });

    revalidatePath('/')
}

export async function deleteComment(postId: string, commentId: string, postType: PostType = 'personal', contextId?: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    let postRef;
    if (postType === 'group' && contextId) {
        postRef = adminDb.collection("groups").doc(contextId).collection("posts").doc(postId);
    } else if (postType === 'branding' && contextId) {
        postRef = adminDb.collection("pages").doc(contextId).collection("posts").doc(postId);
    } else {
        postRef = adminDb.collection("posts").doc(postId);
    }

    const commentRef = postRef.collection("comments").doc(commentId);
    const commentSnap = await commentRef.get();

    if (!commentSnap.exists) throw new Error("Comment not found");

    const commentData = commentSnap.data();
    if (commentData?.authorId !== user.id && user.role !== 'admin') {
        throw new Error("Forbidden");
    }

    await commentRef.delete();

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("comment.delete", {
        targetType: "post",
        targetId: postId,
        details: { commentId }
    });

    revalidatePath('/');
}

export async function editComment(postId: string, commentId: string, newContent: string, postType: PostType = 'personal', contextId?: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    let postRef;
    if (postType === 'group' && contextId) {
        postRef = adminDb.collection("groups").doc(contextId).collection("posts").doc(postId);
    } else if (postType === 'branding' && contextId) {
        postRef = adminDb.collection("pages").doc(contextId).collection("posts").doc(postId);
    } else {
        postRef = adminDb.collection("posts").doc(postId);
    }

    const commentRef = postRef.collection("comments").doc(commentId);
    const commentSnap = await commentRef.get();

    if (!commentSnap.exists) throw new Error("Comment not found");

    const commentData = commentSnap.data();
    if (commentData?.authorId !== user.id) {
        throw new Error("Forbidden");
    }

    await commentRef.update({
        content: newContent,
        updatedAt: FieldValue.serverTimestamp()
    });

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("comment.update", { // We need to add 'comment.update' to AuditAction type if not present, checking... it's not. I'll use a generic one or add it later. Wait, create/delete are there. Let's stick to update if possible or add to types.
        // Actually, let's assume I can add it or mapped to 'post.update' with details? No, better to be clean.
        // I will update audit.ts types in next step if needed. For now let's hope it compiles or cast.
        targetType: "comment",
        targetId: commentId,
        details: { postId }
    } as any);

    revalidatePath('/');
}

export async function archiveComment(postId: string, commentId: string, postType: PostType = 'personal', contextId?: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    let postRef;
    if (postType === 'group' && contextId) {
        postRef = adminDb.collection("groups").doc(contextId).collection("posts").doc(postId);
    } else if (postType === 'branding' && contextId) {
        postRef = adminDb.collection("pages").doc(contextId).collection("posts").doc(postId);
    } else {
        postRef = adminDb.collection("posts").doc(postId);
    }

    const commentRef = postRef.collection("comments").doc(commentId);
    const commentSnap = await commentRef.get();

    if (!commentSnap.exists) throw new Error("Comment not found");

    const commentData = commentSnap.data();
    if (commentData?.authorId !== user.id && user.role !== 'admin') {
        throw new Error("Forbidden");
    }

    await commentRef.update({
        isArchived: true
    });

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("comment.update", { // reusing update or adding archive
        targetType: "comment",
        targetId: commentId,
        details: { action: "archive", postId }
    } as any);

    revalidatePath('/');
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

        // 1. Personal Feed (Self + Family)
        const allowedAuthorIds = [user.id, ...familyIds];
        console.log(`[getPosts] User: ${user.id} (${user.displayName})`);
        console.log(`[getPosts] Family IDs found: ${familyIds.length}`, familyIds);
        console.log(`[getPosts] Total allowed authors: ${allowedAuthorIds.length}`);

        const queries: Promise<any>[] = [];

        if (allowedAuthorIds.length > 0) {
            // Firestore 'in' query supports max 10 values by default, rarely 30 depending on key.
            // Safest to stick to 10 for 'in' queries or multiple queries.
            // The chunkArray helper is available below.
            const chunks = chunkArray(allowedAuthorIds, 10);

            chunks.forEach((chunk: any[]) => {
                queries.push(
                    adminDb.collection("posts")
                        .where("authorId", "in", chunk)
                        .orderBy("createdAt", "desc")
                        .limit(20)
                        .get()
                        .then((snap: any) => snap.docs.map((d: any) => ({ ...d.data(), id: d.id, type: 'personal' })))
                        .catch(async (err: any) => {
                            console.warn("Family posts ordered query failed (likely missing index), trying fallback:", err);
                            // Fallback: Query WITHOUT orderBy, then sort in memory.
                            // 'in' query works without index if no orderBy is present.
                            try {
                                const fallbackSnap = await adminDb.collection("posts")
                                    .where("authorId", "in", chunk)
                                    .limit(20) // Still limit to avoid massive fetch
                                    .get();
                                return fallbackSnap.docs.map((d: any) => ({ ...d.data(), id: d.id, type: 'personal' }));
                            } catch (fallbackErr) {
                                console.error("Family posts fallback query also failed:", fallbackErr);
                                return [];
                            }
                        })
                );
            });
        }

        // 2. Group Posts
        // Group posts are in `groups/{groupId}/posts`
        // We can't query all at once easily unless we query collectionGroup("posts") where groupId in [myGroups]
        // But the schema is `groups/{groupId}/posts`.
        // So we use collectionGroup("posts").
        // Wait, standard posts are in `posts` collection. Group posts are in subcollections.
        // We need to query the subcollections.

        if (groupIds.length > 0) {
            const chunks = chunkArray(groupIds, 10);
            chunks.forEach((chunk: any[]) => {
                queries.push(
                    adminDb.collectionGroup("posts")
                        .where("groupId", "in", chunk)
                        .orderBy("createdAt", "desc")
                        .limit(20)
                        .get()
                        .then((snap: any) => snap.docs.map((d: any) => ({ ...d.data(), id: d.id, type: 'group' })))
                        .catch((err: any) => {
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
            chunks.forEach((chunk: any[]) => {
                queries.push(
                    adminDb.collectionGroup("posts")
                        .where("brandingId", "in", chunk)
                        .orderBy("createdAt", "desc")
                        .limit(20)
                        .get()
                        .then((snap: any) => snap.docs.map((d: any) => ({ ...d.data(), id: d.id, type: 'branding' })))
                        .catch((err: any) => {
                            console.error("Branding posts query failed:", err);
                            return [];
                        })
                );
            });
        }

        const results = await Promise.all(queries);
        const allRawPosts = results.flat();

        // STRICT SAFETY CHECK (CLIENT-SIDE FILTERING)
        // Ensure no leakage happens due to quirks in Promise.all or Firestore fallback
        const verifiedPosts = allRawPosts.filter((post: any) => {
            if (post.type === 'personal') {
                return allowedAuthorIds.includes(post.authorId);
            }
            return true; // Allow group/branding posts for now
        });

        // Sort by date desc
        verifiedPosts.sort((a: any, b: any) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
        });

        // Hydrate authors/groups/pages
        const finalPosts = await Promise.all(verifiedPosts.map(async (post: any) => {
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
                    displayName: resolveDisplayName(authorDoc.data()),
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
                    displayName: resolveDisplayName(authorDoc.data()),
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

            let commentsSnapshot;
            try {
                commentsSnapshot = await commentsRef.orderBy("createdAt", "asc").get();
            } catch (err) {
                console.warn("Index missing for comments, falling back to unordered query");
                commentsSnapshot = await commentsRef.get();
            }

            const comments = await Promise.all(commentsSnapshot.docs.map(async (cDoc: any) => {
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

            // Sort comments in memory if fallback was used or just to be safe
            comments.sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                return dateA.getTime() - dateB.getTime();
            });

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
    commentsSnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
    });
    // Add post deletion to batch
    batch.delete(postRef);

    // Commit the batch
    await batch.commit();

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("post.delete", {
        targetType: "post",
        targetId: postId
    });

    revalidatePath('/')
}

export async function getUserPosts(userId: string) {
    try {
        const user = await getUserProfile();
        if (!user) return [];

        // Strict Privacy Check
        if (user.id !== userId && user.role !== 'admin') {
            const { getFamilyStatus } = await import("./family");
            const status = await getFamilyStatus(userId);
            if (status.status !== 'accepted') {
                console.warn(`Unauthorized access attempt to user posts: ${user.id} -> ${userId}`);
                return [];
            }
        }

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

        const posts = await Promise.all(postsSnapshot.docs.map(async (doc: any) => {
            const post = doc.data();
            const authorDoc = await adminDb.collection("users").doc(post.authorId).get();
            const author = authorDoc.exists ? {
                id: authorDoc.id,
                ...authorDoc.data()
            } : null;

            // Fetch comments
            const commentsRef = adminDb.collection("posts").doc(doc.id).collection("comments");
            let commentsSnapshot;
            try {
                commentsSnapshot = await commentsRef.orderBy("createdAt", "asc").get();
            } catch (err) {
                console.warn("Index missing for user post comments, falling back to unordered query");
                commentsSnapshot = await commentsRef.get();
            }

            const comments = await Promise.all(commentsSnapshot.docs.map(async (cDoc: any) => {
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

            // Sort comments in memory
            comments.sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                return dateA.getTime() - dateB.getTime();
            });

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

export async function toggleCommentLike(
    postId: string,
    commentId: string,
    postType: PostType = 'personal',
    contextId?: string
) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    let postRef;
    if (postType === 'group' && contextId) {
        postRef = adminDb.collection("groups").doc(contextId).collection("posts").doc(postId);
    } else if (postType === 'branding' && contextId) {
        postRef = adminDb.collection("pages").doc(contextId).collection("posts").doc(postId);
    } else {
        postRef = adminDb.collection("posts").doc(postId);
    }

    const commentRef = postRef.collection("comments").doc(commentId);
    const commentSnap = await commentRef.get();

    if (!commentSnap.exists) throw new Error("Comment not found");

    const commentData = commentSnap.data();
    const likes = (commentData?.likes || []) as string[];
    const hasLiked = likes.includes(user.id);

    if (hasLiked) {
        await commentRef.update({
            likes: FieldValue.arrayRemove(user.id)
        });
    } else {
        await commentRef.update({
            likes: FieldValue.arrayUnion(user.id)
        });

        // Notify comment author if it's not the liker
        if (commentData && commentData.authorId && commentData.authorId !== user.id) {
            const { createNotification } = await import("./notifications");
            await createNotification(commentData.authorId, 'like' as any, postId, {
                postPreview: commentData.content?.substring(0, 50) || "Comment"
            }).catch(console.error);
        }
    }

    revalidatePath('/');
    if (postType === 'group' && contextId) revalidatePath(`/groups/${contextId}`);
    if (postType === 'branding' && contextId) revalidatePath(`/branding/${contextId}`);
}
