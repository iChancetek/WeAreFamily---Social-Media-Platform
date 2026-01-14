export type AgentMode = "general" | "tutor" | "executive" | "biographer" | "architect";
export type AIModel =
    | "gpt-4o"
    | "gpt-4o-mini"
    | "o1-preview"
    | "o1-mini"
    | "claude-3-5-sonnet-20240620"
    | "gemini-1.5-pro"
    | "gemini-1.5-flash";

// Extended types for enhanced AI system

export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
    metadata?: {
        model?: string;
        tokens?: number;
        responseTime?: number;
    };
}

export interface AIContext {
    pageType?: 'home' | 'profile' | 'group' | 'branding' | 'live';
    visiblePostIds?: string[];
    currentUserId?: string;
    currentProfileId?: string;
    additionalContext?: string;
}

export interface MemorySettings {
    enabled: boolean;
    retentionDays: number;
}

export interface PerformanceMetrics {
    responseTimeMs: number;
    tokensUsed: number;
    modelUsed: string;
    cacheHit: boolean;
    timestamp: Date;
}

