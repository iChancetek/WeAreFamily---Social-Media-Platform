"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getUserProfile } from "@/lib/auth";
import { eq, gt, desc, not } from "drizzle-orm";

export async function updateLastActive() {
    const user = await getUserProfile();
    if (!user) return;

    await db.update(users)
        .set({ lastActiveAt: new Date() })
        .where(eq(users.id, user.id));
}

export async function getActiveUsers() {
    // Active in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const currentUser = await getUserProfile();

    let whereClause = gt(users.lastActiveAt, fifteenMinutesAgo);

    // Exclude current user from the list if logged in
    if (currentUser) {
        whereClause = not(eq(users.id, currentUser.id)) && gt(users.lastActiveAt, fifteenMinutesAgo) as any;
    }

    const activeUsers = await db.query.users.findMany({
        where: whereClause,
        orderBy: [desc(users.lastActiveAt)],
        columns: {
            id: true,
            profileData: true,
            email: true,
            lastActiveAt: true,
            displayName: true,
        },
        limit: 20
    });

    return activeUsers;
}
