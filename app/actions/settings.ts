'use server'

import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getUserProfile } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function updateProfile(data: { displayName?: string, bio?: string, imageUrl?: string, coverUrl?: string, coverType?: 'image' | 'video', birthday?: string }) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    await db.update(users)
        .set({
            displayName: data.displayName,
            bio: data.bio,
            imageUrl: data.imageUrl,
            coverUrl: data.coverUrl,
            coverType: data.coverType,
            birthday: data.birthday
        })
        .where(eq(users.id, user.id))

    revalidatePath('/settings')
    revalidatePath('/u/' + user.id)
    revalidatePath('/')
}

export async function updateAccountSettings(data: { language?: string, theme?: string }) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    await db.update(users)
        .set({
            language: data.language,
            theme: data.theme
        })
        .where(eq(users.id, user.id))

    revalidatePath('/settings')
    revalidatePath('/') // Revalidate root as theme/lang might affect everywhere
}
