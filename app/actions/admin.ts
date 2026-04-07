'use server'

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { getUserProfile } from "@/lib/auth";
import { logAuditEvent } from "@/app/actions/audit";
import { sanitizeData } from "@/lib/serialization";

export async function approveUser(userId: string) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    if (!adminDb) throw new Error("Database Unavailable");

    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) throw new Error("User not found");
    const userData = userDoc.data();

    await adminDb.collection("users").doc(userId).update({ role: 'member' });

    const rawName = userData?.displayName;
    const targetName = (rawName && rawName !== "Family Member") ? rawName : (userData?.email || "Unknown");

    await logAuditEvent("admin.approve_user", {
        targetType: "user",
        targetId: userId,
        targetName,
    });

    revalidatePath('/admin')
}

export async function rejectUser(userId: string) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }
    if (!adminDb) throw new Error("Database Unavailable");

    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) throw new Error("User not found");
    const userData = userDoc.data();

    await adminDb.collection("users").doc(userId).update({ role: 'rejected' });

    const rawName = userData?.displayName;
    const targetName = (rawName && rawName !== "Family Member") ? rawName : (userData?.email || "Unknown");

    await logAuditEvent("admin.reject_user", {
        targetType: "user",
        targetId: userId,
        targetName,
    });

    revalidatePath('/admin')
}

export async function makeAdmin(userId: string) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }
    if (!adminDb) throw new Error("Database Unavailable");

    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) throw new Error("User not found");
    const userData = userDoc.data();

    await adminDb.collection("users").doc(userId).update({ role: 'admin' });

    const rawName = userData?.displayName;
    const targetName = (rawName && rawName !== "Family Member") ? rawName : (userData?.email || "Unknown");

    await logAuditEvent("admin.promote_user", {
        targetType: "user",
        targetId: userId,
        targetName,
    });

    revalidatePath('/admin')
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }
    if (!adminDb) throw new Error("Database Unavailable");

    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) throw new Error("User not found");
    const userData = userDoc.data();

    await adminDb.collection("users").doc(userId).update({ isActive });

    const rawName = userData?.displayName;
    const targetName = (rawName && rawName !== "Family Member") ? rawName : (userData?.email || "Unknown");

    await logAuditEvent(isActive ? "admin.enable_user" : "admin.disable_user", {
        targetType: "user",
        targetId: userId,
        targetName,
    });

    revalidatePath('/admin')
}

export async function updateUserProfile(userId: string, data: { firstName?: string; lastName?: string; displayName?: string; email?: string }) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }
    if (!adminDb) throw new Error("Database Unavailable");

    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) throw new Error("User not found");
    const currentUserData = userDoc.data();

    // Prepare update data - update both root fields and profileData map if needed
    const updates: any = {};
    const profileUpdates: any = {};

    if (data.firstName) profileUpdates.firstName = data.firstName;
    if (data.lastName) profileUpdates.lastName = data.lastName;

    // Update root display name if provided, or derive from new first/last
    if (data.displayName) {
        updates.displayName = data.displayName;
    } else if (data.firstName || data.lastName) {
        const f = data.firstName || currentUserData?.profileData?.firstName || "";
        const l = data.lastName || currentUserData?.profileData?.lastName || "";
        updates.displayName = `${f} ${l}`.trim();
    }

    if (data.email && data.email !== currentUserData?.email) {
        try {
            const { getAuth } = await import('firebase-admin/auth');
            await getAuth().updateUser(userId, { email: data.email });
            updates.email = data.email;
        } catch (error) {
            console.error("Failed to update Auth email:", error);
            throw new Error("Failed to update email address in Auth system.");
        }
    }

    if (Object.keys(profileUpdates).length > 0) {
        updates.profileData = { ...currentUserData?.profileData, ...profileUpdates };
    }

    if (Object.keys(updates).length > 0) {
        await adminDb.collection("users").doc(userId).update(updates);
    }

    await logAuditEvent("admin.update_profile", {
        targetType: "user",
        targetId: userId,
        targetName: updates.displayName || currentUserData?.displayName || "Unknown",
        details: { changes: Object.keys(updates) }
    });

    revalidatePath('/admin');
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'member') {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    if (userId === admin.uid) {
        throw new Error("Cannot change your own role");
    }
    if (!adminDb) throw new Error("Database Unavailable");

    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) throw new Error("User not found");
    const userData = userDoc.data();

    await adminDb.collection("users").doc(userId).update({ role: newRole });

    const rawName = userData?.displayName;
    const targetName = (rawName && rawName !== "Family Member") ? rawName : (userData?.email || "Unknown");

    await logAuditEvent("admin.update_role", {
        targetType: "user",
        targetId: userId,
        targetName,
        details: { oldRole: userData?.role, newRole }
    });

    revalidatePath('/admin');
}

export async function softDeleteUser(userId: string) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    if (userId === admin.uid) {
        throw new Error("Cannot delete yourself");
    }
    if (!adminDb) throw new Error("Database Unavailable");

    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) throw new Error("User not found");
    const userData = userDoc.data();

    // Soft delete
    await adminDb.collection("users").doc(userId).update({
        deletedAt: new Date().toISOString(),
        isActive: false
    });

    try {
        const { getAuth } = await import('firebase-admin/auth');
        await getAuth().updateUser(userId, { disabled: true });
    } catch (e) {
        console.error("Failed to disable Auth user:", e);
    }

    const rawName = userData?.displayName;
    const targetName = (rawName && rawName !== "Family Member") ? rawName : (userData?.email || "Unknown");

    await logAuditEvent("admin.soft_delete_user", {
        targetType: "user",
        targetId: userId,
        targetName,
    });

    revalidatePath('/admin');
}

export async function restoreUser(userId: string) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }
    if (!adminDb) throw new Error("Database Unavailable");

    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) throw new Error("User not found");
    const userData = userDoc.data();

    await adminDb.collection("users").doc(userId).update({
        deletedAt: null,
        isActive: true
    });

    try {
        const { getAuth } = await import('firebase-admin/auth');
        await getAuth().updateUser(userId, { disabled: false });
    } catch (e) {
        console.error("Failed to enable Auth user:", e);
    }

    const rawName = userData?.displayName;
    const targetName = (rawName && rawName !== "Family Member") ? rawName : (userData?.email || "Unknown");

    await logAuditEvent("admin.restore_user", {
        targetType: "user",
        targetId: userId,
        targetName,
    });

    revalidatePath('/admin');
}

export async function getAllUsers() {
    try {
        const adminUser = await getUserProfile();
        if (!adminUser || adminUser.role !== 'admin') {
            const error = new Error("Unauthorized");
            (error as any).digest = "UNAUTHORIZED_ADMIN_ACCESS"; // Hint to client
            throw error;
        }

        // Verify adminDb is ready (basic check)
        if (!adminDb) {
            console.error("getAllUsers: adminDb is undefined");
            throw new Error("Database connection not initialized. Please check server logs.");
        }

        const snapshot = await adminDb.collection("users").get();

        const users = snapshot.docs.map((doc: any) => {
            const data = doc.data();
            const sanitized = sanitizeData(data);
            return {
                id: doc.id,
                ...sanitized,
                createdAt: sanitized.createdAt instanceof Date ? sanitized.createdAt : new Date(sanitized.createdAt || 0),
                lastSignInAt: sanitized.lastSignInAt instanceof Date ? sanitized.lastSignInAt : (sanitized.lastSignInAt ? new Date(sanitized.lastSignInAt) : null),
                lastActiveAt: sanitized.lastActiveAt instanceof Date ? sanitized.lastActiveAt : (sanitized.lastActiveAt ? new Date(sanitized.lastActiveAt) : null),
            };
        });

        // Sort by createdAt desc
        return users.sort((a: any, b: any) => b.createdAt - a.createdAt);
    } catch (error: any) {
        console.error("Critical Error in getAllUsers:", error);
        // Throw a simple error that won't be masked by Next.js as "Server Components render"
        // We prefix it so we know it's ours.
        throw new Error(`[AdminFetchError] ${error.message}`);
    }
}

export async function getRepostAnalytics() {
    try {
        const adminUser = await getUserProfile();
        if (!adminUser || adminUser.role !== 'admin') {
            throw new Error("Unauthorized");
        }

        const snapshot = await adminDb.collection("posts")
            .where("repostCount", ">", 0)
            .orderBy("repostCount", "desc")
            .limit(50) // Top 50 for analytics
            .get();

        const posts = snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title || data.content?.substring(0, 30) || "Untitled Post",
                repostCount: data.repostCount || 0,
                rankScore: data.rankScore || 0,
            };
        });

        let high = 0;
        let medium = 0;
        let low = 0;

        const maxReposts = posts.length > 0 ? posts[0].repostCount : 1;

        posts.forEach((p: any) => {
            if (p.repostCount >= maxReposts * 0.8) high++;
            else if (p.repostCount >= maxReposts * 0.4) medium++;
            else low++;
        });

        // Add users who have repost count 0 as low engagement
        const allSnapshot = await adminDb.collection("posts").count().get();
        const totalPosts = allSnapshot.data().count;
        const zeroRepostPosts = totalPosts - snapshot.size;
        low += zeroRepostPosts;

        return {
            topPosts: posts.slice(0, 10), // Return top 10 for bar chart
            allTop: posts, // Top 50 for table
            distribution: [
                { name: 'High Engagement', value: high },
                { name: 'Medium Engagement', value: medium },
                { name: 'Low Engagement', value: low }
            ]
        };

    } catch (e: any) {
        console.error("Error fetching repost analytics:", e);
        throw new Error("Failed to fetch analytics");
    }
}

export async function getAdminReports() {
    const admin = await getUserProfile();
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized");
    }

    if (!adminDb) return [];

    const reportsSnapshot = await adminDb.collection("reports")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

    if (reportsSnapshot.empty) return [];

    const reports = reportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));

    // Fetch reporter details
    const reporterIds = [...new Set(reports.map(r => r.reporterId).filter(Boolean))];
    const usersMap: Record<string, any> = {};

    if (reporterIds.length > 0) {
        // Firestore 'in' queries are limited to 10 at a time, but for admin scale we can do simple singular batches or fetch all users and map in memory if small enough.
        // Let's do a simple loop for safety given it's an admin dashboard
        for (const rId of reporterIds) {
            const userDoc = await adminDb.collection('users').doc(rId as string).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                usersMap[rId as string] = {
                    displayName: data?.displayName || "Unknown",
                    email: data?.email || "Unknown"
                };
            }
        }
    }

    const populatedReports = reports.map(report => ({
        ...report,
        reporter: usersMap[report.reporterId as string] || { displayName: "Unknown", email: "Unknown" }
    }));

    return sanitizeData(populatedReports);
}
