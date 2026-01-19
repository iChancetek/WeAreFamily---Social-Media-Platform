"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";

/**
 * Get individual user analytics
 */
export async function getUserAnalyticsSimple(userId: string) {
    const user = await getUserProfile();
    if (!user || user.role !== 'admin') throw new Error("Unauthorized");

    try {
        // Get user profile
        const userDoc = await adminDb.collection("users").doc(userId).get();
        if (!userDoc.exists) {
            return null;
        }

        const userData = userDoc.data();

        // Count user's posts
        const postsSnapshot = await adminDb.collection("posts")
            .where("userId", "==", userId)
            .count()
            .get();

        // Count user's groups (as member)
        const groupsSnapshot = await adminDb.collection("groups")
            .where("members", "array-contains", userId)
            .count()
            .get();

        // Get recent posts (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentPostsSnapshot = await adminDb.collection("posts")
            .where("userId", "==", userId)
            .where("createdAt", ">=", sevenDaysAgo)
            .count()
            .get();

        return {
            userId,
            displayName: userData?.displayName || "Unknown User",
            email: userData?.email || "",
            photoURL: userData?.photoURL || "",
            joinedDate: userData?.createdAt?.toDate().toISOString() || null,
            totalPosts: postsSnapshot.data().count,
            totalGroups: groupsSnapshot.data().count,
            recentPosts: recentPostsSnapshot.data().count,
            _isRealData: true
        };

    } catch (error: any) {
        console.error("Error fetching user analytics:", error);
        return null;
    }
}

/**
 * Get list of all users for the dropdown
 */
export async function getAllUsersList() {
    const user = await getUserProfile();
    if (!user || user.role !== 'admin') throw new Error("Unauthorized");

    try {
        const usersSnapshot = await adminDb.collection("users")
            .orderBy("createdAt", "desc")
            .limit(100)
            .get();

        const users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            displayName: doc.data().displayName || "Unknown User",
            email: doc.data().email || ""
        }));

        return users;

    } catch (error) {
        console.error("Error fetching users list:", error);
        return [];
    }
}
