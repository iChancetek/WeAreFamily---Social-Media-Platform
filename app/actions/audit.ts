"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getUserProfile } from "@/lib/auth";
import { resolveDisplayName } from "@/lib/user-utils";

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
    | "group.update_cover"
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
    | "admin.broadcast"
    | "settings.update"
    | "security.invisible_mode"
    | "event.join"
    | "event.leave"
    | "group.post_create"
    | "reaction.add"
    | "reaction.remove"
    | "admin.update_profile"
    | "admin.update_role"
    | "admin.soft_delete_user"
    | "admin.restore_user";

export interface AuditLogEntry {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    action: AuditAction;
    targetType?: string; // e.g., "post", "user", "group"
    targetId?: string;
    targetName?: string;
    details?: Record<string, unknown>;
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
        details?: Record<string, unknown>;
    }
) {
    try {
        const user = await getUserProfile();
        if (!user) {
            console.warn("[logAuditEvent] Skipped: No user context");
            return;
        }

        /**
         * Log an audit event for admin monitoring
         */
        const auditEntry: Omit<AuditLogEntry, "timestamp"> = {
            userId: user.id,
            userName: resolveDisplayName(user),
            userEmail: user.email || "Unknown",
            userRole: user.role || "member",
            action,
            targetType: options?.targetType,
            targetId: options?.targetId,
            targetName: options?.targetName,
            details: options?.details,
        };

        // Remove undefined values which Firestore doesn't support
        const cleanEntry = JSON.parse(JSON.stringify(auditEntry));

        const docRef = await adminDb.collection("auditLogs").add({
            ...cleanEntry,
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

    let query: Query = adminDb.collection("auditLogs").orderBy("timestamp", "desc");

    if (options?.userId) {
        query = query.where("userId", "==", options.userId);
    }

    if (options?.action) {
        query = query.where("action", "==", options.action);
    }

    if (options?.startDate) {
        query = query.where("timestamp", ">=", options.startDate);
    }

    if (options?.endDate) {
        query = query.where("timestamp", "<=", options.endDate);
    }

    const limit = options?.limit || 100;
    query = query.limit(limit);

    let snapshot;
    try {
        snapshot = await query.get();
    } catch (error) {
        console.warn("[getAuditLogs] Index likely missing, falling back to unordered query:", error);
        // Fallback: Query all logs (or limited) and filter in memory
        // This is safe for admin dashboards where we can client-side paginate or just show recent 100
        snapshot = await adminDb.collection("auditLogs")
            .limit(limit)
            .get();
    }

    if (!snapshot || snapshot.empty) return [];

    console.log(`[getAuditLogs] Found ${snapshot.size} logs`);

    // Import sanitizeData to ensure clean serialization for Client Components
    const { sanitizeData } = await import("@/lib/serialization");

    const logs = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        const entry: AuditLogEntry = {
            ...(data as Omit<AuditLogEntry, 'timestamp'>),
            id: doc.id,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now()),
        } as AuditLogEntry;
        return entry;
    });

    // Sort in memory to cover the fallback case
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply strict filtering in memory for the fallback results (to mimic the failed query)
    const filteredLogs = logs.filter((log) => {
        if (options?.userId && log.userId !== options.userId) return false;
        if (options?.action && log.action !== options.action) return false;
        if (options?.startDate && log.timestamp < options.startDate) return false;
        if (options?.endDate && log.timestamp > options.endDate) return false;
        return true;
    });

    return sanitizeData(filteredLogs);
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

export async function generateTestLog() {
    await logAuditEvent("settings.update", {
        targetType: "system",
        targetId: "test",
        targetName: "Test Log Entry",
        details: { message: "This is a test audit log to verify the system." }
    });
    return { success: true };
}
