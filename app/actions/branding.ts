'use server'

import { slugify } from "@/lib/utils";

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { sanitizeData } from "@/lib/serialization";

export type Branding = {
    id: string;
    slug?: string;
    name: string;
    description: string;
    category: string;
    founderId: string;
    imageUrl?: string; // Logo
    bannerUrl?: string;
    coverUrl?: string; // Cover photo/video
    createdAt: Date;
    followerCount?: number;
    isFollowing?: boolean;
};

export async function createBranding(data: { name: string; description: string; category: string; imageUrl?: string; coverUrl?: string }) {
    console.log("Creating branding", data);
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    let slug = slugify(data.name);
    let potentialId = slug;
    let counter = 0;

    // Check for uniqueness
    while (true) {
        // 1. Check ID collision
        const doc = await adminDb.collection("pages").doc(potentialId).get();
        if (doc.exists) {
            counter++;
            potentialId = `${slug}-${counter}`;
            continue;
        }

        // 2. Check Slug collision
        const slugCheck = await adminDb.collection("pages").where("slug", "==", potentialId).limit(1).get();
        if (!slugCheck.empty) {
            counter++;
            potentialId = `${slug}-${counter}`;
            continue;
        }

        break;
    }

    const brandingRef = adminDb.collection("pages").doc(potentialId);
    await brandingRef.set({
        ...data,
        slug: potentialId,
        founderId: user.id,
        createdAt: FieldValue.serverTimestamp(),
        followerCount: 1, // Founder automatically follows? Maybe.
    });

    // Add founder as follower/admin
    await brandingRef.collection("followers").doc(user.id).set({
        userId: user.id,
        role: 'admin', // Founder is admin
        followedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/branding');
    return brandingRef.id;
}

export async function getBrandings() {
    const brandingsSnapshot = await adminDb.collection("pages").orderBy("createdAt", "desc").get();

    return brandingsSnapshot.docs.map((doc: any) => {
        return sanitizeData({
            id: doc.id,
            ...doc.data()
        }) as Branding;
    });
}

export async function getBranding(identifier: string) {
    // 1. Try by ID (Fastest/Default for new pages)
    let doc = await adminDb.collection("pages").doc(identifier).get();

    // 2. If not found, try by slug
    if (!doc.exists) {
        const snapshot = await adminDb.collection("pages").where("slug", "==", identifier).limit(1).get();
        if (!snapshot.empty) {
            doc = snapshot.docs[0];
        } else {
            return null;
        }
    }

    return sanitizeData({
        id: doc.id,
        ...doc.data()
    }) as Branding;
}

export async function followBranding(brandingId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const followerRef = adminDb.collection("pages").doc(brandingId).collection("followers").doc(user.id);
    const followerDoc = await followerRef.get();

    if (followerDoc.exists) return; // Already following

    await followerRef.set({
        userId: user.id,
        role: 'follower',
        followedAt: FieldValue.serverTimestamp(),
    });

    // Increment follower count
    await adminDb.collection("pages").doc(brandingId).update({
        followerCount: FieldValue.increment(1)
    });

    // Notify Branding Founder/Admin
    const brandingDoc = await adminDb.collection("pages").doc(brandingId).get();
    const brandingData = brandingDoc.data();
    if (brandingData && brandingData.founderId) {
        const { createNotification } = await import("./notifications");
        await createNotification(brandingData.founderId, 'follow', brandingId, {
            brandingName: brandingData.name
        }).catch(console.error);
    }

    revalidatePath(`/branding/${brandingId}`);
    revalidatePath('/branding');
}

export async function unfollowBranding(brandingId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    await adminDb.collection("pages").doc(brandingId).collection("followers").doc(user.id).delete();

    // Decrement follower count
    await adminDb.collection("pages").doc(brandingId).update({
        followerCount: FieldValue.increment(-1)
    });

    revalidatePath(`/branding/${brandingId}`);
    revalidatePath('/branding');
}

export async function getBrandingFollowStatus(brandingId: string) {
    const user = await getUserProfile();
    if (!user) return null;

    const followerDoc = await adminDb.collection("pages").doc(brandingId).collection("followers").doc(user.id).get();
    if (!followerDoc.exists) return null;

    return sanitizeData(followerDoc.data()) as { role: 'admin' | 'follower', followedAt: any };
}

export async function createBrandingPost(brandingId: string, content: string, mediaUrls: string[] = []) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    // Check if user is a follower or admin
    const status = await getBrandingFollowStatus(brandingId);
    if (!status) throw new Error("Must follow the page to post");

    const isAdmin = status.role === 'admin';

    await adminDb.collection("pages").doc(brandingId).collection("posts").add({
        authorId: user.id,
        postedAsBranding: isAdmin, // Only admins post AS the brand
        brandingId: brandingId,
        content,
        mediaUrls,
        likes: [],
        createdAt: FieldValue.serverTimestamp(),
    });

    revalidatePath(`/branding/${brandingId}`);
}

export async function getBrandingPosts(brandingId: string) {
    const postsSnapshot = await adminDb.collection("pages").doc(brandingId).collection("posts")
        .orderBy("createdAt", "desc")
        .get();

    const allPosts = await Promise.all(postsSnapshot.docs.map(async (postDoc: any) => {
        const postData = postDoc.data();

        // If postedAsBranding, Fetch Branding Details as Author
        let author = null;
        if (postData.postedAsBranding) {
            const branding = await getBranding(brandingId);
            if (branding) {
                author = {
                    id: branding.id,
                    displayName: branding.name,
                    imageUrl: branding.imageUrl,
                    email: null
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

        return sanitizeData({
            id: postDoc.id,
            content: postData.content || "",
            mediaUrls: postData.mediaUrls || [],
            createdAt: postData.createdAt,
            likes: postData.likes || [],
            author
        });
    }));

    return allPosts;
}

export async function getFollowedBrandingIds(userId: string) {
    const snapshot = await adminDb.collectionGroup("followers")
        .where("userId", "==", userId)
        .get();

    const brandingIds = new Set<string>();

    snapshot.docs.forEach((doc: any) => {
        const brandingDoc = doc.ref.parent.parent;
        if (brandingDoc) {
            brandingIds.add(brandingDoc.id);
        }
    });

    return Array.from(brandingIds);
}

export async function updateBrandingCover(brandingId: string, coverUrl: string | null) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    // Check if user is founder or admin
    const brandingDoc = await adminDb.collection("pages").doc(brandingId).get();
    if (!brandingDoc.exists) throw new Error("Branding not found");

    const brandingData = brandingDoc.data();
    const isFounder = brandingData?.founderId === user.id;

    if (!isFounder) {
        // Check if admin follower
        const followerDoc = await adminDb.collection("pages").doc(brandingId).collection("followers").doc(user.id).get();
        const isAdmin = followerDoc.exists && followerDoc.data()?.role === 'admin';
        if (!isAdmin) {
            throw new Error("Only branding founder or admins can update the cover");
        }
    }

    await adminDb.collection("pages").doc(brandingId).update({
        coverUrl: coverUrl || null
    });

    revalidatePath(`/branding/${brandingId}`);
    revalidatePath('/branding');
}
