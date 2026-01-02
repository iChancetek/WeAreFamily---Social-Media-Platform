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
