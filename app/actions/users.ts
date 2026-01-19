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
        const currentUser = await getUserProfile();

        // Query most recent 50 users (online or offline)
        // This ensures the "Members" list is populated so you can DM/Call them anytime.
        const usersSnapshot = await adminDb.collection("users")
            .orderBy("lastActiveAt", "desc")
            .limit(50)
            .get();

        // Filter out current user and blocked users
        let activeUsers = usersSnapshot.docs
            .map((userDoc: any) => ({ id: userDoc.id, ...userDoc.data() }) as any)
            .filter((u: any) => u.id !== currentUser?.id && u.isInvisible !== true);

        if (currentUser) {
            // Fetch blocked users
            const blockedSnapshot = await adminDb.collection("blockedUsers").get();
            const excludedIds = new Set<string>();

            blockedSnapshot.docs.forEach((blockDoc: any) => {
                const blockData = blockDoc.data();
                if (blockData.blockerId === currentUser.id || blockData.blockedId === currentUser.id) {
                    excludedIds.add(blockData.blockerId);
                    excludedIds.add(blockData.blockedId);
                }
            });

            activeUsers = activeUsers.filter((u: any) => !excludedIds.has(u.id));
        }

        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

        return activeUsers.map((u: any) => {
            const displayName = u.displayName ||
                (u.profileData?.firstName ? `${u.profileData.firstName} ${u.profileData.lastName || ''}`.trim() : null) ||
                u.email?.split('@')[0] ||
                "Unknown";

            // Calculate Online Status
            // Check if lastActiveAt is a Firestore Timestamp or Date
            let lastActiveDate = u.lastActiveAt instanceof Date ? u.lastActiveAt : u.lastActiveAt?.toDate?.();
            const isOnline = lastActiveDate ? lastActiveDate > fifteenMinutesAgo : false;

            return JSON.parse(JSON.stringify({
                id: u.id,
                displayName: displayName,
                imageUrl: u.imageUrl || null,
                profileData: u.profileData,
                isOnline: isOnline
            }));
        });
    } catch (error) {
        console.error("Error fetching users:", error);
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
