"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sanitizeData } from "@/lib/serialization";

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
    const existingChat = chatsSnapshot.docs.find((chatDoc: any) => {
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

    // Notify the other user
    try {
        const { createNotification } = await import("./notifications");
        await createNotification(
            targetUserId,
            "message",
            newChatRef.id,
            { message: "Started a new conversation with you" }
        );
    } catch (error) {
        console.error("Failed to send chat notification:", error);
    }

    revalidatePath("/messages");
    return newChatRef.id;
}

export async function getChats(): Promise<ChatSession[]> {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");
    const myId = user.id;

    // Fetch chats where user is participant
    let chatsSnapshot;
    try {
        chatsSnapshot = await adminDb.collection("chats")
            .where("participants", "array-contains", myId)
            .orderBy("lastMessageAt", "desc")
            .get();
    } catch (e) {
        console.warn("Index likely missing for getChats, falling back to unordered query:", e);
        // Fallback: Fetch without ordering, then sort in memory
        chatsSnapshot = await adminDb.collection("chats")
            .where("participants", "array-contains", myId)
            .get();
    }

    if (chatsSnapshot.empty) return [];

    // Enrich with other user details
    const enrichedChats = await Promise.all(chatsSnapshot.docs.map(async (chatDoc: any) => {
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
                    displayName: userData?.displayName || "Unknown",
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

        return sanitizeData({
            id: chatDoc.id,
            name: chatData.name || null,
            isGroup: chatData.isGroup || false,
            participants: chatData.participants || [],
            otherUser,
            lastMessage,
            lastMessageAt: chatData.lastMessageAt
        });
    }));

    // Sort in memory to ensure correct order even if fallback was used
    enrichedChats.sort((a, b) => {
        const dateA = a.lastMessageAt?.toDate ? a.lastMessageAt.toDate() : new Date(0);
        const dateB = b.lastMessageAt?.toDate ? b.lastMessageAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

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
    let messagesSnapshot;
    try {
        messagesSnapshot = await adminDb.collection("chats").doc(chatId).collection("messages")
            .orderBy("createdAt", "asc")
            .limit(50)
            .get();
    } catch (e) {
        console.error("Error fetching messages:", e);
        return [];
    }

    return messagesSnapshot.docs.map((msgDoc: any) => sanitizeData({
        id: msgDoc.id,
        ...msgDoc.data(),
    })) as Message[];
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

export async function sendWelcomeMessage(targetUserId: string, targetUserDisplayName: string) {
    // 1. Find Admin User
    const adminQuery = await adminDb.collection("users")
        .where("email", "==", "chancellor@ichancetek.com")
        .limit(1)
        .get();

    if (adminQuery.empty) {
        console.error("Welcome Message Error: Admin user 'chancellor@ichancetek.com' not found.");
        return;
    }

    const adminUser = adminQuery.docs[0];
    const adminId = adminUser.id;

    if (adminId === targetUserId) return; // Don't welcome yourself if you are the admin signing up

    // 2. Check/Create Chat
    // Use adminDb directly to bypass auth checks (since we are acting as system/admin)
    const chatsSnapshot = await adminDb.collection("chats")
        .where("participants", "array-contains", targetUserId)
        .get();

    // Find existing 1-on-1 chat with Admin
    let chatDoc = chatsSnapshot.docs.find((chatDoc: any) => {
        const chatData = chatDoc.data();
        return !chatData.isGroup && chatData.participants.includes(adminId);
    });

    let chatId;
    if (chatDoc) {
        chatId = chatDoc.id;
    } else {
        const newChatRef = await adminDb.collection("chats").add({
            participants: [targetUserId, adminId],
            isGroup: false,
            lastMessageAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
        });
        chatId = newChatRef.id;
    }

    // 3. Send Message
    const welcomeText = `Welcome to the Famio Family!

Thank you for joining us — we’re excited to have you here. We hope you enjoy a wonderful experience on the Famio platform as you connect, share, and grow with the community.

These are exciting times at Famio! We’re rolling out new enhancements and updates every week to make your experience even better.

We truly appreciate you being part of the Famio Family.

Best regards,
Chancellor Minus
Founder & CEO
ChanceTEK | Famio`;

    await adminDb.collection("chats").doc(chatId).collection("messages").add({
        senderId: adminId,
        content: welcomeText,
        createdAt: FieldValue.serverTimestamp(),
    });

    await adminDb.collection("chats").doc(chatId).update({
        lastMessageAt: FieldValue.serverTimestamp(),
    });

    // Notify the user? We can try createNotification if needed, but the chat system usually handles it or the user sees it in messages.
    // Let's ensure notification exists.
    try {
        const { createNotification } = await import("./notifications");
        await createNotification(
            targetUserId,
            "message",
            chatId,
            { message: "You have a new message from Chancellor Minus" }
        );
    } catch (error) {
        console.error("Failed to send welcome notification:", error);
    }

    console.log(`Welcome message sent to ${targetUserDisplayName} (${targetUserId}) from Admin.`);
}
