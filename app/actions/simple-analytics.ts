"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";

/**
 * Get simple real analytics without complex queries
 */
export async function getSimpleAnalytics() {
    const user = await getUserProfile();
    if (!user || user.role !== 'admin') throw new Error("Unauthorized");

    // Helper to get count with fallback for Firestore SDK versions
    const getCount = async (query: any) => {
        try {
            const agg = await query.count().get();
            return agg.data().count;
        } catch (e) {
            const snap = await query.get();
            return snap.size;
        }
    };
    try {
        // Fetch basic counts using fallback helper
        const totalUsers = await getCount(adminDb.collection("users"));
        const totalPosts = await getCount(adminDb.collection("posts"));
        const totalGroups = await getCount(adminDb.collection("groups"));
        const totalBranding = await getCount(adminDb.collection("branding"));

        // Get recent activity (last 7 days posts)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        // Recent posts count with fallback
        const recentPosts = await getCount(
            adminDb.collection("posts").where("createdAt", ">=", sevenDaysAgo)
        );
        return {
            totalUsers,
            totalPosts,
            totalGroups,
            totalBranding,
            recentActivity: recentPosts,
            _isRealData: true
        };

    } catch (error: any) {
        console.error("Error fetching analytics:", error);

        // Return minimal data if queries fail
        return {
            totalUsers: 0,
            totalPosts: 0,
            totalGroups: 0,
            totalBranding: 0,
            recentActivity: 0,
            _isRealData: false,
            _error: error.message
        };
    }
}

/**
 * Get list of users for Individual User Analysis
 */
export async function getAnalyticsUserList() {
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
            email: doc.data().email || "",
            photoURL: doc.data().photoURL || "",
            createdAt: doc.data().createdAt?.toDate().toISOString() || null
        }));

        return users;

    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}
