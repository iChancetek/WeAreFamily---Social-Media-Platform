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
    const userData = userDoc.data();

    await adminDb.collection("users").doc(userId).update({ role: 'member' });

    await logAuditEvent("admin.approve_user", {
        targetType: "user",
        targetId: userId,
        targetName: userData?.displayName || userData?.email || "Unknown",
    });

    revalidatePath('/admin')
}

export async function rejectUser(userId: string) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.data();

    await adminDb.collection("users").doc(userId).update({ role: 'rejected' });

    await logAuditEvent("admin.reject_user", {
        targetType: "user",
        targetId: userId,
        targetName: userData?.displayName || userData?.email || "Unknown",
    });

    revalidatePath('/admin')
}

export async function makeAdmin(userId: string) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.data();

    await adminDb.collection("users").doc(userId).update({ role: 'admin' });

    await logAuditEvent("admin.promote_user", {
        targetType: "user",
        targetId: userId,
        targetName: userData?.displayName || userData?.email || "Unknown",
    });

    revalidatePath('/admin')
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.data();

    await adminDb.collection("users").doc(userId).update({ isActive });

    await logAuditEvent(isActive ? "admin.enable_user" : "admin.disable_user", {
        targetType: "user",
        targetId: userId,
        targetName: userData?.displayName || userData?.email || "Unknown",
    });

    revalidatePath('/admin')
}
