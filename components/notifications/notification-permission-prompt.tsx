"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requestNotificationPermission } from "@/lib/firebase-messaging";
import { updateUserFCMToken } from "@/app/actions/push-notifications";

export function NotificationPermissionPrompt() {
    const [show, setShow] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        // Check if we should show the prompt
        const checkPermission = () => {
            if (typeof window === "undefined" || !("Notification" in window)) return;

            const permission = Notification.permission;
            const dismissed = localStorage.getItem("notification-prompt-dismissed");

            // Show prompt if permission is default and user hasn't dismissed it
            if (permission === "default" && !dismissed) {
                // Show after 30 seconds
                setTimeout(() => setShow(true), 30000);
            }
        };

        checkPermission();
    }, []);

    const handleEnable = async () => {
        setIsRequesting(true);
        try {
            const token = await requestNotificationPermission();
            if (token) {
                await updateUserFCMToken(token);
                setShow(false);
                localStorage.setItem("notification-prompt-dismissed", "granted");
            } else {
                localStorage.setItem("notification-prompt-dismissed", "denied");
            }
        } catch (error) {
            console.error("Error enabling notifications:", error);
        }
        setIsRequesting(false);
    };

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem("notification-prompt-dismissed", "dismissed");
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom">
            <Card className="shadow-xl border-2">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Enable Notifications?</CardTitle>
                                <CardDescription className="text-sm mt-1">
                                    Stay updated with real-time alerts
                                </CardDescription>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDismiss}
                            className="h-8 w-8"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">✓</span>
                            <span>Get notified of new messages instantly</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">✓</span>
                            <span>Never miss important family updates</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">✓</span>
                            <span>Stay connected even when app is closed</span>
                        </li>
                    </ul>
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={handleEnable}
                            disabled={isRequesting}
                            className="flex-1"
                        >
                            {isRequesting ? "Enabling..." : "Enable Notifications"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleDismiss}
                        >
                            Not Now
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
