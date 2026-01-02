"use server";

import { db } from "@/db";
import { chats, messages, users } from "@/db/schema";
import { eq, sql, desc, and, asc, inArray } from "drizzle-orm";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// --- Types ---
export type ChatUser = {
    id: string;
    displayName: string | null;
    imageUrl: string | null;
    email: string;
}

export type ChatSession = {
    id: number;
    name: string | null;
    isGroup: boolean | null;
    participants: string[] | null;
    lastMessageAt: Date | null;
    otherUser?: ChatUser; // Enriched data for FE convenience
    lastMessage?: string | null;
}

export type Message = {
    id: number;
    chatId: number;
    senderId: string;
    content: string;
    createdAt: Date;
    sender?: ChatUser;
}

// --- Actions ---

export async function checkOrCreateChat(targetUserId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");
    const myId = user.id;

    if (myId === targetUserId) throw new Error("Cannot chat with yourself");

    // 1. Check if chat already exists
    // This is a naive check. A robust one would check for exact array match.
    // For now, we'll fetch all my chats and filter in memory or use raw SQL.
    // Drizzle's arrayContains is handy if supported properly for JSONB arrays of strings.
    // Using simple approach: Fetch all chats where I am a participant.

    // Note: This query is inefficient at scale but fine for MVP.
    const allChats = await db.select().from(chats);

    const existingChat = allChats.find(c => {
        const p = c.participants as string[];
        return !c.isGroup && p.includes(myId) && p.includes(targetUserId);
    });

    if (existingChat) {
        return existingChat.id;
    }

    // 2. Create new chat
    const [newChat] = await db.insert(chats).values({
        participants: [myId, targetUserId],
        isGroup: false,
        lastMessageAt: new Date(),
    }).returning();

    revalidatePath("/messages");
    return newChat.id;
}

export async function getChats(): Promise<ChatSession[]> {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");
    const myId = user.id;

    // Fetch raw chats
    // Again, filtering in memory for MVP simplicity with JSONB array
    const allChats = await db.select().from(chats).orderBy(desc(chats.lastMessageAt));
    const myChats = allChats.filter(c => (c.participants as string[])?.includes(myId));

    // Enrich with other user details
    const enrichedChats = await Promise.all(myChats.map(async (chat) => {
        const p = chat.participants as string[];
        const otherId = p.find(id => id !== myId);

        let otherUser: ChatUser | undefined;
        if (otherId) {
            const [u] = await db.select().from(users).where(eq(users.id, otherId));
            if (u) {
                const profile = u.profileData as any;
                otherUser = {
                    id: u.id,
                    email: u.email,
                    displayName: u.displayName || (profile?.firstName ? `${profile.firstName} ${profile.lastName}` : u.email.split('@')[0]),
                    imageUrl: u.imageUrl || profile?.imageUrl || null
                };
            }
        }

        // Get last message content for preview
        const [lastMsg] = await db.select()
            .from(messages)
            .where(eq(messages.chatId, chat.id))
            .orderBy(desc(messages.createdAt))
            .limit(1);

        return {
            ...chat,
            isGroup: chat.isGroup as boolean | null,
            otherUser,
            lastMessage: lastMsg?.content || "No messages yet"
        };
    }));

    return enrichedChats;
}

export async function getMessages(chatId: number): Promise<Message[]> {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    // Verify access
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
    if (!chat || !(chat.participants as string[]).includes(user.id)) {
        throw new Error("Access denied");
    }

    const msgs = await db.select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(asc(messages.createdAt)) // Oldest first
        .limit(50); // Pagination later

    return msgs as Message[];
}

export async function sendMessage(chatId: number, content: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    if (!content.trim()) return;

    // Verify access
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
    if (!chat || !(chat.participants as string[]).includes(user.id)) {
        throw new Error("Access denied");
    }

    await db.insert(messages).values({
        chatId,
        senderId: user.id,
        content: content.trim(),
    });

    // Update conversation timestamp
    await db.update(chats)
        .set({ lastMessageAt: new Date() })
        .where(eq(chats.id, chatId));

    revalidatePath("/messages");
    return { success: true };
}
