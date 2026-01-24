"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
    // Initialize with correct value to avoid setState in useEffect
    const [isOnline, setIsOnline] = useState(() => typeof window !== 'undefined' ? navigator.onLine : true);
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowNotification(true);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (!showNotification) return null;

    return (
        <div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] 
                 px-6 py-3 rounded-full shadow-lg backdrop-blur-md
                 transition-all duration-300 animate-in slide-in-from-top"
            style={{
                backgroundColor: isOnline
                    ? "rgba(34, 197, 94, 0.9)"
                    : "rgba(239, 68, 68, 0.9)",
                color: "white",
            }}
        >
            <div className="flex items-center gap-2 text-sm font-medium">
                {isOnline ? (
                    <>
                        <Wifi className="w-4 h-4" />
                        <span>Back online</span>
                    </>
                ) : (
                    <>
                        <WifiOff className="w-4 h-4" />
                        <span>You're offline — some features may be limited</span>
                    </>
                )}
            </div>
        </div>
    );
}
