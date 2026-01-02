import { cookies } from "next/headers";
import { adminDb } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";

export async function getUserProfile() {
    const cookieStore = await cookies();
    const sessionUid = cookieStore.get("session_uid")?.value;

    if (!sessionUid) {
        return null;
    }

    try {
        const userDoc = await adminDb.collection("users").doc(sessionUid).get();

        if (!userDoc.exists) {
            return null;
        }

        return {
            id: userDoc.id,
            ...userDoc.data()
        } as any;
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
