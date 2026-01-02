"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getUserProfile } from "@/lib/auth";

export type AuditAction =
    | "user.login"
    | "user.logout"
    | "user.create"
    | "user.update"
    | "user.delete"
    | "post.create"
    | "post.update"
    | "post.delete"
    | "comment.create"
    | "comment.delete"
    | "comment.update"
    | "story.create"
    | "story.delete"
    | "event.create"
    | "event.update"
    | "event.delete"
    | "group.create"
    | "group.join"
    | "group.leave"
    | "group.update"
    | "group.delete"
    | "branding.create"
    | "branding.follow"
    | "branding.unfollow"
    | "branding.update"
    | "branding.delete"
    | "family.request_sent"
    | "family.request_accepted"
    | "family.request_rejected"
    | "family.request_cancelled"
    | "message.sent"
    | "user.block"
    | "user.unblock"
    | "admin.approve_user"
    | "admin.reject_user"
    | "admin.promote_user"
    | "admin.disable_user"
    | "admin.enable_user"
    | "settings.update"
    | "security.invisible_mode"
    | "event.join"
    | "event.leave"
    | "group.post_create"
    | "reaction.add"
    | "reaction.remove";

export interface AuditLogEntry {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    action: AuditAction;
    targetType?: string; // e.g., "post", "user", "group"
    targetId?: string;
    targetName?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

/**
 * Log an audit event for admin monitoring
 */
export async function logAuditEvent(
    action: AuditAction,
    options?: {
        targetType?: string;
        targetId?: string;
        targetName?: string;
        details?: Record<string, any>;
    }
) {
    try {
        const user = await getUserProfile();
        if (!user) {
            console.warn("[logAuditEvent] Skipped: No user context");
            return;
        }

        const auditEntry: Omit<AuditLogEntry, "timestamp"> = {
            userId: user.id,
            userName: user.displayName || "Unknown",
            userEmail: user.email || "Unknown",
            userRole: user.role || "member",
            action,
            targetType: options?.targetType,
            targetId: options?.targetId,
            targetName: options?.targetName,
            details: options?.details,
        };

        const docRef = await adminDb.collection("auditLogs").add({
            ...auditEntry,
            timestamp: FieldValue.serverTimestamp(),
        });

        console.log(`[logAuditEvent] Success: ${action} (${docRef.id})`);

    } catch (error) {
        // Don't throw - audit logging shouldn't break the app
        console.error("[logAuditEvent] FAILED:", error);
    }
}

/**
 * Get audit logs (admin only)
 */
export async function getAuditLogs(options?: {
    userId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}) {
    const user = await getUserProfile();
    if (!user || user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
    }

    let query = adminDb.collection("auditLogs").orderBy("timestamp", "desc");

    if (options?.userId) {
        query = query.where("userId", "==", options.userId) as any;
    }

    if (options?.action) {
        query = query.where("action", "==", options.action) as any;
    }

    if (options?.startDate) {
        query = query.where("timestamp", ">=", options.startDate) as any;
    }

    if (options?.endDate) {
        query = query.where("timestamp", "<=", options.endDate) as any;
    }

    const limit = options?.limit || 100;
    query = query.limit(limit) as any;

    const snapshot = await query.get();

    console.log(`[getAuditLogs] Found ${snapshot.size} logs`);

    // Import sanitizeData to ensure clean serialization for Client Components
    const { sanitizeData } = await import("@/lib/serialization");

    const logs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now()),
        };
    });

    return sanitizeData(logs);
}

/**
 * Get audit log summary stats (admin only)
 */
export async function getAuditStats() {
    const user = await getUserProfile();
    if (!user || user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [last24h, last7days, total] = await Promise.all([
        adminDb.collection("auditLogs").where("timestamp", ">=", oneDayAgo).get(),
        adminDb.collection("auditLogs").where("timestamp", ">=", oneWeekAgo).get(),
        adminDb.collection("auditLogs").count().get(),
    ]);

    return {
        last24h: last24h.size,
        last7days: last7days.size,
        total: total.data().count,
    };
}
