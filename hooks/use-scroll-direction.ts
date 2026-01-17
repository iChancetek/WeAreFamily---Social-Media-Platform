"use client";

import { useEffect, useState } from "react";

export function useScrollDirection() {
    const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);

    useEffect(() => {
        let lastScrollY = window.pageYOffset;

        const updateScrollDirection = () => {
            const scrollY = window.pageYOffset;
            const direction = scrollY > lastScrollY ? "down" : "up";
            if (direction !== scrollDirection && (scrollY - lastScrollY > 10 || scrollY - lastScrollY < -10)) {
                setScrollDirection(direction);
            }
            lastScrollY = scrollY > 0 ? scrollY : 0;
        };

        // Throttle slightly
        let ticking = false;
        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateScrollDirection();
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, [scrollDirection]);

    return scrollDirection;
}
