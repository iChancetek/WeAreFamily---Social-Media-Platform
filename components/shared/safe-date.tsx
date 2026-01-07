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

    if (!mounted) return null; // Render nothing on server to avoid mismatch

    return <span suppressHydrationWarning>{text}</span>;
}
