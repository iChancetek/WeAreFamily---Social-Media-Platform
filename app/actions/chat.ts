"use server";

import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    arrayUnion,
    serverTimestamp,
    Timestamp
} from "firebase/firestore";
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
    const chatsQuery = query(
        collection(db, "chats"),
        where("participants", "array-contains", myId)
    );

    const chatsSnapshot = await getDocs(chatsQuery);

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
    const newChatRef = await addDoc(collection(db, "chats"), {
        participants: [myId, targetUserId],
        isGroup: false,
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
    });

    revalidatePath("/messages");
    return newChatRef.id;
}

export async function getChats(): Promise<ChatSession[]> {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");
    const myId = user.id;

    // Fetch chats where user is participant
    const chatsQuery = query(
        collection(db, "chats"),
        where("participants", "array-contains", myId),
        orderBy("lastMessageAt", "desc")
    );

    const chatsSnapshot = await getDocs(chatsQuery);

    // Enrich with other user details
    const enrichedChats = await Promise.all(chatsSnapshot.docs.map(async (chatDoc) => {
        const chatData = chatDoc.data();
        const participants = chatData.participants || [];
        const otherId = participants.find((id: string) => id !== myId);

        let otherUser: ChatUser | undefined;
        if (otherId) {
            const userDoc = await getDoc(doc(db, "users", otherId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                otherUser = {
                    id: userDoc.id,
                    email: userData.email,
                    displayName: userData.displayName || "Family Member",
                    imageUrl: userData.imageUrl || null
                };
            }
        }

        // Get last message content for preview
        const messagesQuery = query(
            collection(db, "chats", chatDoc.id, "messages"),
            orderBy("createdAt", "desc"),
            limit(1)
        );
        const lastMsgSnapshot = await getDocs(messagesQuery);
        const lastMessage = lastMsgSnapshot.empty ? "No messages yet" : lastMsgSnapshot.docs[0].data().content;

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
    const chatDoc = await getDoc(doc(db, "chats", chatId));
    if (!chatDoc.exists()) {
        throw new Error("Chat not found");
    }

    const chatData = chatDoc.data();
    if (!chatData.participants.includes(user.id)) {
        throw new Error("Access denied");
    }

    // Fetch messages
    const messagesQuery = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("createdAt", "asc"),
        limit(50)
    );

    const messagesSnapshot = await getDocs(messagesQuery);

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
    const chatDoc = await getDoc(doc(db, "chats", chatId));
    if (!chatDoc.exists()) {
        throw new Error("Chat not found");
    }

    const chatData = chatDoc.data();
    if (!chatData.participants.includes(user.id)) {
        throw new Error("Access denied");
    }

    // Add message to subcollection
    await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: user.id,
        content: content.trim(),
        createdAt: serverTimestamp(),
    });

    // Update conversation timestamp
    await updateDoc(doc(db, "chats", chatId), {
        lastMessageAt: serverTimestamp(),
    });

    revalidatePath("/messages");
    return { success: true };
}
