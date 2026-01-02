"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type Event = {
    id: string;
    title: string;
    description: string | null;
    date: Date;
    location: string | null;
    creatorId: string;
    attendees: string[]; // User IDs
    createdAt: Date;
    creator?: {
        displayName: string | null;
        imageUrl: string | null;
    };
    attendeeProfiles?: {
        displayName: string | null;
        imageUrl: string | null;
    }[];
}

export type EventForm = {
    title: string;
    description?: string;
    date: Date;
    location?: string;
}

export async function createEvent(data: EventForm) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    await adminDb.collection("events").add({
        creatorId: user.id,
        title: data.title,
        description: data.description || null,
        date: Timestamp.fromDate(data.date),
        location: data.location || null,
        attendees: [user.id], // Creator attends by default
        createdAt: FieldValue.serverTimestamp(),
    });

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("event.create", {
        targetType: "event",
        targetId: docRef.id, // Need to capture docRef from add()
        details: { title: data.title }
    });

    revalidatePath("/events");
    return { success: true };
}

export async function getEvents(): Promise<Event[]> {
    try {
        const eventsSnapshot = await adminDb.collection("events").orderBy("date", "desc").get();

        // Collect all unique user IDs
        const allUserIds = new Set<string>();
        eventsSnapshot.docs.forEach(eventDoc => {
            const eventData = eventDoc.data();
            allUserIds.add(eventData.creatorId);
            (eventData.attendees || []).forEach((id: string) => allUserIds.add(id));
        });

        // Fetch all user profiles
        const userProfiles = new Map();
        await Promise.all(Array.from(allUserIds).map(async (userId) => {
            const userDoc = await adminDb.collection("users").doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                userProfiles.set(userId, {
                    displayName: userData?.displayName || "Family Member",
                    imageUrl: userData?.imageUrl || null,
                });
            }
        }));

        // Build events with enriched data
        const events = eventsSnapshot.docs.map(eventDoc => {
            const eventData = eventDoc.data();
            const attendees = eventData.attendees || [];

            // Serialize creator
            const creator = userProfiles.get(eventData.creatorId) ? {
                ...userProfiles.get(eventData.creatorId)
            } : null;

            return {
                id: eventDoc.id,
                title: eventData.title,
                description: eventData.description || null,
                date: eventData.date?.toDate ? eventData.date.toDate() : new Date(eventData.date || Date.now()),
                location: eventData.location || null,
                creatorId: eventData.creatorId,
                attendees,
                createdAt: eventData.createdAt?.toDate ? eventData.createdAt.toDate() : new Date(eventData.createdAt || Date.now()),
                creator: creator,
                attendeeProfiles: attendees.map((id: string) => userProfiles.get(id)).filter(Boolean),
            };
        });

        return events;
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}

export async function joinEvent(eventId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const eventRef = adminDb.collection("events").doc(eventId);
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) throw new Error("Event not found");

    const eventData = eventSnap.data();
    const currentAttendees = eventData?.attendees || [];

    if (!currentAttendees.includes(user.id)) {
        await eventRef.update({
            attendees: FieldValue.arrayUnion(user.id)
        });
    }

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("event.join", {
        targetType: "event",
        targetId: eventId
    });

    revalidatePath("/events");
    return { success: true };
}

export async function leaveEvent(eventId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const eventRef = adminDb.collection("events").doc(eventId);
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) throw new Error("Event not found");

    await eventRef.update({
        attendees: FieldValue.arrayRemove(user.id)
    });

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("event.leave", {
        targetType: "event",
        targetId: eventId
    });

    revalidatePath("/events");
    return { success: true };
}
