'use server'

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { resolveDisplayName } from "@/lib/user-utils";
import { sanitizeData } from "@/lib/serialization";
import { sendPushNotification } from "./push-notifications";


export type NotificationType = 'like' | 'comment' | 'group_invite' | 'follow' | 'mention' | 'admin_action' | 'companion_request' | 'message';



export type Notification = {
    id: string;
    recipientId: string;
    senderId: string;
    type: NotificationType;
    referenceId: string; // The ID of the post, group, or branding
    read: boolean;
    createdAt: Date;
    sender?: {
        id?: string;
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

    // Send Push Notification
    try {
        let url = '/';
        let body = 'You have a new notification';
        const title = 'Famio';

        // Construct URL and Body based on type
        switch (type) {
            case 'like':
                url = `/post/${referenceId}`;
                body = `${sender.displayName} liked your post`;
                break;
            case 'comment':
                url = `/post/${referenceId}`;
                body = `${sender.displayName} commented on your post`;
                break;
            case 'follow':
                url = `/u/${sender.id}`;
                body = `${sender.displayName} started following you`;
                break;
            case 'group_invite':
                url = `/groups/${referenceId}`; // Assuming referenceId is groupId
                body = `${sender.displayName} invited you to a group`;
                break;
            case 'mention':
                // Check if mention is in post or comment? Usually points to post.
                url = `/post/${referenceId}`;
                body = `${sender.displayName} mentioned you`;
                break;
            case 'companion_request':
                url = `/members`;
                body = `${sender.displayName} sent you a companion request`;
                break;
            case 'message':
                url = `/messages`;
                body = `${sender.displayName} sent you a message`;
                break;
            default:
                url = '/notifications';
                body = `New notification from ${sender.displayName}`;
        }

        await sendPushNotification(recipientId, {
            title,
            body,
            url,
            icon: sender.imageUrl,
            tag: type // Group notifications by type
        });
    } catch (pushError) {
        console.error("Failed to trigger push notification (non-blocking):", pushError);
    }

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
        const senderDoc = await adminDb.collection('users').doc(data.senderId).get();

        const sender = senderDoc.exists ? {
            id: senderDoc.id,
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
