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
    deletedAt?: any;
    scheduledPermanentDeleteAt?: any;
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

    return brandingsSnapshot.docs
        .map((doc: any) => {
            return sanitizeData({
                id: doc.id,
                ...doc.data()
            }) as Branding;
        })
        .filter(b => !b.deletedAt);
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

export async function editBrandingPost(brandingId: string, postId: string, content: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const postRef = adminDb.collection("pages").doc(brandingId).collection("posts").doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) throw new Error("Post not found");
    const postData = postDoc.data();

    // Check permissions
    if (postData?.postedAsBranding) {
        // If posted as branding, checking if user is admin
        const status = await getBrandingFollowStatus(brandingId);
        if (status?.role !== 'admin') throw new Error("Unauthorized");
    } else {
        // If posted as user, check authorId
        if (postData?.authorId !== user.id) throw new Error("Unauthorized");
    }

    await postRef.update({
        content,
        isEdited: true,
        updatedAt: FieldValue.serverTimestamp()
    });

    revalidatePath(`/branding/${brandingId}`);
}

import { PostFilters } from "./posts";

export async function getBrandingPosts(brandingId: string, limit = 50, filters: PostFilters = { timeRange: 'all', contentType: 'all' }) {
    const postsSnapshot = await adminDb.collection("pages").doc(brandingId).collection("posts")
        .orderBy("createdAt", "desc")
        .get();

    let allDocs = postsSnapshot.docs;

    // Filter Soft Deleted
    allDocs = allDocs.filter(doc => !doc.data().isDeleted);

    // Apply Memory Filters
    if (filters.contentType !== 'all') {
        allDocs = allDocs.filter(doc => {
            const data = doc.data();
            const hasMedia = data.mediaUrls && data.mediaUrls.length > 0;
            const videoUrlRegex = /https?:\/\/(www\.)?(youtube\.com|youtu\.be|facebook\.com|linkedin\.com|vimeo\.com|ds1\.chancetek.com)\/\S+/i;
            const hasVideoLink = videoUrlRegex.test(data.content || "");
            const isVideo = (hasMedia && data.mediaUrls.some((u: string) => u.match(/\.(mp4|mov|webm)$/i))) || hasVideoLink;
            const isPhoto = hasMedia && !isVideo;
            const isText = !hasMedia && !hasVideoLink;

            if (filters.contentType === 'video') return isVideo;
            if (filters.contentType === 'photo') return isPhoto;
            if (filters.contentType === 'text') return isText;
            return true;
        });
    }

    if (filters.timeRange !== 'all') {
        const now = new Date();
        const msPerDay = 24 * 60 * 60 * 1000;
        allDocs = allDocs.filter(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            const diff = now.getTime() - createdAt.getTime();
            if (filters.timeRange === 'day') return diff < msPerDay;
            if (filters.timeRange === 'week') return diff < msPerDay * 7;
            if (filters.timeRange === 'month') return diff < msPerDay * 30;
            if (filters.timeRange === 'year') return diff < msPerDay * 365;
            return true;
        });
    }

    const slicedDocs = allDocs.slice(0, limit);

    const allPosts = await Promise.all(slicedDocs.map(async (postDoc: any) => {
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
            // Fetch author (should be the brand or the admin user posting as brand)
            const authorDoc = await adminDb.collection("users").doc(postData.authorId).get();
            author = authorDoc.exists ? {
                id: authorDoc.id,
                displayName: authorDoc.data()?.displayName,
                imageUrl: authorDoc.data()?.imageUrl,
                email: authorDoc.data()?.email,
            } : null;
        }

        return sanitizeData({
            id: postDoc.id,
            content: postData.content || "",
            mediaUrls: postData.mediaUrls || [],
            createdAt: postData.createdAt,
            likes: postData.likes || [],
            reactions: postData.reactions || {},
            authorId: postData.authorId, // CRITICAL: Return authorId
            author,
            postedAsBranding: postData.postedAsBranding,
            context: { type: 'branding', id: brandingId },
            comments: []
        });
    }));

    return allPosts;
}

export async function getBrandingPost(brandingId: string, postId: string) {
    try {
        const postRef = adminDb.collection("pages").doc(brandingId).collection("posts").doc(postId);
        const doc = await postRef.get();
        if (!doc.exists) return null;

        const data = doc.data()!;

        // Fetch Author
        const authorDoc = await adminDb.collection("users").doc(data.authorId).get();
        const author = authorDoc.exists ? {
            id: authorDoc.id,
            displayName: authorDoc.data()?.displayName,
            imageUrl: authorDoc.data()?.imageUrl,
            email: authorDoc.data()?.email,
        } : null;

        return sanitizeData({
            id: doc.id,
            content: data.content || "",
            mediaUrls: data.mediaUrls || [],
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            likes: data.likes || [],
            reactions: data.reactions || {},
            authorId: data.authorId, // CRITICAL
            author,
            postedAsBranding: data.postedAsBranding,
            context: { type: 'branding', id: brandingId },
            comments: []
        });
    } catch (error) {
        console.error("Error fetching branding post:", error);
        return null;
    }
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

export async function updateBrandingDetails(brandingId: string, data: { name?: string; description?: string; coverUrl?: string }) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const brandingDoc = await adminDb.collection("pages").doc(brandingId).get();
    if (!brandingDoc.exists) throw new Error("Page not found");

    // Only founder or admin can update
    const brandingData = brandingDoc.data();
    if (brandingData?.founderId !== user.id) {
        const followerDoc = await adminDb.collection("pages").doc(brandingId).collection("followers").doc(user.id).get();
        if (!followerDoc.exists || followerDoc.data()?.role !== 'admin') {
            throw new Error("Unauthorized");
        }
    }

    await adminDb.collection("pages").doc(brandingId).update({
        ...data,
        updatedAt: FieldValue.serverTimestamp()
    });

    revalidatePath(`/branding/${brandingId}`);
    revalidatePath('/branding');
}

export async function softDeleteBranding(brandingId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const brandingDoc = await adminDb.collection("pages").doc(brandingId).get();
    if (!brandingDoc.exists) throw new Error("Page not found");

    if (brandingDoc.data()?.founderId !== user.id) throw new Error("Only the founder can delete the page");

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    await adminDb.collection("pages").doc(brandingId).update({
        deletedAt: FieldValue.serverTimestamp(),
        scheduledPermanentDeleteAt: thirtyDaysLater
    });

    revalidatePath(`/branding/${brandingId}`);
    revalidatePath('/branding');
}

export async function restoreBranding(brandingId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const brandingDoc = await adminDb.collection("pages").doc(brandingId).get();
    if (!brandingDoc.exists) throw new Error("Page not found");

    if (brandingDoc.data()?.founderId !== user.id) throw new Error("Unauthorized");

    await adminDb.collection("pages").doc(brandingId).update({
        deletedAt: FieldValue.delete(),
        scheduledPermanentDeleteAt: FieldValue.delete()
    });

    revalidatePath(`/branding/${brandingId}`);
    revalidatePath('/branding');
}
