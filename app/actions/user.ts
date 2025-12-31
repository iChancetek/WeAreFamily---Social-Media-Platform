"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
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

    await db.update(users)
        .set({ birthday: birthday })
        .where(eq(users.id, user.id));

    revalidatePath("/");
    return { success: true };
}
