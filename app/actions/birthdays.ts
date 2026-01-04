"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { generateBirthdayWish } from "./ai";
import { revalidatePath } from "next/cache";
import { getUserProfile } from "@/lib/auth";

export async function checkAndCelebrateBirthdays() {
    const user = await getUserProfile();
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
    const usersSnapshot = await adminDb.collection("users").get();

    const birthdayUsers = usersSnapshot.docs
        .map((userDoc: any) => ({ id: userDoc.id, ...userDoc.data() }) as any)
        .filter((u: any) => u.birthday === todayString && u.lastCelebratedYear !== currentYear);

    if (birthdayUsers.length === 0) {
        return { success: true, message: "No new birthdays to celebrate today." };
    }

    // 3. Generate wishes and create posts
    let celebratedCount = 0;
    for (const bdayUser of birthdayUsers) {
        const name = (bdayUser as any).displayName || "Family Member";
        const wish = await generateBirthdayWish(name);

        // Create Post
        await adminDb.collection("posts").add({
            authorId: adminUserId,
            content: `🎉🎂 HAPPY BIRTHDAY ${name}! 🎂🎉\n\n${wish}`,
            likes: [],
            mediaUrls: [],
            createdAt: FieldValue.serverTimestamp(),
        });

        // Update user's lastCelebratedYear
        await adminDb.collection("users").doc(bdayUser.id).update({
            lastCelebratedYear: currentYear
        });

        celebratedCount++;
    }

    revalidatePath("/");
    return { success: true, message: `Celebrated ${celebratedCount} birthdays! 🥳` };
}
