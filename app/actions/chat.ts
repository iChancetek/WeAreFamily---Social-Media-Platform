'use server'

import { db } from "@/db"
import { chats, messages, users } from "@/db/schema"
import { getUserProfile } from "@/lib/auth"
import { asc, desc, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function sendMessage(chatId: number, content: string) {
    const user = await getUserProfile()
    if (!user || user.role === 'pending') {
        throw new Error("Unauthorized")
    }

    await db.insert(messages).values({
        chatId,
        senderId: user.id,
        content
    });

    await db.update(chats)
        .set({ lastMessageAt: new Date() })
        .where(eq(chats.id, chatId));

    revalidatePath('/messages')
}

export async function createChat(participantId: string) {
    const user = await getUserProfile()
    if (!user || user.role === 'pending') {
        throw new Error("Unauthorized")
    }

    // Check if 1:1 chat exists
    // This is hard with JSONB queries in simple ORM. 
    // We'll just create a new one for now or skip check for MVP speed.
    // Ideally: SELECT * FROM chats WHERE participants @> [user.id, participantId] AND participants <@ [user.id, participantId]

    const newChat = await db.insert(chats).values({
        participants: [user.id, participantId],
        isGroup: false,
    }).returning();

    return newChat[0].id;
}

export async function getChats() {
    const user = await getUserProfile()
    if (!user || user.role === 'pending') {
        throw new Error("Unauthorized")
    }

    // Very inefficient to fetch all, but MVP.
    // Filter in memory.
    const allChats = await db.query.chats.findMany({
        orderBy: [desc(chats.lastMessageAt)],
        with: {
            messages: {
                limit: 1,
                orderBy: [desc(messages.createdAt)]
            }
        }
    });

    return allChats.filter(chat => (chat.participants as string[])?.includes(user.id));
}

export async function getChatDetails(chatId: number) {
    const user = await getUserProfile()
    if (!user || user.role === 'pending') {
        throw new Error("Unauthorized")
    }

    // Fetch chat and messages
    const chat = await db.query.chats.findFirst({
        where: eq(chats.id, chatId),
        with: {
            messages: {
                orderBy: [asc(messages.createdAt)],
                with: {
                    sender: true
                }
            }
        }
    })

    return chat;
}
