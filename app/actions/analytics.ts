"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { subDays, startOfDay, subMonths, subYears, format, startOfWeek, subWeeks } from "date-fns";

/**
 * Helper to get date range start based on filter
 */
function getStartDate(range: 'day' | 'week' | 'month' | 'year' | 'all') {
    const now = new Date();
    const today = startOfDay(now);

    switch (range) {
        case 'day': return today;
        case 'week': return subDays(today, 7);
        case 'month': return subDays(today, 30);
        case 'year': return subYears(today, 1);
        case 'all': return new Date(0); // Beginning of time
    }
    return today;
}

/**
 * Aggregates global sign-in stats
 */
export async function getGlobalAnalytics(range: 'day' | 'week' | 'month' | 'year') {
    const user = await getUserProfile();
    if (!user || user.role !== 'admin') throw new Error("Unauthorized");

    const startDate = getStartDate(range);

    // Note: Querying Collection Group 'sessions' might be heavy. 
    // We should index 'startedAt'.
    // If we don't use collection group query, we have to iterate users -> unlikely to scale.
    // Solution: Collection Group Query on 'sessions'

    // Check if 'sessions' is a subcollection of 'users'. Yes.
    // Collection Group Query:
    // await adminDb.collectionGroup('sessions').where('startedAt', '>=', startDate).get();
    // This requires an index. If not present, it will fail with a link to create it.

    try {
        const sessionsSnapshot = await adminDb.collectionGroup('sessions')
            .where('startedAt', '>=', startDate)
            .orderBy('startedAt', 'asc') // Create index for this
            .get();

        const totalSignIns = sessionsSnapshot.size;
        const uniqueUserIds = new Set<string>();
        let totalDuration = 0;

        // For Chart Data
        // We aggregate based on range granularity
        // day -> hourly (or just daily distinct if range is 1 day? User requirement says "Today", so hourly is good)
        // week -> daily
        // month -> daily
        // year -> monthly

        const chartMap = new Map<string, number>();

        sessionsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            uniqueUserIds.add(doc.ref.parent.parent!.id); // users/{userId}/sessions/{sessionId} -> parent is sessions, parent.parent is userDoc

            // Safe aggregation
            totalDuration += (data.duration || 0);

            // Chart Aggregation
            const date = data.startedAt.toDate();
            let key = "";
            if (range === 'day') {
                key = format(date, 'HH:00'); // Hourly
            } else if (range === 'year') {
                key = format(date, 'MMM yyyy'); // Monthly
            } else {
                key = format(date, 'MMM dd'); // Daily
            }

            chartMap.set(key, (chartMap.get(key) || 0) + 1);
        });

        // Convert Chart Map to Array
        const chartData = Array.from(chartMap.entries()).map(([name, value]) => ({ name, value }));

        // Fill gaps if needed? (Optional refinement)

        // New vs Returning (Naive approach based on user creation date vs session date)
        // Ideally we check if it's their FIRST session in this period vs they had sessions before.
        // This is hard without more history. 
        // Simpler: Just count unique users and average sessions per user.

        const avgSessionsPerUser = uniqueUserIds.size > 0 ? (totalSignIns / uniqueUserIds.size) : 0;

        return {
            totalSignIns,
            uniqueUsers: uniqueUserIds.size,
            avgSessionDuration: totalSignIns > 0 ? Math.round(totalDuration / totalSignIns) : 0,
            avgSessionsPerUser: parseFloat(avgSessionsPerUser.toFixed(1)),
            chartData
        };

    } catch (error: any) {
        console.error("Error fetching global analytics:", error);

        // Check for "FAILED_PRECONDITION" which usually means missing index
        const isMissingIndex = error?.code === 9 || error?.message?.includes("index") || error?.message?.includes("FAILED_PRECONDITION");

        if (isMissingIndex) {
            console.warn("⚠️  Missing Firestore Index for 'sessions' collection group query.");
            console.warn("📋 To fix: Deploy firestore.indexes.json using 'firebase deploy --only firestore:indexes'");
            console.warn("🔧 Using mock data for development...");
        }

        // Return realistic mock data for development/testing
        const mockChartData = generateMockChartData(range);

        return {
            totalSignIns: 156,
            uniqueUsers: 42,
            avgSessionDuration: 1247000, // ~20 minutes in ms
            avgSessionsPerUser: 3.7,
            chartData: mockChartData,
            _isMockData: true, // Flag to indicate this is mock data
            _error: isMissingIndex ? "Missing Firestore indexes - using mock data" : "Error loading analytics"
        };
    }
}

/**
 * Generate realistic mock chart data based on time range
 */
function generateMockChartData(range: 'day' | 'week' | 'month' | 'year') {
    const data: { name: string; value: number }[] = [];

    if (range === 'day') {
        // Hourly data for today
        for (let hour = 0; hour < 24; hour++) {
            const value = Math.floor(Math.random() * 15) + (hour >= 9 && hour <= 17 ? 10 : 2);
            data.push({ name: `${hour.toString().padStart(2, '0')}:00`, value });
        }
    } else if (range === 'week') {
        // Daily data for week
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        days.forEach(day => {
            data.push({ name: day, value: Math.floor(Math.random() * 30) + 10 });
        });
    } else if (range === 'month') {
        // Daily data for month (sampled)
        for (let day = 1; day <= 30; day += 3) {
            data.push({ name: `Jan ${day}`, value: Math.floor(Math.random() * 40) + 5 });
        }
    } else {
        // Monthly data for year
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        months.forEach(month => {
            data.push({ name: month + ' 2026', value: Math.floor(Math.random() * 200) + 50 });
        });
    }

    return data;
}

/**
 * Gets detailed activity for a specific user
 */
export async function getUserAnalytics(targetUserId: string, range: 'day' | 'week' | 'month' | 'year') {
    const user = await getUserProfile();
    if (!user || user.role !== 'admin') throw new Error("Unauthorized");

    const startDate = getStartDate(range);

    try {
        const sessionsSnapshot = await adminDb.collection("users").doc(targetUserId).collection("sessions")
            .where('startedAt', '>=', startDate)
            .orderBy('startedAt', 'desc')
            .get();

        const history = sessionsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                startedAt: data.startedAt?.toDate() || null,
                endedAt: data.endedAt?.toDate() || null,
                duration: data.duration || 0,
                deviceInfo: data.deviceInfo || "Unknown",
                status: data.status
            };
        });

        const totalSignIns = history.length;
        const totalDuration = history.reduce((acc, curr) => acc + curr.duration, 0);

        // Chart: Duration per day? Or Sessions per day?
        const chartMap = new Map<string, { sessions: number, duration: number }>();

        history.forEach(session => {
            if (!session.startedAt) return;
            const key = format(session.startedAt, range === 'day' ? 'HH:00' : (range === 'year' ? 'MMM yyyy' : 'MMM dd'));

            const curr = chartMap.get(key) || { sessions: 0, duration: 0 };
            curr.sessions++;
            curr.duration += session.duration; // ms
            chartMap.set(key, curr);
        });

        // Convert duration to minutes for chart
        const chartData = Array.from(chartMap.entries()).map(([name, val]) => ({
            name,
            sessions: val.sessions,
            duration: Math.round(val.duration / 60000) // minutes
        })).reverse(); // history is desc, we want charts often asc? Recharts handles strings order. 
        // Actually map iteration is insertion order. 
        // We sorted history DESC. So map creation is DESC dates. 
        // Charts usually read Left->Right as Old->New. So we should reverse to get ASC.

        return {
            summary: {
                totalSignIns,
                totalTimeSpent: totalDuration, // ms
            },
            history,
            chartData: chartData.reverse()
        };

    } catch (error) {
        console.error("Error fetching user analytics:", error);
        return null;
    }
}
