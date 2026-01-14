/**
 * Enhanced AI Chat Hook
 * Manages conversation state, memory, and API interactions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConversationMessage } from '@/types/ai';
import { nanoid } from 'nanoid';

interface UseChatOptions {
    userId: string;
    initialConversationId?: string;
    memoryEnabled?: boolean;
    mode?: string;
    model?: string;
}

interface ChatState {
    messages: ConversationMessage[];
    isLoading: boolean;
    error: string | null;
    conversationId: string;
}

export function useChat(options: UseChatOptions) {
    const {
        userId,
        initialConversationId,
        memoryEnabled = true,
        mode = 'general',
        model = 'gpt-4o',
    } = options;

    const [conversationId] = useState(() => initialConversationId || nanoid(16));
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load conversation history from localStorage on mount
    useEffect(() => {
        if (!memoryEnabled) return;

        try {
            const stored = localStorage.getItem(`conv_${conversationId}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                setMessages(parsed.messages || []);
            }
        } catch (err) {
            console.error('Failed to load conversation:', err);
        }
    }, [conversationId, memoryEnabled]);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        if (!memoryEnabled || messages.length === 0) return;

        try {
            localStorage.setItem(
                `conv_${conversationId}`,
                JSON.stringify({
                    messages,
                    updatedAt: new Date().toISOString(),
                })
            );
        } catch (err) {
            console.error('Failed to save conversation:', err);
        }
    }, [messages, conversationId, memoryEnabled]);

    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim() || isLoading) return;

            const userMessage: ConversationMessage = {
                role: 'user',
                content,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: content,
                        userId,
                        conversationId,
                        mode,
                        model,
                        memoryEnabled,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.statusText}`);
                }

                const data = await response.json();

                const assistantMessage: ConversationMessage = {
                    role: 'assistant',
                    content: data.response,
                    timestamp: new Date(),
                    metadata: {
                        model: data.model,
                        responseTime: data.responseTimeMs,
                    },
                };

                setMessages((prev) => [...prev, assistantMessage]);
            } catch (err: any) {
                console.error('Chat error:', err);
                setError(err.message || 'Failed to send message');

                // Remove the user message if the request failed
                setMessages((prev) => prev.slice(0, -1));
            } finally {
                setIsLoading(false);
            }
        },
        [userId, conversationId, mode, model, memoryEnabled, isLoading]
    );

    const clearHistory = useCallback(() => {
        setMessages([]);
        try {
            localStorage.removeItem(`conv_${conversationId}`);
        } catch (err) {
            console.error('Failed to clear history:', err);
        }
    }, [conversationId]);

    const resetConversation = useCallback(() => {
        clearHistory();
        // Optionally, you could generate a new conversation ID here
    }, [clearHistory]);

    return {
        messages,
        isLoading,
        error,
        conversationId,
        sendMessage,
        clearHistory,
        resetConversation,
    };
}
