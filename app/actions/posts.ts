'use server';
// critical-build-trigger: force redeploy of fixed syntax

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sanitizeData } from "@/lib/serialization";
import { ReactionType, NotificationType } from "@/types/posts";

// Helper for Display Name Resolution
function resolveDisplayName(data: any) {
    if (!data) return "Unknown User";

    // 1. Use displayName if it exists and is meaningful (not generic/default)
    if (data.displayName && data.displayName !== "Family Member" && data.displayName.trim()) {
        return data.displayName;
    }

    // 2. Try to build from profile data
    if (data.profileData?.firstName) {
        const fullName = `${data.profileData.firstName} ${data.profileData.lastName || ''}`.trim();
        if (fullName) return fullName;
    }

    // 3. Use email prefix (everything before @)
    if (data.email) {
        const emailPrefix = data.email.split('@')[0];
        // Make it more readable (capitalize, replace dots/underscores with spaces)
        return emailPrefix
            .replace(/[._]/g, ' ')
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // 4. Final fallback
    return "Unknown User";
}

export async function createPost(content: string, mediaUrls: string[] = []) {
    const user = await getUserProfile()
    if (!user) {
        throw new Error("Unauthorized")
    }

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

    revalidatePath('/');
    revalidatePath('/profile');
}

export async function getPosts(limit = 20) {
    const user = await getUserProfile();

    try {
        const postsRef = adminDb.collection("posts").orderBy("createdAt", "desc").limit(limit);
        const snapshot = await postsRef.get();

        const posts = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();

            // Hydrate Author
            let author = null;
            if (data.authorId) {
                const authorDoc = await adminDb.collection("users").doc(data.authorId).get();
                if (authorDoc.exists) {
                    const aData = authorDoc.data();
                    author = {
                        id: authorDoc.id,
                        displayName: resolveDisplayName(aData),
                        imageUrl: aData?.imageUrl,
                        email: aData?.email
                    };
                }
            }

            // Fetch Comments (Subcollection)
            const commentsRef = doc.ref.collection("comments").orderBy("createdAt", "asc"); // Oldest first
            const commentsSnap = await commentsRef.get();
            const comments = await Promise.all(commentsSnap.docs.map(async (cDoc) => {
                const cData = cDoc.data();
                let cAuthor = null;
                if (cData.authorId) {
                    const cAuthorDoc = await adminDb.collection("users").doc(cData.authorId).get();
                    if (cAuthorDoc.exists) {
                        const caData = cAuthorDoc.data();
                        cAuthor = {
                            id: cAuthorDoc.id,
                            displayName: resolveDisplayName(caData),
                            imageUrl: caData?.imageUrl,
                            email: caData?.email
                        };
                    }
                }
                return sanitizeData({
                    id: cDoc.id,
                    ...cData,
                    author: cAuthor,
                    createdAt: cData.createdAt?.toDate ? cData.createdAt.toDate() : new Date()
                });
            }));

            return sanitizeData({
                id: doc.id,
                ...data,
                author,
                comments: comments || [],
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
            });
        }));

        return posts;
    } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
}

export async function toggleReaction(postId: string, reactionType: ReactionType, contextType?: string, contextId?: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const postRef = adminDb.collection("posts").doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) throw new Error("Post not found");

    const currentReactions = postDoc.data()?.reactions || {};
    const hasReaction = currentReactions[user.id] === reactionType;

    if (hasReaction) {
        delete currentReactions[user.id];
    } else {
        currentReactions[user.id] = reactionType;
    }

    await postRef.update({ reactions: currentReactions });

    // Notification Logic
    if (!hasReaction && postDoc.data()?.authorId !== user.id) {
        const { createNotification } = await import("./notifications");
        await createNotification(
            postDoc.data()?.authorId,
            "like",
            postId,
            { type: reactionType, message: `${user.displayName || user.email || 'Someone'} reacted to your post` }
        );
    }

    revalidatePath('/');
}

export async function addComment(postId: string, content: string, contextType?: string, contextId?: string, mediaUrl?: string, youtubeUrl?: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const postRef = adminDb.collection("posts").doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists) throw new Error("Post not found");

    const docRef = await postRef.collection("comments").add({
        authorId: user.id,
        content,
        mediaUrl: mediaUrl || null,
        youtubeUrl: youtubeUrl || null,
        likes: [],
        createdAt: FieldValue.serverTimestamp()
    });

    const commentData = {
        id: docRef.id,
        authorId: user.id,
        content,
        mediaUrl: mediaUrl || null,
        youtubeUrl: youtubeUrl || null,
        likes: [],
        createdAt: new Date().toISOString() // Return ISO string for client
    };

    // Notify post author
    if (postDoc.data()?.authorId !== user.id) {
        const { createNotification } = await import("./notifications");
        await createNotification(
            postDoc.data()?.authorId,
            "comment",
            postId,
            { commentSnippet: content.substring(0, 50), message: `${user.displayName || user.email || 'Someone'} commented on your post` }
        );
    }

    revalidatePath('/');

    // Return the comment for optimistic UI
    return {
        ...commentData,
        author: {
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            imageUrl: user.photoURL
        }
    };
}

export async function deleteComment(postId: string, commentId: string, contextType?: string, contextId?: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const commentRef = adminDb.collection("posts").doc(postId).collection("comments").doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) throw new Error("Comment not found");

    if (commentDoc.data()?.authorId !== user.id) throw new Error("Unauthorized");

    await commentRef.delete();
    revalidatePath('/');
}

export async function editComment(postId: string, commentId: string, content: string, contextType?: string, contextId?: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const commentRef = adminDb.collection("posts").doc(postId).collection("comments").doc(commentId);
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists || commentDoc.data()?.authorId !== user.id) throw new Error("Unauthorized");

    await commentRef.update({ content });
    revalidatePath('/');
}

export async function archiveComment(postId: string, commentId: string, contextType?: string, contextId?: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const commentRef = adminDb.collection("posts").doc(postId).collection("comments").doc(commentId);
    await commentRef.update({ isArchived: true });
    revalidatePath('/');
}

export async function deletePost(postId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const postRef = adminDb.collection("posts").doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists) throw new Error("Post not found");
    // Allow author OR admin (future proofing) to delete
    if (postDoc.data()?.authorId !== user.id) throw new Error("Unauthorized");

    // Soft Delete
    await postRef.update({
        isDeleted: true,
        deletedAt: FieldValue.serverTimestamp()
    });

    revalidatePath('/');
}

export async function restorePost(postId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const postRef = adminDb.collection("posts").doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists) throw new Error("Post not found");
    if (postDoc.data()?.authorId !== user.id) throw new Error("Unauthorized");

    // Restore
    await postRef.update({
        isDeleted: false,
        deletedAt: FieldValue.delete()
    });

    revalidatePath('/');
}

export async function toggleCommentLike(postId: string, commentId: string, contextType?: string, contextId?: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const postRef = adminDb.collection("posts").doc(postId);
    const commentRef = postRef.collection("comments").doc(commentId);

    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) throw new Error("Comment not found");

    const currentLikes = commentDoc.data()?.likes || [];
    const hasLiked = currentLikes.includes(user.id);

    let newLikes;
    if (hasLiked) {
        newLikes = currentLikes.filter((id: string) => id !== user.id);
    } else {
        newLikes = [...currentLikes, user.id];
    }

    await commentRef.update({ likes: newLikes });

    if (!hasLiked && commentDoc.data()?.authorId !== user.id) {
        const { createNotification } = await import("./notifications");
        await createNotification(
            commentDoc.data()?.authorId,
            "like",
            postId,
            { commentId, message: `${user.displayName || user.email || 'Someone'} liked your comment` }
        );
    }

    revalidatePath('/');
}

export async function getUserPosts(userId: string) {
    try {
        // First try by authorId
        let postsRef = adminDb.collection("posts")
            .where("authorId", "==", userId)
            .orderBy("createdAt", "desc");

        let snapshot = await postsRef.get();

        // If no posts found by authorId, try by email (for users whose ID changed)
        if (snapshot.empty) {
            const userDoc = await adminDb.collection("users").doc(userId).get();
            const userEmail = userDoc.data()?.email;

            if (userEmail) {
                // Query all posts and filter by author email
                const allPostsSnapshot = await adminDb.collection("posts")
                    .orderBy("createdAt", "desc")
                    .get();

                const matchingDocs: any[] = [];
                for (const doc of allPostsSnapshot.docs) {
                    const authorId = doc.data().authorId;
                    if (authorId) {
                        const authorDoc = await adminDb.collection("users").doc(authorId).get();
                        if (authorDoc.exists && authorDoc.data()?.email === userEmail) {
                            matchingDocs.push(doc);
                        }
                    }
                }

                snapshot = { docs: matchingDocs, empty: matchingDocs.length === 0 } as any;
            }
        }

        const finalPosts = await Promise.all(snapshot.docs.map(async (doc) => {
            const post = doc.data();

            // Re-fetch author just to be safe/consistent
            const authorDoc = await adminDb.collection("users").doc(post.authorId).get();
            const author = authorDoc.exists ? {
                id: authorDoc.id,
                displayName: resolveDisplayName(authorDoc.data()),
                imageUrl: authorDoc.data()?.imageUrl,
                email: authorDoc.data()?.email,
            } : null;

            // Fetch comments
            const commentsRef = adminDb.collection("posts").doc(doc.id).collection("comments");
            const commentsSnap = await commentsRef.orderBy("createdAt", "asc").get();
            const comments = await Promise.all(commentsSnap.docs.map(async (c) => {
                const cData = c.data();
                let cAuthor = cData.author;
                if (!cAuthor && cData.authorId) {
                    const u = await adminDb.collection("users").doc(cData.authorId).get();
                    cAuthor = u.exists ? {
                        id: u.id,
                        displayName: resolveDisplayName(u.data()),
                        imageUrl: u.data()?.imageUrl
                    } : null;
                }
                return {
                    id: c.id,
                    ...cData,
                    author: cAuthor
                };
            }));

            return sanitizeData({
                id: doc.id,
                ...post,
                author,
                context: null,
                comments: comments || [],
                createdAt: post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt),
            });
        }));

        return finalPosts;

    } catch (error) {
        console.error("Get User Posts Error:", error);
        return [];
    }
}

