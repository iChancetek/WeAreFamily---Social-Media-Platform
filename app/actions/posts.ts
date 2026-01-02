'use server'

import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    arrayUnion,
    arrayRemove,
    serverTimestamp
} from "firebase/firestore";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createPost(content: string, mediaUrls: string[] = []) {
    const user = await getUserProfile()
    if (!user || user.role === 'pending') {
        throw new Error("Unauthorized")
    }

    await addDoc(collection(db, "posts"), {
        authorId: user.id,
        content,
        mediaUrls,
        likes: [],
        createdAt: serverTimestamp(),
    });

    revalidatePath('/')
}

export async function toggleLike(postId: string) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) throw new Error("Post not found")

    const currentLikes = postSnap.data().likes || []
    const isLiked = currentLikes.includes(user.id)

    if (isLiked) {
        await updateDoc(postRef, {
            likes: arrayRemove(user.id)
        });
    } else {
        await updateDoc(postRef, {
            likes: arrayUnion(user.id)
        });
    }

    revalidatePath('/')
}

export async function addComment(postId: string, content: string) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    const commentsRef = collection(db, "posts", postId, "comments");
    await addDoc(commentsRef, {
        authorId: user.id,
        content,
        createdAt: serverTimestamp(),
    });

    revalidatePath('/')
}

export async function getPosts() {
    const user = await getUserProfile()
    if (!user || user.role === 'pending') {
        throw new Error("Unauthorized")
    }

    // Fetch all posts
    const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const postsSnapshot = await getDocs(postsQuery);

    // Build posts with author and comments
    const allPosts = await Promise.all(postsSnapshot.docs.map(async (postDoc) => {
        const postData = postDoc.data();

        // Fetch author
        const authorDoc = await getDoc(doc(db, "users", postData.authorId));
        const author = authorDoc.exists() ? { id: authorDoc.id, ...authorDoc.data() } : null;

        // Fetch comments for this post
        const commentsQuery = query(
            collection(db, "posts", postDoc.id, "comments"),
            orderBy("createdAt", "asc")
        );
        const commentsSnapshot = await getDocs(commentsQuery);

        const comments = await Promise.all(commentsSnapshot.docs.map(async (commentDoc) => {
            const commentData = commentDoc.data();
            const commentAuthorDoc = await getDoc(doc(db, "users", commentData.authorId));
            const commentAuthor = commentAuthorDoc.exists()
                ? { id: commentAuthorDoc.id, ...commentAuthorDoc.data() }
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
}

export async function deletePost(postId: string) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) throw new Error("Post not found")

    const post = postSnap.data();
    if (post.authorId !== user.id && user.role !== 'admin') {
        throw new Error("Forbidden")
    }

    // Delete all comments first
    const commentsQuery = query(collection(db, "posts", postId, "comments"));
    const commentsSnapshot = await getDocs(commentsQuery);
    await Promise.all(commentsSnapshot.docs.map(commentDoc => deleteDoc(commentDoc.ref)));

    // Delete the post
    await deleteDoc(postRef);

    revalidatePath('/')
}
