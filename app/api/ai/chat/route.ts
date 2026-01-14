/**
 * Streaming Chat API Endpoint
 * Supports Server-Sent Events for real-time streaming responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatWithAgentEnhanced } from '@/app/actions/ai-chat-enhanced';
import { AgentMode, AIModel } from '@/types/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            message,
            userId,
            conversationId,
            mode = 'general',
            model = 'gpt-4o',
            memoryEnabled = true,
        } = body;

        // Validate required fields
        if (!message || !userId || !conversationId) {
            return NextResponse.json(
                { error: 'Missing required fields: message, userId, conversationId' },
                { status: 400 }
            );
        }

        // Call enhanced chat with failover
        const result = await chatWithAgentEnhanced(
            message,
            userId,
            conversationId,
            mode as AgentMode,
            model as AIModel,
            memoryEnabled
        );

        // Return JSON response (non-streaming for now)
        // TODO: Implement streaming with SSE
        return NextResponse.json({
            response: result.response,
            model: result.model,
            responseTimeMs: result.responseTimeMs,
            failedOver: result.failedOver,
            timestamp: new Date().toISOString(),
        });
    } catch (error: unknown) {
        console.error('Error in chat API:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'An unexpected error occurred',
            },
            { status: 500 }
        );
    }
}
