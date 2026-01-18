"use server"

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getUserProfile } from "@/lib/auth";
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
    type: "offer" | "answer" | "candidate" | "kicked";
    sdp?: string;
    candidate?: any;
    from: string;
    to: string;
}

export async function startSession(type: SessionType, targetUserId?: string, isPublic: boolean = false) {
    try {
        const user = await getUserProfile();
        if (!user) {
            console.error("[startSession] Unauthorized: No user profile found");
            throw new Error("Unauthorized");
        }

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
            isPublic: type === "broadcast" ? isPublic : true, // Calls are always "public" to participants
            viewers: type === "broadcast" ? [] : undefined, // Track active viewers for broadcasts
            startedAt: FieldValue.serverTimestamp(),
            lastActiveAt: FieldValue.serverTimestamp(), // Initialize heartbeat
        };

        console.log("[startSession] Creating session in Firestore:", sessionData);
        const sessionRef = await adminDb.collection("active_sessions").add(sessionData);

        // Log audit event
        try {
            await logAuditEvent(
                type === "broadcast" ? "settings.update" : "message.sent",
                {
                    targetType: "rtc_session",
                    targetId: sessionRef.id,
                    targetName: type === "broadcast" ? "Live Broadcast" : "Direct Call",
                    details: { sessionType: type, participants }
                }
            );
        } catch (auditErr) {
            console.error("[startSession] Audit log failed (non-critical):", auditErr);
        }

        return {
            sessionId: sessionRef.id,
            ...sessionData,
            // OVERRIDE FieldValue objects with serializable values for the client
            startedAt: new Date(),
            lastActiveAt: new Date(),
        };
    } catch (error: any) {
        console.error("[startSession] Critical error:", error);
        throw new Error(error.message || "Failed to start session");
    }
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

    // Verify user is a participant or viewer
    const isParticipant = sessionData?.participants?.includes(user.id);
    const isViewer = sessionData?.type === "broadcast" && sessionData?.viewers?.includes(user.id);

    if (!isParticipant && !isViewer) {
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

// Update session heartbeat
export async function updateSessionHeartbeat(sessionId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    await adminDb.collection("active_sessions").doc(sessionId).update({
        lastActiveAt: FieldValue.serverTimestamp(),
    });
}

export async function getActiveBroadcasts() {
    const snapshot = await adminDb
        .collection("active_sessions")
        .where("type", "==", "broadcast")
        .where("status", "==", "active")
        .orderBy("startedAt", "desc")
        .limit(50)
        .get();

    const now = Date.now();
    const STALE_TIMEOUT = 30 * 1000; // 30 seconds (reduced from 2 mins)

    const validDocs: any[] = [];

    // Filter and cleanup stale sessions
    for (const doc of snapshot.docs) {
        const data = doc.data();

        // Determine last activity time
        // Use lastActiveAt if present, otherwise startedAt, otherwise assume stale
        let lastActivityTime = 0;

        if (data.lastActiveAt?.toDate) {
            lastActivityTime = data.lastActiveAt.toDate().getTime();
        } else if (data.startedAt?.toDate) {
            lastActivityTime = data.startedAt.toDate().getTime();
        } else {
            // No timestamps? Mark as stale.
            lastActivityTime = 0;
        }

        if (now - lastActivityTime > STALE_TIMEOUT) {
            // Mark as ended
            console.log(`Cleaning up stale session: ${doc.id}, inactive for ${(now - lastActivityTime) / 1000}s`);
            try {
                await adminDb.collection("active_sessions").doc(doc.id).update({
                    status: "ended",
                    endedReason: "timeout"
                });
            } catch (err) {
                console.error(`Failed to cleanup stale session ${doc.id}:`, err);
            }
            continue;
        }

        validDocs.push(doc);
    }

    const broadcasts = await Promise.all(
        validDocs.map(async (doc) => {
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

// Get active viewers for a broadcast session
export async function getSessionViewers(sessionId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const sessionDoc = await adminDb.collection("active_sessions").doc(sessionId).get();
    if (!sessionDoc.exists) throw new Error("Session not found");

    const sessionData = sessionDoc.data();
    if (sessionData?.hostId !== user.id) throw new Error("Not authorized");

    const viewerIds = sessionData?.viewers || [];

    // Get viewer profiles
    const viewers = await Promise.all(
        viewerIds.map(async (viewerId: string) => {
            const viewerDoc = await adminDb.collection("users").doc(viewerId).get();
            const viewerData = viewerDoc.data();
            return {
                id: viewerId,
                displayName: viewerData?.displayName || "Unknown User",
                imageUrl: viewerData?.imageUrl || viewerData?.profileData?.imageUrl,
            };
        })
    );

    return viewers;
}

// Kick a viewer from broadcast
export async function kickViewer(sessionId: string, viewerId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const sessionDoc = await adminDb.collection("active_sessions").doc(sessionId).get();
    if (!sessionDoc.exists) throw new Error("Session not found");

    const sessionData = sessionDoc.data();
    if (sessionData?.hostId !== user.id) throw new Error("Not authorized");

    // Remove viewer from viewers array
    await adminDb.collection("active_sessions").doc(sessionId).update({
        viewers: FieldValue.arrayRemove(viewerId),
        kickedViewers: FieldValue.arrayUnion(viewerId), // Track kicked viewers
    });

    // Send signal to viewer to disconnect
    await sendSignal(sessionId, {
        type: "kicked",
        to: viewerId,
    });

    return { success: true };
}

// Update broadcast privacy setting
export async function updateSessionPrivacy(sessionId: string, isPublic: boolean) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const sessionDoc = await adminDb.collection("active_sessions").doc(sessionId).get();
    if (!sessionDoc.exists) throw new Error("Session not found");

    const sessionData = sessionDoc.data();
    if (sessionData?.hostId !== user.id) throw new Error("Not authorized");

    await adminDb.collection("active_sessions").doc(sessionId).update({
        isPublic,
    });

    return { success: true, isPublic };
}

// Add viewer to session (called when viewer joins)
export async function addViewer(sessionId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const sessionDoc = await adminDb.collection("active_sessions").doc(sessionId).get();
    if (!sessionDoc.exists) throw new Error("Session not found");

    const sessionData = sessionDoc.data();

    // Check if viewer was kicked
    if (sessionData?.kickedViewers?.includes(user.id)) {
        throw new Error("You have been removed from this broadcast");
    }

    // Check privacy settings
    if (!sessionData?.isPublic) {
        // Family-only broadcast - check if viewer is in host's family
        const familySnapshot = await adminDb.collection("familyConnections")
            .where("users", "array-contains", user.id)
            .get();

        const isFamily = familySnapshot.docs.some((doc: any) => {
            const data = doc.data();
            return data.users?.includes(sessionData?.hostId || "");
        });

        if (!isFamily && sessionData?.hostId !== user.id) {
            throw new Error("This is a family-only broadcast");
        }
    }

    // Add viewer to viewers array
    await adminDb.collection("active_sessions").doc(sessionId).update({
        viewers: FieldValue.arrayUnion(user.id),
    });

    return { success: true };
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
