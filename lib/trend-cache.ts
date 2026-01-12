// In-memory trend cache with TTL
type CachedTrend = {
    data: any;
    timestamp: number;
    ttl: number; // milliseconds
};

const trendCache = new Map<string, CachedTrend>();

export function getCachedTrends(key: string): any | null {
    const cached = trendCache.get(key);

    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
        // Expired
        trendCache.delete(key);
        return null;
    }

    return cached.data;
}

export function setCachedTrends(key: string, data: any, ttlMinutes: number = 30) {
    trendCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000
    });
}

export function clearTrendCache(key?: string) {
    if (key) {
        trendCache.delete(key);
    } else {
        trendCache.clear();
    }
}
