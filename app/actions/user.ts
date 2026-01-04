"use server";

import { adminDb } from "@/lib/firebase-admin";
import { doc, updateDoc } from "firebase/firestore";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateBirthday(birthday: string) {
    // Basic validation for MM-DD format
    const regex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
    if (!regex.test(birthday)) {
        throw new Error("Invalid format. Use MM-DD");
    }

    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    await adminDb.collection("users").doc(user.id).update({ birthday });

    revalidatePath("/");
    return { success: true };
}

export async function searchUsers(query: string) {
    if (!query || query.length < 2) return [];

    const user = await getUserProfile();
    if (!user) return [];

    // Simple prefix search
    const snapshot = await adminDb.collection("users")
        .where("displayName", ">=", query)
        .where("displayName", "<=", query + "\uf8ff")
        .limit(10)
        .get();

    return snapshot.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() } as any))
        .filter((u: any) => u.id !== user.id);
}
