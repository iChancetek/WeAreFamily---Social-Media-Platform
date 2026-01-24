"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    // Initialize with correct values to avoid setState in useEffect
    const [isIOS] = useState(() => typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent));
    const [isStandalone] = useState(() => typeof window !== 'undefined' && window.matchMedia("(display-mode: standalone)").matches);

    useEffect(() => {
        // Listen for install prompt (Android/Desktop)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show prompt after 30 seconds if user hasn't dismissed before
            const dismissed = localStorage.getItem("pwa-install-dismissed");
            if (!dismissed) {
                setTimeout(() => setShowPrompt(true), 30000);
            }
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("pwa-install-dismissed", "true");
    };

    // Don't show if already installed or user dismissed
    if (isStandalone || (!showPrompt && !isIOS)) return null;

    // iOS-specific install instructions
    if (isIOS && showPrompt) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-start gap-4">
                        <Share className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h3 className="font-semibold mb-2">Install Famio on iOS</h3>
                            <ol className="text-sm text-muted-foreground space-y-1">
                                <li>1. Tap the <Share className="inline w-4 h-4" /> Share button in Safari</li>
                                <li>2. Scroll down and tap "Add to Home Screen"</li>
                                <li>3. Tap "Add" in the top-right corner</li>
                            </ol>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleDismiss}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Android/Desktop install prompt
    if (deferredPrompt && showPrompt) {
        return (
            <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 
                      bg-card border rounded-lg shadow-xl p-4">
                <div className="flex items-start gap-4">
                    <Download className="w-6 h-6 text-blue-500 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-semibold mb-1">Install Famio</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            Get quick access and a better experience with our app
                        </p>
                        <div className="flex gap-2">
                            <Button onClick={handleInstall} size="sm">
                                Install
                            </Button>
                            <Button onClick={handleDismiss} variant="ghost" size="sm">
                                Not Now
                            </Button>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleDismiss}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}
