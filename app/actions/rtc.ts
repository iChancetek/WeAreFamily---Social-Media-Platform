"use server"

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getUserProfile } from "./users";
import { logAuditEvent } from "./audit";

export type SessionType = "broadcast" | "call_video" | "call_audio";

export interface RTCSession {
    id: string;
    hostId: string;
    type: SessionType;
    participants: string[];
    status: "active" | "ended";
    startedAt: any;
    endedAt?: any;
}

export interface SignalPayload {
    type: "offer" | "answer" | "candidate";
    sdp?: string;
    candidate?: any;
    from: string;
    to: string;
}

export async function startSession(type: SessionType, targetUserId?: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    // Determine participants based on session type
    const participants = type === "broadcast"
        ? [user.id]
        : [user.id, targetUserId!];

    // For direct calls, check if target user has blocked caller
    if (type !== "broadcast" && targetUserId) {
        const targetUserDoc = await adminDb.collection("users").doc(targetUserId).get();
        const targetUserData = targetUserDoc.data();

        if (targetUserData?.blockedUsers?.includes(user.id)) {
            throw new Error("Cannot call this user");
        }
    }

    const sessionData = {
        hostId: user.id,
        type,
        participants,
        status: "active",
        startedAt: FieldValue.serverTimestamp(),
    };

    const sessionRef = await adminDb.collection("active_sessions").add(sessionData);

    // Log audit event
    await logAuditEvent(
        type === "broadcast" ? "content.create" : "user.action",
        {
            targetType: "rtc_session",
            targetId: sessionRef.id,
            targetName: type === "broadcast" ? "Live Broadcast" : "Direct Call",
            details: { sessionType: type, participants }
        }
    );

    return {
        sessionId: sessionRef.id,
        ...sessionData,
    };
}

export async function endSession(sessionId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const sessionRef = adminDb.collection("active_sessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
        throw new Error("Session not found");
    }

    const sessionData = sessionDoc.data();

    // Only host or participants can end the session
    if (!sessionData?.participants?.includes(user.id)) {
        throw new Error("Unauthorized to end this session");
    }

    await sessionRef.update({
        status: "ended",
        endedAt: FieldValue.serverTimestamp(),
    });

    // Clean up signaling data after a delay (optional)
    // For now, we'll keep it for debugging purposes

    return { success: true };
}

export async function sendSignal(sessionId: string, payload: Omit<SignalPayload, "from">) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const sessionRef = adminDb.collection("active_sessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
        throw new Error("Session not found");
    }

    const sessionData = sessionDoc.data();

    // Verify user is a participant
    if (!sessionData?.participants?.includes(user.id)) {
        throw new Error("Unauthorized to signal in this session");
    }

    const signalData = {
        ...payload,
        from: user.id,
        timestamp: FieldValue.serverTimestamp(),
    };

    await sessionRef.collection("signals").add(signalData);

    return { success: true };
}

export async function getActiveSession(sessionId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const sessionDoc = await adminDb.collection("active_sessions").doc(sessionId).get();

    if (!sessionDoc.exists) {
        return null;
    }

    const sessionData = sessionDoc.data();

    // For broadcasts, anyone can view
    // For calls, only participants can view
    if (sessionData?.type !== "broadcast" && !sessionData?.participants?.includes(user.id)) {
        throw new Error("Unauthorized to view this session");
    }

    return {
        id: sessionDoc.id,
        ...sessionData,
    } as RTCSession;
}

export async function getActiveBroadcasts() {
    const snapshot = await adminDb
        .collection("active_sessions")
        .where("type", "==", "broadcast")
        .where("status", "==", "active")
        .orderBy("startedAt", "desc")
        .limit(20)
        .get();

    const broadcasts = await Promise.all(
        snapshot.docs.map(async (doc) => {
            const data = doc.data();

            // Get host profile
            const hostDoc = await adminDb.collection("users").doc(data.hostId).get();
            const hostData = hostDoc.data();

            return {
                id: doc.id,
                ...data,
                hostName: hostData?.displayName || "Unknown User",
                hostImage: hostData?.imageUrl || hostData?.profileData?.imageUrl,
            };
        })
    );

    return broadcasts;
}

export async function getIncomingCall(userId: string) {
    const snapshot = await adminDb
        .collection("active_sessions")
        .where("participants", "array-contains", userId)
        .where("status", "==", "active")
        .where("type", "in", ["call_video", "call_audio"])
        .orderBy("startedAt", "desc")
        .limit(1)
        .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Only return if user is NOT the host (i.e., they're receiving the call)
    if (data.hostId === userId) return null;

    // Get caller info
    const callerDoc = await adminDb.collection("users").doc(data.hostId).get();
    const callerData = callerDoc.data();

    return {
        id: doc.id,
        ...data,
        callerName: callerData?.displayName || "Unknown User",
        callerImage: callerData?.imageUrl || callerData?.profileData?.imageUrl,
    };
}
