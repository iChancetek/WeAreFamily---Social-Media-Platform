"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
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
    id: string;
    name: string | null;
    isGroup: boolean | null;
    participants: string[];
    lastMessageAt: Date | null;
    otherUser?: ChatUser; // Enriched data for FE convenience
    lastMessage?: string | null;
}

export type Message = {
    id: string;
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

    // Check if chat already exists between these two users
    // Note: Firestore Admin SDK doesn't support array-contains for multiple fields easily in one query if restricted
    // But basic array-contains works.
    const chatsSnapshot = await adminDb.collection("chats")
        .where("participants", "array-contains", myId)
        .get();

    // Find existing 1-on-1 chat
    const existingChat = chatsSnapshot.docs.find(chatDoc => {
        const chatData = chatDoc.data();
        return !chatData.isGroup &&
            chatData.participants.includes(targetUserId);
    });

    if (existingChat) {
        return existingChat.id;
    }

    // Create new chat
    const newChatRef = await adminDb.collection("chats").add({
        participants: [myId, targetUserId],
        isGroup: false,
        lastMessageAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
    });

    revalidatePath("/messages");
    return newChatRef.id;
}

export async function getChats(): Promise<ChatSession[]> {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");
    const myId = user.id;

    // Fetch chats where user is participant
    const chatsSnapshot = await adminDb.collection("chats")
        .where("participants", "array-contains", myId)
        .orderBy("lastMessageAt", "desc")
        .get();

    // Enrich with other user details
    const enrichedChats = await Promise.all(chatsSnapshot.docs.map(async (chatDoc) => {
        const chatData = chatDoc.data();
        const participants = chatData.participants || [];
        const otherId = participants.find((id: string) => id !== myId);

        let otherUser: ChatUser | undefined;
        if (otherId) {
            const userDoc = await adminDb.collection("users").doc(otherId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                otherUser = {
                    id: userDoc.id,
                    email: userData?.email,
                    displayName: userData?.displayName || "Family Member",
                    imageUrl: userData?.imageUrl || null
                };
            }
        }

        // Get last message content for preview
        const messagesSnapshot = await adminDb.collection("chats").doc(chatDoc.id).collection("messages")
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        const lastMessage = messagesSnapshot.empty ? "No messages yet" : messagesSnapshot.docs[0].data().content;

        return {
            id: chatDoc.id,
            name: chatData.name || null,
            isGroup: chatData.isGroup || false,
            participants: chatData.participants || [],
            lastMessageAt: chatData.lastMessageAt?.toDate() || null,
            otherUser,
            lastMessage,
        };
    }));

    return enrichedChats;
}

export async function getMessages(chatId: string): Promise<Message[]> {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    // Verify access
    const chatDoc = await adminDb.collection("chats").doc(chatId).get();
    if (!chatDoc.exists) {
        throw new Error("Chat not found");
    }

    const chatData = chatDoc.data();
    if (!chatData?.participants.includes(user.id)) {
        throw new Error("Access denied");
    }

    // Fetch messages
    const messagesSnapshot = await adminDb.collection("chats").doc(chatId).collection("messages")
        .orderBy("createdAt", "asc")
        .limit(50)
        .get();

    const messages = messagesSnapshot.docs.map(msgDoc => ({
        id: msgDoc.id,
        ...msgDoc.data(),
        createdAt: msgDoc.data().createdAt?.toDate() || new Date(),
    })) as Message[];

    return messages;
}

export async function sendMessage(chatId: string, content: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    if (!content.trim()) return;

    // Verify access
    const chatRef = adminDb.collection("chats").doc(chatId);
    const chatDoc = await chatRef.get();
    if (!chatDoc.exists) {
        throw new Error("Chat not found");
    }

    const chatData = chatDoc.data();
    if (!chatData?.participants.includes(user.id)) {
        throw new Error("Access denied");
    }

    // Add message to subcollection
    await chatRef.collection("messages").add({
        senderId: user.id,
        content: content.trim(),
        createdAt: FieldValue.serverTimestamp(),
    });

    // Update conversation timestamp
    await chatRef.update({
        lastMessageAt: FieldValue.serverTimestamp(),
    });

    revalidatePath("/messages");
    return { success: true };
}
