'use client';

import { useState, useEffect } from 'react';

/**
 * Detect if current device is mobile based on screen width
 * Uses Tailwind's 'md' breakpoint (768px)
 */
export function isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
}

/**
 * React hook to detect mobile device with responsive updates
 * Returns true for screens < 768px (mobile/small tablets)
 */
export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Initial check
        const checkMobile = () => setIsMobile(isMobileDevice());
        checkMobile();

        // Listen for resize events
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
}

/**
 * Get device type classification
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function getDeviceType(): DeviceType {
    if (typeof window === 'undefined') return 'desktop';

    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
}

/**
 * React hook to get device type with responsive updates
 */
export function useDeviceType(): DeviceType {
    const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

    useEffect(() => {
        const checkDevice = () => setDeviceType(getDeviceType());
        checkDevice();

        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    return deviceType;
}
