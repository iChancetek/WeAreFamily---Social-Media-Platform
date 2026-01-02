"use server";

import { db } from "@/db";
import { users, blockedUsers } from "@/db/schema";
import { getUserProfile } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function blockUser(userId: string) {
    const currentUser = await getUserProfile();
    if (!currentUser) throw new Error("Unauthorized");

    if (currentUser.id === userId) throw new Error("Cannot block yourself");

    // Check if already blocked
    const existing = await db.query.blockedUsers.findFirst({
        where: and(
            eq(blockedUsers.blockerId, currentUser.id),
            eq(blockedUsers.blockedId, userId)
        )
    });

    if (existing) return;

    await db.insert(blockedUsers).values({
        blockerId: currentUser.id,
        blockedId: userId
    });

    revalidatePath("/settings");
    revalidatePath(`/u/${userId}`);
    revalidatePath("/");
}

export async function unblockUser(userId: string) {
    const currentUser = await getUserProfile();
    if (!currentUser) throw new Error("Unauthorized");

    await db.delete(blockedUsers)
        .where(
            and(
                eq(blockedUsers.blockerId, currentUser.id),
                eq(blockedUsers.blockedId, userId)
            )
        );

    revalidatePath("/settings");
    revalidatePath(`/u/${userId}`);
    revalidatePath("/");
}

export async function getBlockedUsers() {
    const currentUser = await getUserProfile();
    if (!currentUser) return [];

    const blocked = await db.query.blockedUsers.findMany({
        where: eq(blockedUsers.blockerId, currentUser.id),
        with: {
            blocked: {
                columns: {
                    id: true,
                    displayName: true,
                    email: true,
                    profileData: true,
                    imageUrl: true,
                }
            }
        }
    });

    return blocked.map(b => b.blocked);
}

export async function toggleInvisibleMode(isInvisible: boolean) {
    const currentUser = await getUserProfile();
    if (!currentUser) throw new Error("Unauthorized");

    await db.update(users)
        .set({ isInvisible })
        .where(eq(users.id, currentUser.id));

    revalidatePath("/settings");
    revalidatePath("/");
}
