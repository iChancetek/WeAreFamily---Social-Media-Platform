"use client";

import { useEffect, useState } from "react";
import { getFCMToken, onForegroundMessage } from "@/lib/firebase-messaging";
import { updateUserFCMToken } from "@/app/actions/push-notifications";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";

export function PushNotificationManager() {
    const { user } = useAuth();
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (!user || isInitialized) return;

        const initializeNotifications = async () => {
            try {
                // Check if service worker is supported
                if (!("serviceWorker" in navigator)) {
                    console.log("Service Worker not supported");
                    return;
                }

                // Register Firebase Messaging service worker
                const registration = await navigator.serviceWorker.register(
                    "/firebase-messaging-sw.js"
                );

                console.log("Firebase Messaging SW registered:", registration);

                // Check current permission
                if (Notification.permission === "granted") {
                    const token = await getFCMToken();
                    if (token) {
                        await updateUserFCMToken(token);
                        console.log("FCM token saved:", token);
                    }
                }

                // Listen for foreground messages
                const unsubscribe = onForegroundMessage((payload) => {
                    console.log("Foreground message received:", payload);

                    toast(payload.notification?.title || "New Notification", {
                        description: payload.notification?.body,
                        action: payload.data?.url ? {
                            label: "View",
                            onClick: () => window.location.href = payload.data.url
                        } : undefined
                    });
                });

                setIsInitialized(true);

                return () => {
                    if (typeof unsubscribe === 'function') {
                        unsubscribe();
                    }
                };
            } catch (error) {
                console.error("Error initializing push notifications:", error);
            }
        };

        initializeNotifications();
    }, [user, isInitialized]);

    return null; // This is a manager component with no UI
}
