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
