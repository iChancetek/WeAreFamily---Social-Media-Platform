'use server';

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { MarketplaceListing } from "@/types/marketplace";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

export async function createListing(data: Omit<MarketplaceListing, 'id' | 'sellerId' | 'createdAt' | 'status'>) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const listingData = {
        ...data,
        sellerId: user.id,
        sellerName: user.displayName || 'Unknown',
        sellerImage: user.photoURL,
        createdAt: new Date().toISOString(),
        status: 'active',
        likes: 0,
        repostCount: 0,
        reportCount: 0
    };

    const docRef = await adminDb.collection("listings").add(listingData);
    revalidatePath('/marketplace');
    return { id: docRef.id, ...listingData };
}

export async function getListings(category?: string) {
    let query = adminDb.collection("listings").orderBy("createdAt", "desc").limit(50);

    if (category && category !== 'all') {
        query = query.where("category", "==", category);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        repostCount: doc.data().repostCount || 0,
        reportCount: doc.data().reportCount || 0
    })) as any[];
}

export async function incrementRepostCount(listingId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const listingRef = adminDb.collection("listings").doc(listingId);
    const repostRef = adminDb.collection("reposts").doc(`${listingId}_${user.id}`);
    
    const repostDoc = await repostRef.get();
    if (repostDoc.exists) {
        throw new Error("You have already reposted this.");
    }

    const listingDoc = await listingRef.get();
    if (!listingDoc.exists) throw new Error("Listing not found");
    const listingData = listingDoc.data()!;

    await adminDb.runTransaction(async (transaction: any) => {
        transaction.set(repostRef, {
            userId: user.id,
            targetId: listingId,
            type: 'marketplace',
            createdAt: FieldValue.serverTimestamp()
        });
        transaction.update(listingRef, {
            repostCount: FieldValue.increment(1)
        });
    });

    // Create a post in the main feed
    try {
        const { createPost } = await import("./posts");
        await createPost(
            `🛒 Checked out this listing: **${listingData.title}** for $${listingData.price}\n\n${listingData.description.substring(0, 100)}...`,
            listingData.images && listingData.images.length > 0 
                ? listingData.images.map((url: string) => ({ type: 'photo', url }))
                : []
        );
    } catch (e) {
        console.error("Failed to create repost post:", e);
    }

    revalidatePath('/marketplace');
}

export async function incrementReportCount(listingId: string) {
    const listingRef = adminDb.collection("listings").doc(listingId);
    await listingRef.update({
        reportCount: FieldValue.increment(1)
    });
}
