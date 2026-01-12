'use client'

import { useEffect, useState } from "react";
import { getUnreadCount } from "@/app/actions/notifications";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationBadge({ className }: { className?: string }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        // Initial load
        getUnreadCount().then(setCount);

        // Simple poll every 30s to keep it somewhat fresh without socket overhead
        const interval = setInterval(() => {
            getUnreadCount().then(setCount);
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    if (count === 0) return null;

    return (
        <span className={cn(
            "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-black animate-in zoom-in duration-300",
            className
        )}>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative">{count > 9 ? "9+" : count}</span>
        </span>
    );
}
