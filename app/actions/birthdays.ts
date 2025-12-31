"use server";

import { db } from "@/db";
import { users, posts } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { generateBirthdayWish } from "./ai";
import { revalidatePath } from "next/cache";

import { currentUser } from "@clerk/nextjs/server";

export async function checkAndCelebrateBirthdays() {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");
    const adminUserId = user.id;

    // 1. Get today's MM-DD
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    const day = today.getDate().toString().padStart(2, "0");
    const todayString = `${month}-${day}`;
    const currentYear = today.getFullYear();

    console.log(`Checking birthdays for ${todayString}...`);

    // 2. Find users with this birthday
    const allUsers = await db.query.users.findMany({
        where: isNotNull(users.birthday)
    });

    const birthdayUsers = allUsers.filter(u => {
        return u.birthday === todayString && u.lastCelebratedYear !== currentYear;
    });

    if (birthdayUsers.length === 0) {
        return { success: true, message: "No new birthdays to celebrate today." };
    }

    // 3. Generate wishes and create posts
    let celebratedCount = 0;
    for (const user of birthdayUsers) {
        const profile = user.profileData as { firstName?: string, lastName?: string };
        const name = profile.firstName || "Family Member";

        const wish = await generateBirthdayWish(name);

        // Create Post
        await db.insert(posts).values({
            authorId: adminUserId, // Post on behalf of Admin (or the system runner)
            content: `🎉🎂 HAPPY BIRTHDAY ${name}! 🎂🎉\n\n${wish}`,
            createdAt: new Date(),
        });

        // Update user's lastCelebratedYear
        await db.update(users)
            .set({ lastCelebratedYear: currentYear })
            .where(eq(users.id, user.id));

        celebratedCount++;
    }

    revalidatePath("/");
    return { success: true, message: `Celebrated ${celebratedCount} birthdays! 🥳` };
}
