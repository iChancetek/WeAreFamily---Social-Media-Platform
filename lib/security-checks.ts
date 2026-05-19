import 'server-only';

/**
 * Security checks for authentication and account creation.
 * Detects disposable emails, risk signals, and anomalies.
 */

// Known disposable email domains (partial list — add more as needed)
const DISPOSABLE_DOMAINS = new Set([
    'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
    'yopmail.com', '10minutemail.com', 'trashmail.com', 'sharklasers.com',
    'guerrillamail.info', 'grr.la', 'guerrillamail.net', 'guerrillamail.org',
    'guerrillamail.biz', 'guerrillamail.de', 'temp-mail.org', 'fakeinbox.com',
    'dispostable.com', 'mailnesia.com', 'mailcatch.com', 'getnada.com',
    'tempinbox.com', 'jetable.org', 'maildrop.cc', 'discard.email',
    'mytemp.email', 'mohmal.com', 'tempail.com', 'burnermail.io',
    'harakirimail.com', 'emaillok.com',
]);

/**
 * Check if an email uses a disposable/temporary domain.
 */
export function isDisposableEmail(email: string): boolean {
    if (!email) return false;
    const domain = email.toLowerCase().split('@')[1];
    if (!domain) return false;
    return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Detect impossible travel — if two logins are too far apart geographically
 * in too short a time window.
 * 
 * @param prevLat - Previous login latitude
 * @param prevLng - Previous login longitude
 * @param newLat - New login latitude
 * @param newLng - New login longitude
 * @param timeDiffMs - Time between logins in milliseconds
 * @returns true if the travel is suspicious
 */
export function detectImpossibleTravel(
    prevLat: number, prevLng: number,
    newLat: number, newLng: number,
    timeDiffMs: number
): boolean {
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (newLat - prevLat) * Math.PI / 180;
    const dLng = (newLng - prevLng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(prevLat * Math.PI / 180) * Math.cos(newLat * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Max reasonable travel speed: 900 km/h (fast commercial jet)
    const hoursElapsed = timeDiffMs / (1000 * 60 * 60);
    const maxDistance = 900 * hoursElapsed;

    return distanceKm > maxDistance && distanceKm > 200; // Only flag if >200km apart
}

/**
 * Calculate a basic risk score (0.0 = safe, 1.0 = highest risk).
 */
export function calculateRiskScore(signals: {
    isDisposableEmail?: boolean;
    isVpn?: boolean;
    isProxy?: boolean;
    isTor?: boolean;
    isNewDevice?: boolean;
    isNewCountry?: boolean;
    impossibleTravel?: boolean;
    rapidAccountCreation?: boolean;
}): number {
    let score = 0;

    if (signals.isTor) score += 0.35;
    if (signals.isVpn) score += 0.10;
    if (signals.isProxy) score += 0.15;
    if (signals.isDisposableEmail) score += 0.25;
    if (signals.impossibleTravel) score += 0.30;
    if (signals.isNewDevice) score += 0.05;
    if (signals.isNewCountry) score += 0.10;
    if (signals.rapidAccountCreation) score += 0.20;

    return Math.min(1.0, Math.round(score * 100) / 100);
}

/**
 * Detect if an IP suggests VPN/proxy usage based on known datacenter ASN patterns.
 * This is a lightweight heuristic — for production, use a paid API like MaxMind or ipinfo privacy API.
 */
export function detectVpnHeuristic(org: string, asn: string): { isVpn: boolean; isProxy: boolean } {
    const orgLower = (org || '').toLowerCase();
    const vpnKeywords = ['vpn', 'proxy', 'tunnel', 'hosting', 'cloud', 'datacenter',
        'digital ocean', 'amazon', 'aws', 'google cloud', 'azure', 'linode',
        'vultr', 'ovh', 'hetzner', 'choopa'];

    const isVpn = vpnKeywords.some(kw => orgLower.includes(kw));
    return { isVpn, isProxy: isVpn };
}
