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
            "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white",
            className
        )}>
            {count > 9 ? "9+" : count}
        </span>
    );
}
