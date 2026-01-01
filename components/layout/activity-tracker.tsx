"use client";

import { useEffect } from "react";
import { updateLastActive } from "@/app/actions/users";
import { usePathname } from "next/navigation";

export function ActivityTracker() {
    const pathname = usePathname();

    useEffect(() => {
        // Debounce or just fire on route change?
        // Fires on mount and route change.
        updateLastActive().catch(console.error);
    }, [pathname]);

    return null;
}
