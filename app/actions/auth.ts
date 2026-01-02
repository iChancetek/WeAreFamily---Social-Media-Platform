"use server"
import { cookies } from "next/headers"
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

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
        const userRef = adminDb.collection("users").doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            await userRef.set({
                email: email,
                displayName: displayName,
                role: email === "chancellor@ichancetek.com" ? "admin" : "member", // Auto-promote admin
                isActive: true,
                createdAt: FieldValue.serverTimestamp(),
            });
        } else {
            // Check if we need to promote existing user
            const userData = userDoc.data();
            if (email === "chancellor@ichancetek.com" && userData?.role !== "admin") {
                await userRef.update({ role: "admin" });
            }
        }
    } catch (error) {
        console.error("Error syncing user to database:", error)
        throw new Error("Failed to sync user to database")
    }
}
