"use server"

import { cookies } from "next/headers"

export async function createSession(uid: string) {
    // In Next.js 15/16, cookies() is async
    const cookieStore = await cookies()
    cookieStore.set("session_uid", uid, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
    })
}


export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete("session_uid")
}

import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function syncUserToDb(uid: string, email: string, displayName: string) {
    const existingUser = await db.query.users.findFirst({
        where: eq(users.id, uid)
    })

    if (!existingUser) {
        await db.insert(users).values({
            id: uid,
            email: email,
            displayName: displayName,
            // firstName/lastName/updatedAt not in schema
            createdAt: new Date(),
        })
    }
}

