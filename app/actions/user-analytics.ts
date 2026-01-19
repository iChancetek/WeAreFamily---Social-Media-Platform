"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";

/**
 * Get individual user analytics
 */
export async function getUserAnalyticsSimple(userId: string) {
    console.log('--- getUserAnalyticsSimple START ---');
    console.log('Fetching user analytics for ID:', userId);

    try {
        if (!userId) {
            console.error('Error: userId is empty');
            return null;
        }

        const userDocRef = adminDb.collection("users").doc(userId);
        const userDoc = await userDocRef.get();
        console.log('User doc path:', userDocRef.path);
        console.log('User doc exists:', userDoc.exists);

        if (!userDoc.exists) {
            console.warn(`User document with ID ${userId} does not exist in collection 'users'.`);
            return {
                _error: "User Document Not Found",
                _searchedId: userId,
                _collection: "users",
                _dbProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "unknown"
            };
        }
        const userData = userDoc.data();
        console.log('User data found:', userData?.email);

        // Helper to get count with fallback
        const getCount = async (query: any, label: string) => {
            try {
                // Firestore aggregate count (supported in newer SDKs)
                const agg = await query.count().get();
                const count = agg.data().count;
                console.log(`${label} count (agg):`, count);
                return count;
            } catch (e: any) {
                console.warn(`Aggregation failed for ${label}, falling back to size. Error: ${e.message}`);
                // Fallback to fetching docs and using size
                const snap = await query.get();
                console.log(`${label} count (snap):`, snap.size);
                return snap.size;
            }
        };

        // Count user's posts
        const postsCount = await getCount(
            adminDb.collection("posts").where("userId", "==", userId),
            'Posts'
        );

        // Count user's groups (as member)
        const groupsCount = await getCount(
            adminDb.collection("groups").where("members", "array-contains", userId),
            'Groups'
        );

        // Recent posts (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentPostsCount = await getCount(
            adminDb
                .collection("posts")
                .where("userId", "==", userId)
                .where("createdAt", ">=", sevenDaysAgo),
            'Recent Posts'
        );

        const result = {
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
        console.log('Returning analysis result:', result);
        console.log('--- getUserAnalyticsSimple END ---');
        return result;

    } catch (error: any) {
        console.error("Error fetching user analytics:", error);
        // Log the full stack trace if possible
        if (error.stack) console.error(error.stack);
        return {
            _error: error.message
        }; // Return error details instead of just null to help debug specific issues
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
