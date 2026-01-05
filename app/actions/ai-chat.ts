"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getUserProfile } from "@/lib/auth";
import { AgentMode } from "@/app/actions/ai-agents";

export interface AIConversation {
    id: string;
    userId: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    lastMessage?: string;
    mode?: AgentMode;
}

export interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
}

/**
 * Create a new conversation
 */
export async function createConversation(initialMessage?: string, mode: AgentMode = 'general'): Promise<string> {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const title = initialMessage ? initialMessage.slice(0, 50) + (initialMessage.length > 50 ? "..." : "") : "New Conversation";

    const docRef = await adminDb.collection("ai_conversations").add({
        userId: user.id,
        title,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        isDeleted: false,
        lastMessage: initialMessage || "",
        mode
    });

    return docRef.id;
}

/**
 * Get active conversations for the current user
 */
export async function getConversations(): Promise<AIConversation[]> {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const snapshot = await adminDb.collection("ai_conversations")
        .where("userId", "==", user.id)
        .where("isDeleted", "==", false)
        .orderBy("updatedAt", "desc")
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as AIConversation[];
}

/**
 * Get trashed conversations for recovery
 */
export async function getTrash(): Promise<AIConversation[]> {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const snapshot = await adminDb.collection("ai_conversations")
        .where("userId", "==", user.id)
        .where("isDeleted", "==", true)
        .orderBy("updatedAt", "desc")
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as AIConversation[];
}

/**
 * Save a message to a conversation
 */
export async function saveMessage(conversationId: string, role: 'user' | 'assistant', content: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    // Verify ownership
    const convRef = adminDb.collection("ai_conversations").doc(conversationId);
    const conv = await convRef.get();

    if (!conv.exists || conv.data()?.userId !== user.id) {
        throw new Error("Conversation not found or unauthorized");
    }

    // Add message to subcollection
    await convRef.collection("messages").add({
        role,
        content,
        createdAt: FieldValue.serverTimestamp()
    });

    // Update conversation metadata
    await convRef.update({
        updatedAt: FieldValue.serverTimestamp(),
        lastMessage: content.slice(0, 100)
    });
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string): Promise<AIMessage[]> {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const convRef = adminDb.collection("ai_conversations").doc(conversationId);
    const conv = await convRef.get();

    if (!conv.exists || conv.data()?.userId !== user.id) {
        throw new Error("Conversation not found or unauthorized");
    }

    const snapshot = await convRef.collection("messages")
        .orderBy("createdAt", "asc")
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        role: doc.data().role,
        content: doc.data().content,
        createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
}

/**
 * Soft delete (move to trash)
 */
export async function softDeleteConversation(conversationId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const convRef = adminDb.collection("ai_conversations").doc(conversationId);
    const conv = await convRef.get();

    if (!conv.exists || conv.data()?.userId !== user.id) {
        throw new Error("Conversation not found or unauthorized");
    }

    await convRef.update({
        isDeleted: true,
        updatedAt: FieldValue.serverTimestamp()
    });
}

/**
 * Restore from trash
 */
export async function restoreConversation(conversationId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const convRef = adminDb.collection("ai_conversations").doc(conversationId);
    const conv = await convRef.get();

    if (!conv.exists || conv.data()?.userId !== user.id) {
        throw new Error("Conversation not found or unauthorized");
    }

    await convRef.update({
        isDeleted: false,
        updatedAt: FieldValue.serverTimestamp()
    });
}

/**
 * Permanently delete
 */
export async function permanentlyDeleteConversation(conversationId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const convRef = adminDb.collection("ai_conversations").doc(conversationId);
    const conv = await convRef.get();

    if (!conv.exists || conv.data()?.userId !== user.id) {
        throw new Error("Conversation not found or unauthorized");
    }

    // Delete subcollection messages (batch delete)
    const messages = await convRef.collection("messages").get();
    const batch = adminDb.batch();

    messages.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    batch.delete(convRef);
    await batch.commit();
}
