export function sanitizeData(data: any): any {
    if (data === null || data === undefined) return data;

    // Handle Dates (already sanitized or native)
    if (data instanceof Date) {
        return data; // Dates are serializable in Next.js
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
    // We check if it's a plain object or at least not something we should let through
    if (typeof data === 'object') {
        // If it's a Firestore-like object that isn't a plain object (e.g. GeoPoint, DocumentReference)
        // we might want to convert them to strings or plain objects if needed.
        // For now, let's just make sure we don't crash on recursion.

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
