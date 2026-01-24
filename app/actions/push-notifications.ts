"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

// Note: To send actual push notifications, you'll need to use Firebase Admin SDK's messaging
// For now, we'll set up the token storage and infrastructure

export async function updateUserFCMToken(token: string) {
    try {
        const user = await getUserProfile();
        if (!user) {
            throw new Error("User not authenticated");
        }

        // Add token to user's fcmTokens array (supports multiple devices)
        await adminDb.collection("users").doc(user.id).update({
            fcmTokens: FieldValue.arrayUnion(token),
            lastTokenUpdate: FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating FCM token:", error);
        return { success: false, error: "Failed to update FCM token" };
    }
}

export async function removeUserFCMToken(token: string) {
    try {
        const user = await getUserProfile();
        if (!user) {
            throw new Error("User not authenticated");
        }

        await adminDb.collection("users").doc(user.id).update({
            fcmTokens: FieldValue.arrayRemove(token)
        });

        return { success: true };
    } catch (error) {
        console.error("Error removing FCM token:", error);
        return { success: false, error: "Failed to remove FCM token" };
    }
}

export async function updateNotificationPreferences(preferences: {
    pushEnabled?: boolean;
    messages?: boolean;
    mentions?: boolean;
    events?: boolean;
    familyRequests?: boolean;
}) {
    try {
        const user = await getUserProfile();
        if (!user) {
            throw new Error("User not authenticated");
        }

        await adminDb.collection("users").doc(user.id).update({
            "notificationPreferences": preferences
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating notification preferences:", error);
        return { success: false, error: "Failed to update preferences" };
    }
}

export async function getNotificationPreferences() {
    try {
        const user = await getUserProfile();
        if (!user) {
            return null;
        }

        const userDoc = await adminDb.collection("users").doc(user.id).get();
        const data = userDoc.data();

        return data?.notificationPreferences || {
            pushEnabled: true,
            messages: true,
            mentions: true,
            events: true,
            familyRequests: true
        };
    } catch (error) {
        console.error("Error getting notification preferences:", error);
        return null;
    }
}

// Helper function to send push notification (requires Firebase Admin SDK setup)
// This is a placeholder - you'll need to implement the actual FCM sending logic
export async function sendPushNotification(
    userId: string,
    notification: {
        title: string;
        body: string;
        icon?: string;
        url?: string;
        tag?: string;
    }
) {
    try {
        // Get user's FCM tokens
        const userDoc = await adminDb.collection("users").doc(userId).get();
        const userData = userDoc.data();
        const fcmTokens = userData?.fcmTokens || [];

        if (fcmTokens.length === 0) {
            console.log("No FCM tokens for user:", userId);
            return { success: false, reason: "No FCM tokens" };
        }

        // Check user's notification preferences
        const preferences = userData?.notificationPreferences || {};
        if (!preferences.pushEnabled) {
            console.log("Push notifications disabled for user:", userId);
            return { success: false, reason: "Push disabled" };
        }

        // TODO: Implement actual FCM sending using Firebase Admin SDK
        // const messaging = admin.messaging();
        // await messaging.sendMulticast({
        //     tokens: fcmTokens,
        //     notification: {
        //         title: notification.title,
        //         body: notification.body,
        //     },
        //     data: {
        //         url: notification.url || "/",
        //         tag: notification.tag || "default",
        //     },
        //     webpush: {
        //         notification: {
        //             icon: notification.icon || "/icons/icon-192x192.png",
        //         }
        //     }
        // });

        console.log("Would send notification to:", userId, notification);
        return { success: true, tokenCount: fcmTokens.length };
    } catch (error) {
        console.error("Error sending push notification:", error);
        return { success: false, error: "Failed to send notification" };
    }
}
