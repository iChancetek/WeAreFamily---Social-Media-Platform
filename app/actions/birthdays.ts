"use server";

import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where } from "firebase/firestore";
import { generateBirthdayWish } from "./ai";
import { revalidatePath } from "next/cache";
import { getUserProfile } from "@/lib/auth";
import { serverTimestamp } from "firebase/firestore";

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
    const usersSnapshot = await getDocs(collection(db, "users"));

    const birthdayUsers = usersSnapshot.docs
        .map(userDoc => ({ id: userDoc.id, ...userDoc.data() }) as any)
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
        await addDoc(collection(db, "posts"), {
            authorId: adminUserId,
            content: `🎉🎂 HAPPY BIRTHDAY ${name}! 🎂🎉\n\n${wish}`,
            likes: [],
            mediaUrls: [],
            createdAt: serverTimestamp(),
        });

        // Update user's lastCelebratedYear
        await updateDoc(doc(db, "users", bdayUser.id), {
            lastCelebratedYear: currentYear
        });

        celebratedCount++;
    }

    revalidatePath("/");
    return { success: true, message: `Celebrated ${celebratedCount} birthdays! 🥳` };
}
