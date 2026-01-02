'use server'

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

export type Page = {
    id: string;
    name: string;
    description: string;
    category: string;
    founderId: string;
    imageUrl?: string; // Logo
    bannerUrl?: string;
    createdAt: Date;
    followerCount?: number;
    isFollowing?: boolean;
};

export async function createPage(data: { name: string; description: string; category: string; imageUrl?: string }) {
    console.log("Creating page", data);
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const pageRef = await adminDb.collection("pages").add({
        ...data,
        founderId: user.id,
        createdAt: FieldValue.serverTimestamp(),
        followerCount: 1, // Founder automatically follows? Maybe.
    });

    // Add founder as follower/admin
    await pageRef.collection("followers").doc(user.id).set({
        userId: user.id,
        role: 'admin', // Founder is admin
        followedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/pages');
    return pageRef.id;
}

export async function getPages() {
    const pagesSnapshot = await adminDb.collection("pages").orderBy("createdAt", "desc").get();

    return pagesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
        } as Page;
    });
}

export async function getPage(pageId: string) {
    const doc = await adminDb.collection("pages").doc(pageId).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
    } as Page;
}

export async function followPage(pageId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const followerRef = adminDb.collection("pages").doc(pageId).collection("followers").doc(user.id);
    const followerDoc = await followerRef.get();

    if (followerDoc.exists) return; // Already following

    await followerRef.set({
        userId: user.id,
        role: 'follower',
        followedAt: FieldValue.serverTimestamp(),
    });

    // Increment follower count
    await adminDb.collection("pages").doc(pageId).update({
        followerCount: FieldValue.increment(1)
    });

    revalidatePath(`/pages/${pageId}`);
    revalidatePath('/pages');
}

export async function unfollowPage(pageId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    await adminDb.collection("pages").doc(pageId).collection("followers").doc(user.id).delete();

    // Decrement follower count
    await adminDb.collection("pages").doc(pageId).update({
        followerCount: FieldValue.increment(-1)
    });

    revalidatePath(`/pages/${pageId}`);
    revalidatePath('/pages');
}

export async function getPageFollowStatus(pageId: string) {
    const user = await getUserProfile();
    if (!user) return null;

    const followerDoc = await adminDb.collection("pages").doc(pageId).collection("followers").doc(user.id).get();
    if (!followerDoc.exists) return null;

    return followerDoc.data() as { role: 'admin' | 'follower', followedAt: any };
}

export async function createPagePost(pageId: string, content: string, mediaUrls: string[] = []) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    // Check if user is admin of the page
    const status = await getPageFollowStatus(pageId);
    if (status?.role !== 'admin') throw new Error("Only admins can post to the page");

    await adminDb.collection("pages").doc(pageId).collection("posts").add({
        authorId: user.id, // Or pageId if we want it to look like the page posted it? 
        // For now, let's say author is user, but we might display it differently.
        // Actually, "Pages" usually post AS the page.
        postedAsPage: true,
        pageId: pageId,
        content,
        mediaUrls,
        likes: [],
        createdAt: FieldValue.serverTimestamp(),
    });

    revalidatePath(`/pages/${pageId}`);
}

export async function getPagePosts(pageId: string) {
    // Pages are public usually, so no strict privacy check needed unless we add privacy later.
    const postsSnapshot = await adminDb.collection("pages").doc(pageId).collection("posts")
        .orderBy("createdAt", "desc")
        .get();

    const allPosts = await Promise.all(postsSnapshot.docs.map(async (postDoc) => {
        const postData = postDoc.data();

        // If postedAsPage, Fetch Page Details as Author
        let author = null;
        if (postData.postedAsPage) {
            const page = await getPage(pageId);
            if (page) {
                author = {
                    id: page.id,
                    displayName: page.name,
                    imageUrl: page.imageUrl,
                    email: null // Page has no email
                };
            }
        } else {
            const authorDoc = await adminDb.collection("users").doc(postData.authorId).get();
            author = authorDoc.exists ? {
                id: authorDoc.id,
                displayName: authorDoc.data()?.displayName,
                imageUrl: authorDoc.data()?.imageUrl,
                email: authorDoc.data()?.email,
            } : { id: 'unknown', displayName: 'Unknown' };
        }

        return {
            id: postDoc.id,
            content: postData.content || "",
            mediaUrls: postData.mediaUrls || [],
            likes: postData.likes || [],
            author, // Page or User
            createdAt: postData.createdAt?.toDate ? postData.createdAt.toDate() : new Date(postData.createdAt || Date.now()),
        } as any;
    }));

    return allPosts;
}
