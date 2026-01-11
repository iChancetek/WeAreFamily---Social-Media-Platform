'use server'

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { getUserProfile } from "@/lib/auth";
import { logAuditEvent } from "@/app/actions/audit";

export async function approveUser(userId: string) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

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
        // If changing real name but not explicit display name, ensure display name is updated to match new real name
        // (Enforcing strictly First + Last)
        const f = data.firstName || currentUserData?.profileData?.firstName || "";
        const l = data.lastName || currentUserData?.profileData?.lastName || "";
        updates.displayName = `${f} ${l}`.trim();
    }

    if (data.email && data.email !== currentUserData?.email) {
        // Changing email requires updating Auth user too - complex, might need Admin SDK auth.updateUser
        // For now, let's stick to Firestore updates and warn/handle Auth separately if needed.
        // Actually, let's try to update Auth if possible.
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

    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) throw new Error("User not found");
    const userData = userDoc.data();

    // Soft delete: set deletedAt and disable account
    await adminDb.collection("users").doc(userId).update({
        deletedAt: new Date().toISOString(),
        isActive: false // Automatically disable on delete
    });

    // Also disable in Auth to prevent login immediately
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

    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) throw new Error("User not found");
    const userData = userDoc.data();

    // Restore: clear deletedAt and re-enable account
    await adminDb.collection("users").doc(userId).update({
        deletedAt: null, // removing field or setting to null
        isActive: true
    });

    // Re-enable in Auth
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
