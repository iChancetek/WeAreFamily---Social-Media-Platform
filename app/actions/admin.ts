'use server'

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { getUserProfile } from "@/lib/auth";

export async function approveUser(userId: string) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    await adminDb.collection("users").doc(userId).update({ role: 'member' });

    revalidatePath('/admin')
}

export async function rejectUser(userId: string) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    await adminDb.collection("users").doc(userId).update({ role: 'pending' });

    revalidatePath('/admin')
}

export async function makeAdmin(userId: string) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    await adminDb.collection("users").doc(userId).update({ role: 'admin' });

    revalidatePath('/admin')
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    await adminDb.collection("users").doc(userId).update({ isActive });

    revalidatePath('/admin')
}
