/**
 * Enhanced Chat with Agent - With LLM Failover, Memory, and Streaming Support
 */

'use server';

import { AgentMode, AIModel, ConversationMessage } from '@/types/ai';
import {
    getConversationHistory,
    saveMessage
} from '@/lib/memory-manager';
import { chatWithAgent as originalChatWithAgent } from './ai-agents';

// Tavily search function (from ai-agents.ts)
async function searchTavily(query: string) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
        console.warn('Tavily API Key missing');
        return 'Search functionality is currently unavailable (Missing API Key).';
    }

    try {
        console.log(`🔍 Performing Tavily Search for: "${query}"`);
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                search_depth: 'basic',
                include_answer: true,
                max_results: 5,
                include_images: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Tavily API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const results =
            data.results
                ?.map((r: any) => `[${r.title}](${r.url}): ${r.content}`)
                .join('\n\n') || '';
        const answer = data.answer ? `Direct Answer: ${data.answer}\n\n` : '';

        return `${answer}Search Results:\n${results}`.trim() || 'No relevant results found.';
    } catch (error: unknown) {
        console.error('Tavily Search Error:', error);
        return 'An error occurred while searching the internet.';
    }
}

/**
 * Enhanced chat function with automatic LLM failover
 */
export async function chatWithAgentEnhanced(
    userMessage: string,
    userId: string,
    conversationId: string,
    mode: AgentMode = 'general',
    model: AIModel = 'gpt-4o',
    memoryEnabled: boolean = true
): Promise<{
    response: string;
    model: string;
    responseTimeMs: number;
    failedOver: boolean;
}> {
    const startTime = Date.now();
    const timeout = Number(process.env.AI_RESPONSE_TIMEOUT_MS) || 8000;
    let failedOver = false;
    let actualModel = model;

    try {
        // 1. Get conversation history if memory enabled
        let previousMessages: ConversationMessage[] = [];
        if (memoryEnabled) {
            previousMessages = await getConversationHistory(userId, conversationId, 10);
        }

        // 2. Try primary model (OpenAI)
        let response: string;
        try {
            const timeoutPromise = new Promise<string>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), timeout)
            );

            const chatPromise = originalChatWithAgent(
                userMessage,
                mode,
                model,
                [],
                previousMessages
                    .filter((m) => m.role === 'user' || m.role === 'assistant')
                    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
            );

            const result = await Promise.race([chatPromise, timeoutPromise]);
            response = result || 'I apologize, but I was unable to generate a response.';
        } catch (primaryError: unknown) {
            // Check if error is timeout or API failure
            if (
                primaryError instanceof Error && (
                    primaryError.message === 'Timeout' ||
                    (primaryError as Error & { status?: number; code?: string }).status === 429 ||
                    (primaryError as Error & { code?: string }).code === 'rate_limit_exceeded' ||
                    (primaryError as Error & { code?: string }).code === 'server_error'
                )
            ) {
                console.warn(`⚠️ Primary model failed (${model}), failing over to Claude...`);
                failedOver = true;
                actualModel = 'claude-3-5-sonnet-20240620';

                // Failover to Claude
                const fallbackResult = await originalChatWithAgent(
                    userMessage,
                    mode,
                    actualModel as AIModel,
                    [],
                    previousMessages
                        .filter((m) => m.role === 'user' || m.role === 'assistant')
                        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
                );
                response = fallbackResult || 'I apologize, but I was unable to generate a response.';
            } else {
                throw primaryError;
            }
        }

        // 3. Save messages to memory
        if (memoryEnabled) {
            await saveMessage(
                userId,
                conversationId,
                {
                    role: 'user',
                    content: userMessage,
                    timestamp: new Date(),
                },
                mode,
                memoryEnabled
            );

            await saveMessage(
                userId,
                conversationId,
                {
                    role: 'assistant',
                    content: response,
                    timestamp: new Date(),
                    metadata: {
                        model: actualModel,
                        responseTime: Date.now() - startTime,
                    },
                },
                mode,
                memoryEnabled
            );
        }

        const responseTimeMs = Date.now() - startTime;
        console.log(
            `✅ Response generated in ${responseTimeMs}ms using ${actualModel}${failedOver ? ' (failover)' : ''}`
        );

        return {
            response,
            model: actualModel,
            responseTimeMs,
            failedOver,
        };
    } catch (error: unknown) {
        console.error('Error in chatWithAgentEnhanced:', error);
        throw error;
    }
}

/**
 * Generate a conversation title from the first user message
 */
export async function generateConversationTitle(
    firstMessage: string
): Promise<string> {
    // Simple extraction: take first 50 chars or first sentence
    const title = firstMessage
        .split(/[.!?]/)[0]
        .trim()
        .substring(0, 50);
    return title + (firstMessage.length > 50 ? '...' : '');
}
