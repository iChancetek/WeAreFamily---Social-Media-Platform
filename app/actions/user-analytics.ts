"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";

/**
 * Get individual user analytics
 */
export async function getUserAnalyticsSimple(userId: string) {
    console.log('Fetching user analytics for ID:', userId);

    try {
        const userDoc = await adminDb.collection("users").doc(userId).get();
        console.log('User doc exists:', userDoc.exists);
        if (!userDoc.exists) {
            return null;
        }
        const userData = userDoc.data();

        // Helper to get count with fallback
        const getCount = async (query: any) => {
            try {
                // Firestore aggregate count (supported in newer SDKs)
                const agg = await query.count().get();
                return agg.data().count;
            } catch (e) {
                // Fallback to fetching docs and using size
                const snap = await query.get();
                return snap.size;
            }
        };

        // Count user's posts
        const postsCount = await getCount(
            adminDb.collection("posts").where("userId", "==", userId)
        );

        // Count user's groups (as member)
        const groupsCount = await getCount(
            adminDb.collection("groups").where("members", "array-contains", userId)
        );

        // Recent posts (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentPostsCount = await getCount(
            adminDb
                .collection("posts")
                .where("userId", "==", userId)
                .where("createdAt", ">=", sevenDaysAgo)
        );

        return {
            userId,
            displayName: userData?.displayName || "Unknown User",
            email: userData?.email || "",
            photoURL: userData?.photoURL || "",
            joinedDate: userData?.createdAt?.toDate ? userData?.createdAt?.toDate().toISOString() : null,
            totalPosts: postsCount,
            totalGroups: groupsCount,
            recentPosts: recentPostsCount,
            _isRealData: true,
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
