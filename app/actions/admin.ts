'use server'

import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getUserProfile } from "@/lib/auth"

export async function approveUser(userId: string) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    await db.update(users)
        .set({ role: 'member' })
        .where(eq(users.id, userId))

    revalidatePath('/admin')
}

export async function rejectUser(userId: string) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    // For now, rejection just keeps them pending or we could delete. 
    // Let's sets to pending (no-op) or maybe 'banned'? 
    // For safety, let's just ensure they are pending. 
    // Or if we want to delete: await db.delete(users).where(eq(users.id, userId))
    // Setting back to pending seems safest for "Reject"ing an approval request.

    await db.update(users)
        .set({ role: 'pending' })
        .where(eq(users.id, userId))

    revalidatePath('/admin')
}

export async function makeAdmin(userId: string) {
    const admin = await getUserProfile()
    if (admin?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    await db.update(users)
        .set({ role: 'admin' })
        .where(eq(users.id, userId))

    revalidatePath('/admin')
}
