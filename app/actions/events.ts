"use server";

import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    query,
    orderBy,
    arrayUnion,
    arrayRemove,
    Timestamp,
    serverTimestamp
} from "firebase/firestore";
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

    await addDoc(collection(db, "events"), {
        creatorId: user.id,
        title: data.title,
        description: data.description || null,
        date: Timestamp.fromDate(data.date),
        location: data.location || null,
        attendees: [user.id], // Creator attends by default
        createdAt: serverTimestamp(),
    });

    revalidatePath("/events");
    return { success: true };
}

export async function getEvents(): Promise<Event[]> {
    const eventsQuery = query(collection(db, "events"), orderBy("date", "desc"));
    const eventsSnapshot = await getDocs(eventsQuery);

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
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            userProfiles.set(userId, {
                displayName: userData.displayName || "Family Member",
                imageUrl: userData.imageUrl || null,
            });
        }
    }));

    // Build events with enriched data
    const events = eventsSnapshot.docs.map(eventDoc => {
        const eventData = eventDoc.data();
        const attendees = eventData.attendees || [];

        return {
            id: eventDoc.id,
            title: eventData.title,
            description: eventData.description || null,
            date: eventData.date?.toDate() || new Date(),
            location: eventData.location || null,
            creatorId: eventData.creatorId,
            attendees,
            createdAt: eventData.createdAt?.toDate() || new Date(),
            creator: userProfiles.get(eventData.creatorId),
            attendeeProfiles: attendees.map((id: string) => userProfiles.get(id)).filter(Boolean),
        };
    });

    return events;
}

export async function joinEvent(eventId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const eventRef = doc(db, "events", eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) throw new Error("Event not found");

    const eventData = eventSnap.data();
    const currentAttendees = eventData.attendees || [];

    if (!currentAttendees.includes(user.id)) {
        await updateDoc(eventRef, {
            attendees: arrayUnion(user.id)
        });
    }

    revalidatePath("/events");
    return { success: true };
}

export async function leaveEvent(eventId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const eventRef = doc(db, "events", eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) throw new Error("Event not found");

    await updateDoc(eventRef, {
        attendees: arrayRemove(user.id)
    });

    revalidatePath("/events");
    return { success: true };
}
