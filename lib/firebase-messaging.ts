import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getApps } from "firebase/app";

let messaging: any = null;

export function getFirebaseMessaging() {
    if (typeof window === "undefined") return null;

    if (!messaging && getApps().length > 0) {
        try {
            messaging = getMessaging();
        } catch (error) {
            console.error("Error initializing Firebase Messaging:", error);
            return null;
        }
    }

    return messaging;
}

export async function requestNotificationPermission(): Promise<string | null> {
    try {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            return await getFCMToken();
        } else {
            console.log("Notification permission denied");
            return null;
        }
    } catch (error) {
        console.error("Error requesting notification permission:", error);
        return null;
    }
}

export async function getFCMToken(): Promise<string | null> {
    try {
        const messaging = getFirebaseMessaging();
        if (!messaging) return null;

        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            console.error("VAPID key not configured");
            return null;
        }

        const token = await getToken(messaging, { vapidKey });
        return token;
    } catch (error) {
        console.error("Error getting FCM token:", error);
        return null;
    }
}

export function onForegroundMessage(callback: (payload: any) => void) {
    const messaging = getFirebaseMessaging();
    if (!messaging) return () => { };

    return onMessage(messaging, callback);
}
