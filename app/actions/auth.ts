"use server"

import { cookies } from "next/headers"
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

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

export async function syncUserToDb(uid: string, email: string, displayName: string) {
    try {
        const userRef = doc(db, "users", uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            await setDoc(userRef, {
                email: email,
                displayName: displayName,
                role: "member", // Default role for new users
                isActive: true, // Active by default
                createdAt: serverTimestamp(),
            });
        }
    } catch (error) {
        console.error("Error syncing user to database:", error)
        throw new Error("Failed to sync user to database")
    }
}
