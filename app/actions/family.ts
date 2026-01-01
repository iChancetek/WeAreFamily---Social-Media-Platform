'use server'

import { db } from "@/db"
import { familyRequests, users } from "@/db/schema"
import { getUserProfile } from "@/lib/auth"
import { and, eq, or, ilike, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function sendFamilyRequest(receiverId: string) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    if (user.id === receiverId) throw new Error("Cannot add yourself")

    // Check if request already exists
    const existing = await db.query.familyRequests.findFirst({
        where: or(
            and(eq(familyRequests.senderId, user.id), eq(familyRequests.receiverId, receiverId)),
            and(eq(familyRequests.senderId, receiverId), eq(familyRequests.receiverId, user.id))
        )
    })

    if (existing) {
        if (existing.status === 'rejected') {
            // Optional: Allow re-sending if rejected? For now, prevent spam.
            throw new Error("Request previously rejected")
        }
        if (existing.status === 'accepted') {
            throw new Error("Already family")
        }
        throw new Error("Request already pending")
    }

    await db.insert(familyRequests).values({
        senderId: user.id,
        receiverId: receiverId,
        status: 'pending'
    })

    revalidatePath(`/u/${receiverId}`)
    revalidatePath('/family')
}

export async function acceptFamilyRequest(requestId: number) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    const request = await db.query.familyRequests.findFirst({
        where: eq(familyRequests.id, requestId)
    })

    if (!request || request.receiverId !== user.id) {
        throw new Error("Invalid request")
    }

    await db.update(familyRequests)
        .set({ status: 'accepted' })
        .where(eq(familyRequests.id, requestId))

    revalidatePath('/family')
    revalidatePath(`/u/${request.senderId}`)
}

export async function denyFamilyRequest(requestId: number) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    const request = await db.query.familyRequests.findFirst({
        where: eq(familyRequests.id, requestId)
    })

    if (!request || request.receiverId !== user.id) {
        throw new Error("Invalid request")
    }

    await db.update(familyRequests)
        .set({ status: 'rejected' })
        .where(eq(familyRequests.id, requestId))

    // Alternatively, delete the request:
    // await db.delete(familyRequests).where(eq(familyRequests.id, requestId))

    revalidatePath('/family')
}

export async function cancelFamilyRequest(requestId: number) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    const request = await db.query.familyRequests.findFirst({
        where: eq(familyRequests.id, requestId)
    })

    if (!request || request.senderId !== user.id) {
        throw new Error("Invalid request")
    }

    await db.delete(familyRequests).where(eq(familyRequests.id, requestId))

    revalidatePath('/family')
    revalidatePath(`/u/${request.receiverId}`)
}

export type FamilyStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'self';

export async function getFamilyStatus(targetUserId: string): Promise<{ status: FamilyStatus, requestId?: number }> {
    const user = await getUserProfile()
    if (!user) return { status: 'none' }
    if (user.id === targetUserId) return { status: 'self' }

    const request = await db.query.familyRequests.findFirst({
        where: or(
            and(eq(familyRequests.senderId, user.id), eq(familyRequests.receiverId, targetUserId)),
            and(eq(familyRequests.senderId, targetUserId), eq(familyRequests.receiverId, user.id))
        )
    })

    if (!request) return { status: 'none' }
    if (request.status === 'accepted') return { status: 'accepted', requestId: request.id }
    if (request.status === 'rejected') return { status: 'none' } // Treat rejected as none for privacy/simplicity

    if (request.senderId === user.id) return { status: 'pending_sent', requestId: request.id }
    return { status: 'pending_received', requestId: request.id }
}

export async function searchUsers(query: string) {
    const user = await getUserProfile()
    if (!user) return []
    if (!query || query.length < 2) return []

    // Find users matching query, excluding self
    const matches = await db.select().from(users).where(
        and(
            ne(users.id, user.id),
            or(
                ilike(users.email, `%${query}%`),
                ilike(users.displayName, `%${query}%`) // Assuming displayName added
            )
        )
    ).limit(10)

    // Enhance matches with family status
    const results = await Promise.all(matches.map(async (match) => {
        const { status } = await getFamilyStatus(match.id)
        return { ...match, familyStatus: status }
    }))

    return results
}

export async function getFamilyMembers(userId?: string) {
    const targetId = userId || (await getUserProfile())?.id
    if (!targetId) return []

    const requests = await db.query.familyRequests.findMany({
        where: and(
            eq(familyRequests.status, 'accepted'),
            or(eq(familyRequests.senderId, targetId), eq(familyRequests.receiverId, targetId))
        ),
        with: {
            sender: true,
            receiver: true
        }
    })

    return requests.map(req => {
        return req.senderId === targetId ? req.receiver : req.sender
    })
}

export async function getPendingRequests() {
    const user = await getUserProfile()
    if (!user) return { incoming: [], sent: [] }

    const incoming = await db.query.familyRequests.findMany({
        where: and(
            eq(familyRequests.receiverId, user.id),
            eq(familyRequests.status, 'pending')
        ),
        with: { sender: true }
    })

    const sent = await db.query.familyRequests.findMany({
        where: and(
            eq(familyRequests.senderId, user.id),
            eq(familyRequests.status, 'pending')
        ),
        with: { receiver: true }
    })

    return { incoming, sent }
}
