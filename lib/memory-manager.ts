/**
 * Memory Manager
 * Handles conversation persistence, short-term and long-term memory
 */

import { adminDb } from '@/lib/firebase-admin';
import { upsertVectors, queryVectors, deleteNamespace } from '@/lib/vector-db';
import { nanoid } from 'nanoid';

export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: {
        model?: string;
        tokens?: number;
        responseTime?: number;
    };
}

export interface ConversationData {
    conversationId: string;
    userId: string;
    messages: ConversationMessage[];
    metadata: {
        mode: string;
        startedAt: Date;
        lastMessageAt: Date;
        title?: string;
    };
    memoryEnabled: boolean;
}

export interface MemorySettings {
    enabled: boolean;
    retentionDays: number;
}

/**
 * Generate a new conversation ID
 */
export function generateConversationId(): string {
    return nanoid(16);
}

/**
 * Get conversation history for a user
 */
export async function getConversationHistory(
    userId: string,
    conversationId: string,
    limit: number = 50
): Promise<ConversationMessage[]> {
    try {
        const docRef = adminDb
            .collection('ai_conversations')
            .doc(`${userId}_${conversationId}`);

        const doc = await docRef.get();

        if (!doc.exists) {
            return [];
        }

        const data = doc.data() as ConversationData;
        const messages = data.messages || [];

        // Return most recent messages up to limit
        return messages.slice(-limit);
    } catch (error) {
        console.error('Error fetching conversation history:', error);
        return [];
    }
}

/**
 * Save a message to conversation history
 */
export async function saveMessage(
    userId: string,
    conversationId: string,
    message: ConversationMessage,
    mode: string = 'general',
    memoryEnabled: boolean = true
): Promise<void> {
    try {
        const docRef = adminDb
            .collection('ai_conversations')
            .doc(`${userId}_${conversationId}`);

        const doc = await docRef.get();
        const now = new Date();

        if (!doc.exists) {
            // Create new conversation
            const newConversation: ConversationData = {
                conversationId,
                userId,
                messages: [message],
                metadata: {
                    mode,
                    startedAt: now,
                    lastMessageAt: now,
                },
                memoryEnabled,
            };

            await docRef.set(newConversation);
        } else {
            // Append to existing conversation
            await docRef.update({
                messages: [...(doc.data()?.messages || []), message],
                'metadata.lastMessageAt': now,
                memoryEnabled,
            });
        }

        console.log(`💾 Message saved to conversation ${conversationId}`);
    } catch (error) {
        console.error('Error saving message:', error);
        throw error;
    }
}

/**
 * Summarize a conversation for embedding
 * Creates a concise summary suitable for vector search
 */
export async function summarizeConversation(
    messages: ConversationMessage[]
): Promise<string> {
    // Simple summarization: extract key user queries and assistant responses
    const userQueries = messages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .slice(0, 3); // First 3 user messages

    const topics = userQueries.join(' | ');
    return `Conversation topics: ${topics}`;
}

/**
 * Get relevant past conversations using vector search
 */
export async function getRelevantMemories(
    userId: string,
    queryEmbedding: number[],
    topK: number = 3
): Promise<QueryResult[]> {
    try {
        // Query the conversations namespace filtered by userId
        const results = await queryVectors(
            'conversations',
            queryEmbedding,
            topK,
            { userId },
            0.75 // Higher threshold for conversations
        );

        return results;
    } catch (error) {
        console.error('Error fetching relevant memories:', error);
        return [];
    }
}

/**
 * Index a conversation for future retrieval
 * Called after conversation ends or periodically
 */
export async function indexConversation(
    userId: string,
    conversationId: string,
    embedding: number[]
): Promise<void> {
    try {
        const docRef = adminDb
            .collection('ai_conversations')
            .doc(`${userId}_${conversationId}`);

        const doc = await docRef.get();
        if (!doc.exists) {
            throw new Error('Conversation not found');
        }

        const data = doc.data() as ConversationData;
        const summary = await summarizeConversation(data.messages);

        // Upsert to vector DB
        await upsertVectors('conversations', [
            {
                id: `${userId}_${conversationId}`,
                values: embedding,
                metadata: {
                    userId,
                    content: summary,
                    createdAt: data.metadata.startedAt.toISOString(),
                    mode: data.metadata.mode,
                    messageCount: data.messages.length,
                },
            },
        ]);

        console.log(`📇 Conversation indexed: ${conversationId}`);
    } catch (error) {
        console.error('Error indexing conversation:', error);
        throw error;
    }
}

/**
 * Reset all memory for a user (GDPR compliance)
 */
export async function resetUserMemory(userId: string): Promise<void> {
    try {
        console.log(`🗑️ Resetting memory for user: ${userId}`);

        // Delete from Firestore
        const conversationsRef = adminDb.collection('ai_conversations');
        const snapshot = await conversationsRef
            .where('userId', '==', userId)
            .get();

        const batch = adminDb.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Delete from vector DB
        await deleteNamespace('conversations', { userId });

        console.log(`✅ Memory reset completed for user: ${userId}`);
    } catch (error) {
        console.error('Error resetting user memory:', error);
        throw error;
    }
}

/**
 * Get user's memory settings
 */
export async function getUserMemorySettings(
    userId: string
): Promise<MemorySettings> {
    try {
        const docRef = adminDb.collection('user_settings').doc(userId);
        const doc = await docRef.get();

        if (!doc.exists) {
            // Default settings
            return {
                enabled: true,
                retentionDays: 90,
            };
        }

        const aiSettings = doc.data()?.aiMemory;
        return {
            enabled: aiSettings?.enabled ?? true,
            retentionDays: aiSettings?.retentionDays ?? 90,
        };
    } catch (error) {
        console.error('Error fetching memory settings:', error);
        return { enabled: true, retentionDays: 90 };
    }
}

/**
 * Update user's memory settings
 */
export async function updateMemorySettings(
    userId: string,
    settings: Partial<MemorySettings>
): Promise<void> {
    try {
        const docRef = adminDb.collection('user_settings').doc(userId);
        await docRef.set(
            {
                aiMemory: settings,
                updatedAt: new Date(),
            },
            { merge: true }
        );

        console.log(`⚙️ Memory settings updated for user: ${userId}`);
    } catch (error) {
        console.error('Error updating memory settings:', error);
        throw error;
    }
}

/**
 * Clean up old conversations based on retention policy
 */
export async function cleanupOldConversations(
    userId: string,
    retentionDays: number = 90
): Promise<number> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const conversationsRef = adminDb.collection('ai_conversations');
        const snapshot = await conversationsRef
            .where('userId', '==', userId)
            .where('metadata.lastMessageAt', '<', cutoffDate)
            .get();

        const batch = adminDb.batch();
        const conversationIds: string[] = [];

        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
            conversationIds.push(doc.data().conversationId);
        });

        await batch.commit();

        // Also delete from vector DB
        if (conversationIds.length > 0) {
            const vectorIds = conversationIds.map(id => `${userId}_${id}`);
            await deleteNamespace('conversations', { userId });
        }

        console.log(`🧹 Cleaned up ${conversationIds.length} old conversations`);
        return conversationIds.length;
    } catch (error) {
        console.error('Error cleaning up old conversations:', error);
        return 0;
    }
}

// Type export for QueryResult from vector-db
interface QueryResult {
    id: string;
    score: number;
    metadata: {
        title?: string;
        content: string;
        userId?: string;
        createdAt: string;
        [key: string]: any;
    };
}
