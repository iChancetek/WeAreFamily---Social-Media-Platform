"use server";

import { db } from "@/db";
import { users, blockedUsers } from "@/db/schema";
import { getUserProfile } from "@/lib/auth";
import { eq, gt, desc, not, and, or, notInArray } from "drizzle-orm";

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

    let whereClause = and(
        gt(users.lastActiveAt, fifteenMinutesAgo),
        eq(users.isInvisible, false)
    );

    // Exclude current user from the list if logged in
    if (currentUser) {
        whereClause = and(
            whereClause,
            not(eq(users.id, currentUser.id))
        );

        // Fetch blocked users (both ways) to exclude them
        const blocked = await db.query.blockedUsers.findMany({
            where: or(
                eq(blockedUsers.blockerId, currentUser.id),
                eq(blockedUsers.blockedId, currentUser.id)
            ),
            columns: {
                blockerId: true,
                blockedId: true
            }
        });

        const excludedIds = new Set<string>();
        blocked.forEach(b => {
            excludedIds.add(b.blockerId);
            excludedIds.add(b.blockedId);
        });
        // Remove current user ID from set just in case, though `not(eq)` handles it
        excludedIds.delete(currentUser.id);

        if (excludedIds.size > 0) {
            whereClause = and(whereClause, notInArray(users.id, Array.from(excludedIds)));
        }
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
