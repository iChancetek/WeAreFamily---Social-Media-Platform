'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface SafeDateProps {
    date: Date | string | number | any;
    fallback?: string;
}

export function SafeDate({ date, fallback = "Just now" }: SafeDateProps) {
    const [mounted, setMounted] = useState(false);
    const [text, setText] = useState<string>("");

    useEffect(() => {
        setMounted(true);
        try {
            if (!date) {
                setText(fallback);
                return;
            }
            const d = new Date(date);
            // Check for invalid date
            if (isNaN(d.getTime())) {
                setText(fallback);
                return;
            }
            setText(formatDistanceToNow(d, { addSuffix: true }));
        } catch (e) {
            setText(fallback);
        }
    }, [date, fallback]);

    // Always render the span to ensure the DOM tree structure matches between server and client.
    // hydration warning prevented by suppressHydrationWarning
    return (
        <span suppressHydrationWarning>
            {mounted ? text : fallback}
        </span>
    );
}
