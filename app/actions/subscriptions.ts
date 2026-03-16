'use server';

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getUserProfile, requireVerifiedAction } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Subscribe to a creator
 */
export async function subscribeToCreator(creatorId: string, tier: 'free' | 'paid' = 'free') {
    const user = await requireVerifiedAction();
    if (user.id === creatorId) {
         throw new Error("You cannot subscribe to yourself.");
    }

    const docId = `${user.id}_${creatorId}`;
    const subRef = adminDb.collection("subscriptions").doc(docId);

    try {
        await subRef.set({
            subscriberId: user.id,
            creatorId: creatorId,
            tier: tier,
            status: 'active',
            updatedAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp() // fallback if doesn't exist, but set overwrites
        }, { merge: true });

        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error("Subscribe failed:", e);
        throw new Error("Failed to subscribe.");
    }
}

/**
 * Unsubscribe from a creator
 */
export async function unsubscribeFromCreator(creatorId: string) {
    const user = await requireVerifiedAction();
    const docId = `${user.id}_${creatorId}`;
    const subRef = adminDb.collection("subscriptions").doc(docId);

    try {
        await subRef.update({
            status: 'cancelled',
            updatedAt: FieldValue.serverTimestamp()
        });

        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error("Unsubscribe failed:", e);
        throw new Error("Failed to unsubscribe.");
    }
}

/**
 * Get subscription status to a creator
 */
export async function getSubscriptionStatus(creatorId: string) {
    const user = await getUserProfile();
    if (!user) return { isSubscribed: false, tier: null };

    const docId = `${user.id}_${creatorId}`;
    const subDoc = await adminDb.collection("subscriptions").doc(docId).get();

    if (!subDoc.exists) {
        return { isSubscribed: false, tier: null };
    }

    const data = subDoc.data();
    if (data?.status !== 'active') {
        return { isSubscribed: false, tier: null };
    }

    return {
        isSubscribed: true,
        tier: data.tier as 'free' | 'paid'
    };
}

/**
 * Get subscribers for a creator
 */
export async function getCreatorSubscribers(creatorId: string) {
    const user = await requireVerifiedAction();
    if (user.id !== creatorId) {
        throw new Error("Unauthorized to view subscribers.");
    }

    const snapshot = await adminDb.collection("subscriptions")
        .where("creatorId", "==", creatorId)
        .where("status", "==", "active")
        .get();

    const subscribers = await Promise.all(snapshot.docs.map(async (doc: any) => {
        const data = doc.data();
        const userDoc = await adminDb.collection("users").doc(data.subscriberId).get();
        const uD = userDoc.data();
        
        return {
            subscriberId: data.subscriberId,
            tier: data.tier,
            displayName: uD?.displayName || uD?.email || "User",
            imageUrl: uD?.imageUrl
        };
    }));

    return subscribers;
}
