"use server";

import { db } from "@/db";
import { events, users } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type Event = {
    id: number;
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

    await db.insert(events).values({
        creatorId: user.id,
        title: data.title,
        description: data.description,
        date: data.date,
        location: data.location,
        attendees: [user.id], // Creator attends by default
    });

    revalidatePath("/events");
    return { success: true };
}

export async function getEvents(): Promise<Event[]> {
    const rawEvents = await db.select().from(events).orderBy(desc(events.date));

    // Allow fetching user profiles for creator and attendees
    // For efficiency, we collect all unique user IDs involved
    const allUserIds = new Set<string>();
    rawEvents.forEach(e => {
        allUserIds.add(e.creatorId);
        (e.attendees as string[] || []).forEach(a => allUserIds.add(a));
    });

    const userList = await db.select().from(users).where(inArray(users.id, Array.from(allUserIds)));
    const userMap = new Map(userList.map(u => {
        const profile = u.profileData as any;
        return [u.id, {
            displayName: u.displayName || profile?.displayName || (profile?.firstName ? `${profile.firstName} ${profile.lastName}` : "Family Member"),
            imageUrl: u.imageUrl || profile?.imageUrl || null
        }];
    }));

    return rawEvents.map(e => ({
        ...e,
        attendees: (e.attendees as string[]) || [],
        creator: userMap.get(e.creatorId),
        attendeeProfiles: (e.attendees as string[] || []).map(id => userMap.get(id)).filter(Boolean) as any[]
    }));
}

export async function joinEvent(eventId: number) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) throw new Error("Event not found");

    const currentAttendees = (event.attendees as string[]) || [];

    if (!currentAttendees.includes(user.id)) {
        await db.update(events)
            .set({ attendees: [...currentAttendees, user.id] })
            .where(eq(events.id, eventId));
    }

    revalidatePath("/events");
    return { success: true };
}

export async function leaveEvent(eventId: number) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) throw new Error("Event not found");

    const currentAttendees = (event.attendees as string[]) || [];
    const newAttendees = currentAttendees.filter(id => id !== user.id);

    await db.update(events)
        .set({ attendees: newAttendees })
        .where(eq(events.id, eventId));

    revalidatePath("/events");
    return { success: true };
}
