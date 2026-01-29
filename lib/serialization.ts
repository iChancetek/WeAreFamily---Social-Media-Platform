export function sanitizeData(data: any): any {
    if (data === null || data === undefined) return data;

    // Handle Dates (already sanitized or native)
    if (data instanceof Date) {
        return data; // Keep Dates as objects for Server Logic (Admin/Firestore compatibility)
    }

    // Handle Firestore Timestamp
    if (typeof data === 'object' && typeof data.toDate === 'function') {
        return data.toDate();
    }

    // Handle array
    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }

    // Handle Object (plain objects)
    if (typeof data === 'object') {
        try {
            const sanitized: any = {};
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    sanitized[key] = sanitizeData(data[key]);
                }
            }
            return sanitized;
        } catch (e) {
            console.error("Sanitize failed for object:", data);
            return null;
        }
    }

    return data;
}

/**
 * Ensures data is safe for Client Components (no Date objects).
 * Uses JSON cycle to convert Dates to ISO strings automatically.
 */
export function sanitizeForClient(data: any): any {
    return JSON.parse(JSON.stringify(sanitizeData(data)));
}
