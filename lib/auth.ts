import { cookies } from "next/headers";
import { adminDb } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";
import { sanitizeData } from "@/lib/serialization";

export async function getUserProfile() {
    try {
        const cookieStore = await cookies();
        const sessionUid = cookieStore.get("session_uid")?.value;

        if (!sessionUid) {
            console.log("[getUserProfile] No session cookie found");
            return null;
        }

        console.log(`[getUserProfile] Fetching profile for uid: ${sessionUid}`);
        const userDoc = await adminDb.collection("users").doc(sessionUid).get();

        if (!userDoc.exists) {
            console.warn(`[getUserProfile] User document not found for ${sessionUid}`);
            return null;
        }

        const data = userDoc.data();
        return sanitizeData({
            id: userDoc.id,
            ...data
        });
    } catch (error) {
        console.error("[getUserProfile] Critical Error fetching user profile:", error);
        return null;
    }
}

export async function requireUser() {
    const profile = await getUserProfile();

    if (!profile) {
        redirect("/login");
    }

    return profile;
}
