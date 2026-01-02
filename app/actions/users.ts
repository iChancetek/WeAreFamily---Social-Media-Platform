"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getUserProfile } from "@/lib/auth";

export async function updateLastActive() {
    try {
        const user = await getUserProfile();
        if (!user) return;

        await adminDb.collection("users").doc(user.id).update({
            lastActiveAt: FieldValue.serverTimestamp()
        });
    } catch (error) {
        // Silent fail for activity tracking
        console.error("Error updating last active:", error);
    }
}

export async function getActiveUsers() {
    try {
        // Active in the last 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const currentUser = await getUserProfile();

        // Query users active recently
        const usersSnapshot = await adminDb.collection("users")
            .where("lastActiveAt", ">", fifteenMinutesAgo)
            .get();

        // Filter out current user and blocked users
        let activeUsers = usersSnapshot.docs
            .map(userDoc => ({ id: userDoc.id, ...userDoc.data() }) as any)
            .filter(u => u.id !== currentUser?.id && u.isInvisible !== true);

        if (currentUser) {
            // Fetch blocked users
            const blockedSnapshot = await adminDb.collection("blockedUsers").get();
            const excludedIds = new Set<string>();

            blockedSnapshot.docs.forEach(blockDoc => {
                const blockData = blockDoc.data();
                if (blockData.blockerId === currentUser.id || blockData.blockedId === currentUser.id) {
                    excludedIds.add(blockData.blockerId);
                    excludedIds.add(blockData.blockedId);
                }
            });

            activeUsers = activeUsers.filter(u => !excludedIds.has(u.id));
        }

        return activeUsers.map(u => ({
            id: u.id,
            displayName: u.displayName || "Family Member",
            imageUrl: u.imageUrl || null,
        }));
    } catch (error) {
        console.error("Error fetching active users:", error);
        return [];
    }
}

export async function getProfileById(userId: string) {
    try {
        const userDoc = await adminDb.collection("users").doc(userId).get();
        if (!userDoc.exists) return null;

        return {
            id: userDoc.id,
            ...userDoc.data()
        } as any;
    } catch (error) {
        console.error("Error fetching profile by ID:", error);
        return null;
    }
}
