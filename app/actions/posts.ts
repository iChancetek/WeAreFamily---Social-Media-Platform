'use server'

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createPost(content: string, mediaUrls: string[] = []) {
    const user = await getUserProfile()
    if (!user || user.role === 'pending') {
        throw new Error("Unauthorized")
    }

    await adminDb.collection("posts").add({
        authorId: user.id,
        content,
        mediaUrls,
        likes: [],
        createdAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/')
}

export async function toggleLike(postId: string) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    const postRef = adminDb.collection("posts").doc(postId);
    const postSnap = await postRef.get();

    if (!postSnap.exists) throw new Error("Post not found")

    const currentLikes = postSnap.data()?.likes || []
    const isLiked = currentLikes.includes(user.id)

    if (isLiked) {
        await postRef.update({
            likes: FieldValue.arrayRemove(user.id)
        });
    } else {
        await postRef.update({
            likes: FieldValue.arrayUnion(user.id)
        });
    }

    revalidatePath('/')
}

export async function addComment(postId: string, content: string) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    const commentsRef = adminDb.collection("posts").doc(postId).collection("comments");
    await commentsRef.add({
        authorId: user.id,
        content,
        createdAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/')
}

export async function getPosts() {
    try {
        const user = await getUserProfile()
        if (!user || user.role === 'pending') {
            return [] // Return empty if unauthorized
        }

        // Fetch all posts
        const postsSnapshot = await adminDb.collection("posts").orderBy("createdAt", "desc").get();

        // Build posts with author and comments
        const allPosts = await Promise.all(postsSnapshot.docs.map(async (postDoc) => {
            const postData = postDoc.data();

            // Fetch author
            const authorDoc = await adminDb.collection("users").doc(postData.authorId).get();
            const author = authorDoc.exists ? {
                id: authorDoc.id,
                displayName: authorDoc.data()?.displayName,
                imageUrl: authorDoc.data()?.imageUrl,
                email: authorDoc.data()?.email, // PostCard uses email as fallback
            } : null;

            // Fetch comments for this post
            const commentsSnapshot = await adminDb.collection("posts").doc(postDoc.id).collection("comments")
                .orderBy("createdAt", "asc")
                .get();

            const comments = await Promise.all(commentsSnapshot.docs.map(async (commentDoc) => {
                const commentData = commentDoc.data();
                const commentAuthorDoc = await adminDb.collection("users").doc(commentData.authorId).get();
                const commentAuthor = commentAuthorDoc.exists
                    ? {
                        id: commentAuthorDoc.id,
                        displayName: commentAuthorDoc.data()?.displayName,
                        imageUrl: commentAuthorDoc.data()?.imageUrl,
                        email: commentAuthorDoc.data()?.email,
                    }
                    : null;

                return {
                    id: commentDoc.id,
                    ...commentData,
                    author: commentAuthor,
                    createdAt: commentData.createdAt?.toDate() || new Date(),
                };
            }));

            return {
                id: postDoc.id,
                ...postData,
                author,
                comments,
                createdAt: postData.createdAt?.toDate() || new Date(),
            };
        }));

        return allPosts;
    } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
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
