'use server';
// critical-build-trigger: force redeploy of fixed syntax

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sanitizeData } from "@/lib/serialization";

// Helper for Display Name Resolution
function resolveDisplayName(data: any) {
    if (!data) return "Unknown";
    // 1. Explicit display name (if not default/generic)
    if (data.displayName && data.displayName !== "Family Member") return data.displayName;
    // 2. Profile data (First Last)
    if (data.profileData?.firstName) {
        return `${data.profileData.firstName} ${data.profileData.lastName || ''}`.trim();
    }
    // 3. Email prefix
    if (data.email) return data.email.split('@')[0];
    // 4. Fallback
    return "Family Member";
}

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

    const postDoc = await postRef.get();
    if (!postDoc.exists) throw new Error("Post not found");

    const currentReactions = postDoc.data()?.reactions || {};
    const hasReaction = currentReactions[user.id] === reactionType;

    if (hasReaction) {
        // Toggle OFF
        delete currentReactions[user.id];
    } else {
        // Toggle ON (or switch)
        currentReactions[user.id] = reactionType;
    }

    await postRef.update({ reactions: currentReactions });

    // Notify author if not self and adding reaction
    if (!hasReaction && postDoc.data()?.authorId !== user.id) {
        const { sendNotification } = await import("./notifications");
        await sendNotification(
            postDoc.data()?.authorId,
            "post_reaction",
            `${user.displayName || user.email || 'Someone'} reacted to your post`,
            { postId, type: reactionType }
        );
    }

    revalidatePath('/')
    return { success: true, active: !hasReaction };
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

    const postDoc = await postRef.get();
    if (!postDoc.exists) throw new Error("Post not found");

    // Add comment to subcollection
    await postRef.collection("comments").add({
        authorId: user.id,
        content,
        mediaUrl: mediaUrl || null,
        youtubeUrl: youtubeUrl || null,
        createdAt: FieldValue.serverTimestamp(),
        author: { // Denormalize for faster reads
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            imageUrl: user.imageUrl
        }
    });

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("comment.create", {
        targetType: "post",
        targetId: postId,
        details: { content: content.substring(0, 20) }
    });

    // Notify post author
    if (postDoc.data()?.authorId !== user.id) {
        const { sendNotification } = await import("./notifications");
        await sendNotification(
            postDoc.data()?.authorId,
            "post_comment",
            `${user.displayName || 'Someone'} commented on your post`,
            { postId, commentSnippet: content.substring(0, 50) }
        );
    }

    revalidatePath('/')
    return { success: true };
}

export async function deletePost(postId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const postRef = adminDb.collection("posts").doc(postId);
    const doc = await postRef.get();

    if (!doc.exists) throw new Error("Not found");
    if (doc.data()?.authorId !== user.id) throw new Error("Forbidden"); // Basic own-post check

    await postRef.delete();
    revalidatePath('/');
    return { success: true };
}

export async function deleteComment(postId: string, commentId: string, postType: PostType = 'personal', contextId?: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    let commentRef;
    if (postType === 'group' && contextId) {
        commentRef = adminDb.collection("groups").doc(contextId).collection("posts").doc(postId).collection("comments").doc(commentId);
    } else if (postType === 'branding' && contextId) {
        commentRef = adminDb.collection("pages").doc(contextId).collection("posts").doc(postId).collection("comments").doc(commentId);
    } else {
        commentRef = adminDb.collection("posts").doc(postId).collection("comments").doc(commentId);
    }

    const doc = await commentRef.get();
    if (!doc.exists) throw new Error("Not found");
    // Allow author of comment OR author of post (todo: verify post author)
    if (doc.data()?.authorId !== user.id) throw new Error("Forbidden");

    await commentRef.delete();
    revalidatePath('/');
    return { success: true };
}

export async function editComment(postId: string, commentId: string, newContent: string, postType: PostType = 'personal', contextId?: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    let commentRef;
    if (postType === 'group' && contextId) {
        commentRef = adminDb.collection("groups").doc(contextId).collection("posts").doc(postId).collection("comments").doc(commentId);
    } else if (postType === 'branding' && contextId) {
        commentRef = adminDb.collection("pages").doc(contextId).collection("posts").doc(postId).collection("comments").doc(commentId);
    } else {
        commentRef = adminDb.collection("posts").doc(postId).collection("comments").doc(commentId);
    }

    const doc = await commentRef.get();
    if (!doc.exists) throw new Error("Not found");
    if (doc.data()?.authorId !== user.id) throw new Error("Forbidden");

    await commentRef.update({ content: newContent });
    revalidatePath('/');
    return { success: true };
}

export async function archiveComment(postId: string, commentId: string, postType: PostType = 'personal', contextId?: string) {
    // Soft delete
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    let commentRef;
    // (Logic same as delete helper above for Ref selection)
    if (postType === 'group' && contextId) {
        commentRef = adminDb.collection("groups").doc(contextId).collection("posts").doc(postId).collection("comments").doc(commentId);
    } else if (postType === 'branding' && contextId) {
        commentRef = adminDb.collection("pages").doc(contextId).collection("posts").doc(postId).collection("comments").doc(commentId);
    } else {
        commentRef = adminDb.collection("posts").doc(postId).collection("comments").doc(commentId);
    }

    const doc = await commentRef.get();
    if (!doc.exists) throw new Error("Not found");
    if (doc.data()?.authorId !== user.id) throw new Error("Forbidden");

    await commentRef.update({ isArchived: true });
    revalidatePath('/');
    return { success: true };
}

export async function toggleCommentLike(
    postId: string,
    commentId: string,
    postType: PostType = 'personal',
    contextId?: string
) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    let commentRef;
    // Proper Ref Logic
    if (postType === 'group' && contextId) {
        commentRef = adminDb.collection("groups").doc(contextId).collection("posts").doc(postId).collection("comments").doc(commentId);
    } else if (postType === 'branding' && contextId) {
        commentRef = adminDb.collection("pages").doc(contextId).collection("posts").doc(postId).collection("comments").doc(commentId);
    } else {
        commentRef = adminDb.collection("posts").doc(postId).collection("comments").doc(commentId);
    }

    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) throw new Error("Comment not found");

    const currentLikes = (commentDoc.data()?.likes || []) as string[];
    const hasLiked = currentLikes.includes(user.id);

    let newLikes;
    if (hasLiked) {
        newLikes = currentLikes.filter(id => id !== user.id);
    } else {
        newLikes = [...currentLikes, user.id];
    }

    await commentRef.update({ likes: newLikes });

    // Notify comment author (if not self)
    if (!hasLiked && commentDoc.data()?.authorId !== user.id) {
        const { sendNotification } = await import("./notifications");
        await sendNotification(
            commentDoc.data()?.authorId,
            "comment_like",
            `${user.displayName || 'Someone'} liked your comment`,
            { postId, commentId }
        );
    }

    revalidatePath('/');
    return { success: true, liked: !hasLiked };
}


// --- FETCHING POSTS ---

export async function getPosts(filters?: { groupId?: string, brandingId?: string }) {
    const { getUserProfile } = await import("@/lib/auth"); // Late import to avoid cycles?
    const user = await getUserProfile().catch(() => null);

    let query;

    // 1. Group Feed
    if (filters?.groupId) {
        query = adminDb.collection("groups").doc(filters.groupId).collection("posts");
    }
    // 2. Branding (Page) Feed
    else if (filters?.brandingId) {
        query = adminDb.collection("pages").doc(filters.brandingId).collection("posts");
    }
    // 3. User Feed (Personal) - simplified for now: all posts
    // TODO: Filter by friends/following
    else {
        query = adminDb.collection("posts");
    }

    try {
        const snapshot = await query.orderBy("createdAt", "desc").limit(20).get();

        // Check if index missing? If query fails, it usually throws specific error code.
        // For simple orderBy on single field, it should work by default.

        const posts = snapshot.docs.map(doc => ({ id: doc.id, type: filters?.groupId ? 'group' : (filters?.brandingId ? 'branding' : 'personal'), context: null, ...doc.data() }));

        // Hardening: If main feed is empty, maybe fallback to NO ORDERBY just to check if data exists?
        // (Debugging step only)
        if (posts.length === 0 && !filters) {
            console.log("Main feed query returned 0 docs with sort. Trying without sort...");
            const fallback = await adminDb.collection("posts").limit(5).get();
            console.log("Fallback query count:", fallback.size);
            if (!fallback.empty) {
                // If this works, it IS an index issue. Return these for now.
                return sanitizeData(fallback.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        }

        // Parallel processing for extra data
        const verifiedPosts = posts; // Add filtering here if blocking users

        // Helper to get Group/Page info
        const getGroup = async (id: string) => {
            if (!id) return null;
            const d = await adminDb.collection("groups").doc(id).get();
            return d.exists ? { id: d.id, name: d.data()?.name } : null;
        };
        const getBranding = async (id: string) => {
            if (!id) return null;
            const d = await adminDb.collection("pages").doc(id).get();
            return d.exists ? { id: d.id, name: d.data()?.name, imageUrl: d.data()?.imageUrl } : null;
        }

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
            if (post.type === 'group' && post.groupId) {
                commentsRef = adminDb.collection("groups").doc(post.groupId).collection("posts").doc(post.id).collection("comments");
            } else if (post.type === 'branding' && post.brandingId) {
                commentsRef = adminDb.collection("pages").doc(post.brandingId).collection("posts").doc(post.id).collection("comments");
            } else {
                commentsRef = adminDb.collection("posts").doc(post.id).collection("comments");
            }

            const commentsSnap = await commentsRef.orderBy("createdAt", "asc").get();
            const comments = await Promise.all(commentsSnap.docs.map(async (c) => {
                const cData = c.data();
                // Author usually denormalized, but if not:
                let cAuthor = cData.author;
                if (!cAuthor && cData.authorId) {
                    // Fetch
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


            return {
                ...post,
                author,
                context,
                comments: comments || [],
                createdAt: post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt),
            };
        }));

        return sanitizeData(finalPosts);

    } catch (error) {
        console.error("Get Posts Error:", error);
        return [];
    }
}
