'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, doc, getDoc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { getUserProfile } from "@/lib/auth";
import { Event } from "@/types/events";

export async function createEvent(data: Omit<Event, 'id' | 'organizerId' | 'organizerName' | 'createdAt' | 'attendeeCount' | 'currentUserRsvp' | 'organizerImage'>) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const eventData = {
        ...data,
        organizerId: user.uid,
        organizerName: user.displayName || 'Unknown',
        organizerImage: user.photoURL,
        createdAt: new Date().toISOString(),
        attendeeCount: 1 // Organizer is attending
    };

    const docRef = await addDoc(collection(db, "events"), eventData);

    // Auto-RSVP organizer
    await setDoc(doc(db, "events", docRef.id, "attendees", user.uid), {
        status: 'going',
        timestamp: new Date().toISOString()
    });

    return { id: docRef.id, ...eventData };
}

export async function getEvents() {
    const user = await getUserProfile();
    const q = query(collection(db, "events"), orderBy("startTime", "asc"), limit(50));
    const snapshot = await getDocs(q);

    const events: Event[] = [];

    for (const d of snapshot.docs) {
        const data = d.data();
        let currentUserRsvp: 'going' | 'maybe' | 'not_going' | undefined;

        if (user) {
            const rsvpDoc = await getDoc(doc(db, "events", d.id, "attendees", user.uid));
            if (rsvpDoc.exists()) {
                currentUserRsvp = rsvpDoc.data().status;
            }
        }

        events.push({
            id: d.id,
            ...data,
            currentUserRsvp
        } as Event);
    }

    return events;
}

export async function rsvpEvent(eventId: string, status: 'going' | 'maybe' | 'not_going') {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const rsvpRef = doc(db, "events", eventId, "attendees", user.uid);
    await setDoc(rsvpRef, {
        status,
        userId: user.uid,
        userName: user.displayName,
        userImage: user.photoURL,
        timestamp: new Date().toISOString()
    });

    // Update count (simplified, ideally cloud function)
    const eventRef = doc(db, "events", eventId);
    // In a real app, use a transaction or aggregation. Simple increment for demo:
    // This is optimistically updated in UI anyway.
    return status;
}
