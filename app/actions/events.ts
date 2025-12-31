'use server'

import { db } from "@/db"
import { events } from "@/db/schema"
import { getUserProfile } from "@/lib/auth"
import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function createEvent(data: { title: string, description?: string, date: Date, location?: string }) {
    const user = await getUserProfile()
    if (!user || user.role === 'pending') {
        throw new Error("Unauthorized")
    }

    await db.insert(events).values({
        creatorId: user.id,
        title: data.title,
        description: data.description,
        date: data.date,
        location: data.location,
        attendees: [user.id], // Creator attends by default
    })

    revalidatePath('/events')
}

export async function joinEvent(eventId: number) {
    const user = await getUserProfile()
    if (!user || user.role === 'pending') {
        throw new Error("Unauthorized")
    }

    // This is a bit tricky with JSON arrays in simplistic SQL. 
    // Ideally we'd have a separate table for attendees, but schema says jsonb array.
    // Drizzle with Postgres can update jsonb content but it's raw SQL often.
    // For simplicity, fetch, update, save. (Concurrency warning: simplistic)

    // Better: separate table `event_attendees`? 
    // Prompt Implementation Plan kept it simple. I'll stick to JSONB for now but use a read-modify-write (optimistic ignored for now).
    // Or I can just append if postgres allows easily. 
    // Let's use a simpler approach: Read, Check, Write.

    const event = await db.query.events.findFirst({
        where: eq(events.id, eventId)
    });

    if (!event) throw new Error("Event not found");

    const currentAttendees = event.attendees || [];
    if (currentAttendees.includes(user.id)) return; // Already joined

    await db.update(events)
        .set({ attendees: [...currentAttendees, user.id] })
        .where(eq(events.id, eventId));

    revalidatePath('/events');
}

export async function getEvents() {
    const user = await getUserProfile()
    if (!user || user.role === 'pending') {
        throw new Error("Unauthorized")
    }

    return await db.query.events.findMany({
        orderBy: [desc(events.date)]
    });
}
