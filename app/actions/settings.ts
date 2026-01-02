'use server'

import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: { displayName?: string, bio?: string, imageUrl?: string, coverUrl?: string, coverType?: 'image' | 'video', birthday?: string }) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    const userRef = doc(db, "users", user.id);
    await updateDoc(userRef, {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
        ...(data.coverType !== undefined && { coverType: data.coverType }),
        ...(data.birthday !== undefined && { birthday: data.birthday }),
    });

    revalidatePath('/settings')
    revalidatePath('/u/' + user.id)
    revalidatePath('/')
}

export async function updateAccountSettings(data: { language?: string, theme?: string }) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    const userRef = doc(db, "users", user.id);
    await updateDoc(userRef, {
        ...(data.language !== undefined && { language: data.language }),
        ...(data.theme !== undefined && { theme: data.theme }),
    });

    revalidatePath('/settings')
    revalidatePath('/') // Revalidate root as theme/lang might affect everywhere
}
