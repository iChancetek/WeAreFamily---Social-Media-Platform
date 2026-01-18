"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { headers } from "next/headers";

export async function startTrackingSession() {
    const user = await getUserProfile();
    if (!user) return null;

    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown Device";

    // Create a new session doc
    const sessionRef = await adminDb.collection("users").doc(user.id).collection("sessions").add({
        startedAt: FieldValue.serverTimestamp(),
        endedAt: null,
        duration: 0,
        deviceInfo: userAgent,
        status: 'active',
        lastHeartbeat: FieldValue.serverTimestamp()
    });

    // Update User's lastSignInAt and lastActiveAt to ensure they appear in online lists immediately
    await adminDb.collection("users").doc(user.id).update({
        lastSignInAt: FieldValue.serverTimestamp(),
        lastActiveAt: FieldValue.serverTimestamp(),
        isOnline: true
    });

    return sessionRef.id;
}

export async function updateSessionHeartbeat(sessionId: string, accumulatedDurationMs: number) {
    const user = await getUserProfile();
    if (!user) return;

    const sessionRef = adminDb.collection("users").doc(user.id).collection("sessions").doc(sessionId);

    // Update session
    await sessionRef.update({
        lastHeartbeat: FieldValue.serverTimestamp(),
        duration: accumulatedDurationMs,
        // We don't set endedAt here, we assume it's still ongoing.
    });

    // Update User Total Time (Incrementally? No, better to just update user online status)
    // To efficiently track TOTAL time, we might want to increment a global counter on the user doc
    // But incrementing every minute might be write-heavy? 
    // Let's do it: it's admin visibility, accuracy matters.
    // 60 seconds interval = 1 write per user per minute. Acceptable for now.

    // Calculating delta since last update is hard without reading.
    // Simpler approach: Re-calculate total time when session ends OR just increment by Heartbeat Interval (client sends delta?)
    // Let's rely on client sending "I've been active for X extra ms" OR just server diff?
    // Client sending "I've been active for 60s since last ping" is safer.

    // However, for simplicity and robustness against client tampering, let's just mark "lastActive"
    // and rely on a background job or aggregation for "Total Time".
    // BUT the requirement is "Account Accurate Time Spent".

    // Let's try: Update user's `totalTimeSpent` by incrementing by the heartbeat interval (approx 60s).
    // The client should call this every 60s.
    // Debounce totalTimeSpent update to avoid multi-tab overcounting
    // We only increment if lastActiveAt was older than 45 seconds (allowing for some jitter in 60s heartbeat)
    const userDocRef = adminDb.collection("users").doc(user.id);
    const userDoc = await userDocRef.get();
    const userData = userDoc.data();

    let shouldIncrementDetails = true;
    if (userData?.lastActiveAt) {
        // Check if last update was very recent
        const lastActiveTime = userData.lastActiveAt.toDate().getTime();
        const now = Date.now();
        if (now - lastActiveTime < 45000) {
            shouldIncrementDetails = false;
        }
    }

    const updates: any = {
        isOnline: true,
        lastActiveAt: FieldValue.serverTimestamp(),
    };

    if (shouldIncrementDetails) {
        updates.totalTimeSpent = FieldValue.increment(60000); // 60s
    }

    await userDocRef.update(updates);
}

export async function endTrackingSession(sessionId: string) {
    const user = await getUserProfile();
    if (!user) return;

    try {
        const sessionRef = adminDb.collection("users").doc(user.id).collection("sessions").doc(sessionId);

        await sessionRef.update({
            endedAt: FieldValue.serverTimestamp(),
            status: 'completed',
            // We could finalize duration here based on start/end difference if we trusted server times more
        });

        await adminDb.collection("users").doc(user.id).update({
            isOnline: false,
            lastSignOffAt: FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("Error ending session", error);
    }
}
