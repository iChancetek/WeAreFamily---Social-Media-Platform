import { cookies } from "next/headers";
import { adminDb } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";
import { sanitizeData } from "@/lib/serialization";

export async function getUserProfile() {
    try {
        const cookieStore = await cookies();
        const sessionUid = cookieStore.get("session_uid")?.value;

        if (!sessionUid) {
            return null;
        }

        const userDoc = await adminDb.collection("users").doc(sessionUid).get();

        if (!userDoc.exists) {
            return null;
        }

        const data = userDoc.data();
        return sanitizeData({
            id: userDoc.id,
            ...data
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
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
