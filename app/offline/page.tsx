'use client';

import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center max-w-md px-6">
                <WifiOff className="w-24 h-24 mx-auto text-muted-foreground mb-6" />

                <h1 className="text-3xl font-bold mb-4">You're Offline</h1>

                <p className="text-muted-foreground mb-8">
                    Famio works best with an internet connection. Check your network settings and try again.
                </p>

                <Button
                    onClick={() => {
                        if (typeof window !== 'undefined') {
                            window.location.reload();
                        }
                    }}
                    className="gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </Button>

                <div className="mt-12 text-sm text-muted-foreground">
                    <p className="mb-2">While offline, you can still:</p>
                    <ul className="space-y-1">
                        <li>• View previously loaded content</li>
                        <li>• Navigate between cached pages</li>
                        <li>• Draft messages (they'll send when you're back online)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
