"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Don't show if already running as installed PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }

        // Check if user has permanently dismissed
        const dismissedUntil = localStorage.getItem("pwa-install-dismissed-until");
        if (dismissedUntil) {
            const dismissedDate = new Date(dismissedUntil);
            if (dismissedDate > new Date()) {
                return; // Still within dismiss period
            }
        }

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Show prompt after 10 seconds
            setTimeout(() => {
                setShowPrompt(true);
            }, 10000);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            console.log("PWA install accepted");
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = (permanent = false) => {
        setShowPrompt(false);

        if (permanent) {
            // Dismiss for 30 days
            const dismissUntil = new Date();
            dismissUntil.setDate(dismissUntil.getDate() + 30);
            localStorage.setItem("pwa-install-dismissed-until", dismissUntil.toISOString());
        }
    };

    if (!showPrompt || !deferredPrompt) return null;

    return (
        <div className="fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-top">
            <Card className="shadow-xl border-2">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                                <Download className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Install Famio</CardTitle>
                                <CardDescription className="text-sm mt-1">
                                    Get the app experience
                                </CardDescription>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDismiss(false)}
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
                            <span>Faster access from your desktop</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">✓</span>
                            <span>Works offline</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">✓</span>
                            <span>Native app experience</span>
                        </li>
                    </ul>
                    <div className="flex flex-col gap-2 pt-2">
                        <Button
                            onClick={handleInstall}
                            className="w-full"
                        >
                            Install Now
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismiss(true)}
                            className="text-xs"
                        >
                            Don't show again for 30 days
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
