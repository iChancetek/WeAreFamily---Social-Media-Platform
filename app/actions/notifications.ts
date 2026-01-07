'use server'

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { sanitizeData } from "@/lib/serialization";

export type NotificationType = 'like' | 'comment' | 'group_invite' | 'follow' | 'mention' | 'admin_action' | 'family_request' | 'message';

export type Notification = {
    id: string;
    recipientId: string;
    senderId: string;
    type: NotificationType;
    referenceId: string; // The ID of the post, group, or branding
    read: boolean;
    createdAt: Date;
    sender?: {
        displayName: string;
        imageUrl?: string;
    };
    meta?: any; // Extra data like "GroupName" or "PostPreview"
};

export async function createNotification(
    recipientId: string,
    type: NotificationType,
    referenceId: string,
    meta?: any
) {
    const sender = await getUserProfile();
    if (!sender) return; // Should likely be logged in to trigger notifs
    if (sender.id === recipientId) return; // Don't notify self

    // Check for existing similar notification to avoid spam? 
    // E.g. multiple likes on same post? 
    // For now simple add.

    await adminDb.collection("notifications").add({
        recipientId,
        senderId: sender.id,
        type,
        referenceId,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
        meta: meta || {}
    });

    // We don't revalidate immediately usually for notifications as they are polled or fetched on page load.
    // But specific paths might care.
}

export async function getNotifications() {
    const user = await getUserProfile();
    if (!user) return [];

    let snapshot;
    try {
        snapshot = await adminDb.collection("notifications")
            .where("recipientId", "==", user.id)
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();
    } catch (err) {
        console.log("Index missing for getNotifications, falling back to unordered query");
        snapshot = await adminDb.collection("notifications")
            .where("recipientId", "==", user.id)
            .limit(50) // Fetch a bit more to ensure recent ones are included
            .get();
    }

    const notifications = await Promise.all(snapshot.docs.map(async (doc: any) => {
        const data = doc.data();

        // Hydrate sender info
        const senderDoc = await adminDb.collection("users").doc(data.senderId).get();
        import { resolveDisplayName } from "@/lib/user-utils";

        // ... imports ...

        export async function getNotifications() {
            // ...
            const sender = senderDoc.exists ? {
                displayName: resolveDisplayName(senderDoc.data()),
                imageUrl: senderDoc.data()?.imageUrl
            } : { displayName: "Unknown" };

            return sanitizeData({
                id: doc.id,
                ...data,
                sender,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
            });
        }));

    // Ensure sorting in case we fell back to unordered query
    return notifications.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
    });
}

export async function markAsRead(notificationId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    await adminDb.collection("notifications").doc(notificationId).update({
        read: true
    });

    revalidatePath('/notifications');
}

export async function markAllAsRead() {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const snapshot = await adminDb.collection("notifications")
        .where("recipientId", "==", user.id)
        .where("read", "==", false)
        .get();

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc: any) => {
        batch.update(doc.ref, { read: true });
    });

    await batch.commit();
    revalidatePath('/notifications');
}

export async function getUnreadCount() {
    const user = await getUserProfile();
    if (!user) return 0;

    const snapshot = await adminDb.collection("notifications")
        .where("recipientId", "==", user.id)
        .where("read", "==", false)
        .count()
        .get();

    return snapshot.data().count;
}
