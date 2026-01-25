"use client";

import { useEffect, useState } from "react";
import { syncManager, SyncQueueItem } from "@/lib/pwa/background-sync";
import { Loader2, WifiOff, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SyncStatusIndicator() {
    const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
    const [isOnline, setIsOnline] = useState(true);
    const [showQueue, setShowQueue] = useState(false);

    useEffect(() => {
        // Set actual state on mount
        setIsOnline(navigator.onLine);

        const checkQueue = async () => {
            const items = await syncManager.getQueue();
            setQueueItems(items);
        };

        const handleOnline = () => {
            setIsOnline(true);
            checkQueue();
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        checkQueue();

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check queue every 10 seconds
        const interval = setInterval(checkQueue, 10000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    const handleClearQueue = async () => {
        await syncManager.clearQueue();
        setQueueItems([]);
        setShowQueue(false);
    };

    if (queueItems.length === 0) return null;

    return (
        <>
            {/* Floating indicator */}
            <div
                className="fixed bottom-20 right-4 z-40 cursor-pointer"
                onClick={() => setShowQueue(!showQueue)}
            >
                <div className="bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
                    {!isOnline && <WifiOff className="w-4 h-4" />}
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-medium text-sm">
                        {queueItems.length} pending sync{queueItems.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Queue details */}
            {showQueue && (
                <div className="fixed bottom-32 right-4 z-50 max-w-sm animate-in slide-in-from-bottom">
                    <Card className="shadow-xl">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Pending Actions</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowQueue(false)}
                                >
                                    Close
                                </Button>
                            </div>

                            {!isOnline && (
                                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                                    <p className="text-sm text-orange-800 dark:text-orange-200">
                                        <WifiOff className="w-4 h-4 inline mr-2" />
                                        You're offline. Actions will sync when connection is restored.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {queueItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-2 p-2 bg-muted rounded-lg text-sm"
                                    >
                                        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-medium capitalize">{item.type}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(item.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {queueItems.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearQueue}
                                    className="w-full"
                                >
                                    Clear Queue
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
    );
}
