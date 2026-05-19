import 'server-only';

/**
 * Server-side IP geolocation lookup.
 * Uses ipapi.co (free tier: 1000 req/day) as primary provider.
 * Falls back to ipinfo.io if available.
 * 
 * Privacy: Only stores approximate geolocation (city-level).
 */

export interface GeoLookupResult {
    ip: string;
    country: string;
    countryCode: string;
    state: string;
    stateCode: string;
    city: string;
    timezone: string;
    latitude?: number;
    longitude?: number;
    isp: string;
    asn: string;
    org: string;
    isVpn: boolean;
    isProxy: boolean;
    isTor: boolean;
    threatLevel: 'low' | 'medium' | 'high';
}

const DEFAULT_RESULT: GeoLookupResult = {
    ip: 'unknown',
    country: 'Unknown',
    countryCode: '',
    state: 'Unknown',
    stateCode: '',
    city: 'Unknown',
    timezone: 'Unknown',
    isp: 'Unknown',
    asn: '',
    org: '',
    isVpn: false,
    isProxy: false,
    isTor: false,
    threatLevel: 'low',
};

// Simple in-memory cache to avoid excessive API calls (per server instance)
const geoCache = new Map<string, { result: GeoLookupResult; expires: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Look up geolocation data for an IP address.
 */
export async function lookupIP(ip: string): Promise<GeoLookupResult> {
    if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') {
        return { ...DEFAULT_RESULT, ip: ip || 'localhost' };
    }

    // Clean IP (handle comma-separated forwarded IPs)
    const cleanIp = ip.split(',')[0].trim();

    // Check cache
    const cached = geoCache.get(cleanIp);
    if (cached && cached.expires > Date.now()) {
        return cached.result;
    }

    try {
        const result = await lookupViaIpApi(cleanIp);
        // Cache the result
        geoCache.set(cleanIp, { result, expires: Date.now() + CACHE_TTL });
        return result;
    } catch (error) {
        console.error('[GeoLookup] Primary lookup failed:', error);
        try {
            const result = await lookupViaIpInfo(cleanIp);
            geoCache.set(cleanIp, { result, expires: Date.now() + CACHE_TTL });
            return result;
        } catch (fallbackError) {
            console.error('[GeoLookup] Fallback lookup failed:', fallbackError);
            return { ...DEFAULT_RESULT, ip: cleanIp };
        }
    }
}

/** Primary: ipapi.co — free 1000 req/day */
async function lookupViaIpApi(ip: string): Promise<GeoLookupResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Famio/1.0' },
        });
        clearTimeout(timeout);

        if (!response.ok) throw new Error(`ipapi.co returned ${response.status}`);

        const data = await response.json();

        if (data.error) throw new Error(data.reason || 'ipapi.co error');

        return {
            ip,
            country: data.country_name || 'Unknown',
            countryCode: data.country_code || '',
            state: data.region || 'Unknown',
            stateCode: data.region_code || '',
            city: data.city || 'Unknown',
            timezone: data.timezone || 'Unknown',
            latitude: data.latitude,
            longitude: data.longitude,
            isp: data.org || 'Unknown',
            asn: data.asn || '',
            org: data.org || '',
            isVpn: false, // ipapi.co free tier doesn't include this
            isProxy: false,
            isTor: false,
            threatLevel: 'low',
        };
    } finally {
        clearTimeout(timeout);
    }
}

/** Fallback: ipinfo.io — free 50K req/month */
async function lookupViaIpInfo(ip: string): Promise<GeoLookupResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(`https://ipinfo.io/${ip}/json`, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Famio/1.0' },
        });
        clearTimeout(timeout);

        if (!response.ok) throw new Error(`ipinfo.io returned ${response.status}`);

        const data = await response.json();

        const [lat, lng] = (data.loc || '0,0').split(',').map(Number);

        return {
            ip,
            country: data.country || 'Unknown',
            countryCode: data.country || '',
            state: data.region || 'Unknown',
            stateCode: '',
            city: data.city || 'Unknown',
            timezone: data.timezone || 'Unknown',
            latitude: lat,
            longitude: lng,
            isp: data.org || 'Unknown',
            asn: '',
            org: data.org || '',
            isVpn: false,
            isProxy: false,
            isTor: false,
            threatLevel: 'low',
        };
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Extract client IP from request headers.
 * Works with Vercel, Cloudflare, Firebase App Hosting, and generic proxies.
 */
export function extractIP(headers: Headers): string {
    return (
        headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headers.get('x-real-ip') ||
        headers.get('cf-connecting-ip') ||
        headers.get('x-client-ip') ||
        'unknown'
    );
}
