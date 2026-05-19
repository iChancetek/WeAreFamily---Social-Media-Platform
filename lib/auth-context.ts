'use client';

/**
 * Client-side auth context collector.
 * Gathers device, browser, locale, and screen information
 * that can only be obtained from the browser environment.
 */

export interface ClientAuthContext {
    timezone: string;
    locale: string;
    userAgent: string;
    platform: string;
    language: string;
    languages: string[];
    screen: {
        width: number;
        height: number;
        colorDepth: number;
    };
    deviceType: 'mobile' | 'tablet' | 'desktop';
    browser: string;
    os: string;
    referrer: string;
    connectionType?: string;
}

/** Detect device type from user agent */
function detectDeviceType(ua: string): 'mobile' | 'tablet' | 'desktop' {
    const uaLower = ua.toLowerCase();
    if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(uaLower)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(uaLower)) return 'mobile';
    return 'desktop';
}

/** Detect browser name */
function detectBrowser(ua: string): string {
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('SamsungBrowser')) return 'Samsung Internet';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Trident')) return 'IE';
    return 'Unknown';
}

/** Detect OS */
function detectOS(ua: string): string {
    if (ua.includes('Windows NT 10') || ua.includes('Windows NT 11')) return 'Windows';
    if (ua.includes('Mac OS X')) return 'macOS';
    if (ua.includes('CrOS')) return 'Chrome OS';
    if (ua.includes('Linux')) {
        if (ua.includes('Android')) return 'Android';
        return 'Linux';
    }
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    if (ua.includes('Android')) return 'Android';
    return 'Unknown';
}

/**
 * Collect client-side auth context.
 * Safe to call in any browser environment — handles missing APIs gracefully.
 */
export function collectClientContext(): ClientAuthContext {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const win = typeof window !== 'undefined' ? window : null;

    let connectionType: string | undefined;
    try {
        connectionType = (nav as any)?.connection?.effectiveType || undefined;
    } catch { /* ignore */ }

    return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
        locale: nav?.language || 'en-US',
        userAgent: ua,
        platform: nav?.platform || 'Unknown',
        language: nav?.language || 'en',
        languages: nav?.languages ? [...nav.languages] : ['en'],
        screen: {
            width: win?.screen?.width || 0,
            height: win?.screen?.height || 0,
            colorDepth: win?.screen?.colorDepth || 0,
        },
        deviceType: detectDeviceType(ua),
        browser: detectBrowser(ua),
        os: detectOS(ua),
        referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
        connectionType,
    };
}

/**
 * Generate a stable device fingerprint from client context.
 * Not for tracking — used for recognizing known devices.
 */
export function generateDeviceFingerprint(ctx: ClientAuthContext): string {
    const raw = `${ctx.browser}|${ctx.os}|${ctx.screen.width}x${ctx.screen.height}|${ctx.platform}|${ctx.timezone}`;
    // Simple hash for deduplication
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return `dev_${Math.abs(hash).toString(36)}`;
}
