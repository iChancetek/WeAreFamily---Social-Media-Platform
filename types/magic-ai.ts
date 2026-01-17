/**
 * Magic AI - User-Controlled Emotional Intelligence System
 * Type definitions for tone-based content generation
 */

export type EmotionalTone =
    | "default"
    | "enthusiastic"
    | "positive_energy"
    | "healing_energy"
    | "sad"
    | "professional"
    | "love"
    | "emotional_intelligence"
    | "grammar"
    | "shorter"
    | "longer"
    | "witty"
    | "storyteller";

export interface ToneMetadata {
    id: EmotionalTone;
    name: string;
    icon: string;
    description: string;
    color: string;
}

export interface MagicAIRequest {
    content: string;
    tone: EmotionalTone;
    context?: {
        type?: 'timeline' | 'group' | 'branding';
        name?: string; // group name or branding name
    };
}

export interface MagicAIResponse {
    enhancedContent: string;
    tone: EmotionalTone;
    originalContent: string;
    timestamp: string;
    characterCount: number;
}

export interface MagicAIState {
    originalContent: string;
    enhancedContent: string | null;
    selectedTone: EmotionalTone | null;
    isGenerating: boolean;
    isPreviewOpen: boolean;
    error: string | null;
}

export const TONE_METADATA: Record<EmotionalTone, ToneMetadata> = {
    default: {
        id: "default",
        name: "Default",
        icon: "✨",
        description: "Warm, balanced, and family-friendly",
        color: "bg-gradient-to-br from-blue-500 to-purple-500"
    },
    grammar: {
        id: "grammar",
        name: "Grammar Polish",
        icon: "📝",
        description: "Fix grammar and improve clarity",
        color: "bg-gradient-to-br from-slate-500 to-gray-500"
    },
    shorter: {
        id: "shorter",
        name: "Make Shorter",
        icon: "✂️",
        description: "Condense and summarize",
        color: "bg-gradient-to-br from-red-400 to-orange-400"
    },
    longer: {
        id: "longer",
        name: "Make Longer",
        icon: "➕",
        description: "Expand and add detail",
        color: "bg-gradient-to-br from-blue-400 to-cyan-400"
    },
    witty: {
        id: "witty",
        name: "Witty",
        icon: "😜",
        description: "Clever, humorous, and fun",
        color: "bg-gradient-to-br from-yellow-400 to-amber-500"
    },
    storyteller: {
        id: "storyteller",
        name: "Storyteller",
        icon: "📖",
        description: "Turn it into a narrative",
        color: "bg-gradient-to-br from-indigo-500 to-purple-600"
    },
    enthusiastic: {
        id: "enthusiastic",
        name: "Enthusiastic",
        icon: "🎉",
        description: "High energy and celebratory",
        color: "bg-gradient-to-br from-orange-500 to-pink-500"
    },
    positive_energy: {
        id: "positive_energy",
        name: "Positive Energy",
        icon: "⚡",
        description: "Uplifting and motivational",
        color: "bg-gradient-to-br from-yellow-500 to-orange-500"
    },
    healing_energy: {
        id: "healing_energy",
        name: "Healing Energy",
        icon: "🌿",
        description: "Gentle, compassionate, and supportive",
        color: "bg-gradient-to-br from-green-500 to-teal-500"
    },
    sad: {
        id: "sad",
        name: "Sad",
        icon: "💙",
        description: "Reflective and empathetic",
        color: "bg-gradient-to-br from-blue-600 to-indigo-600"
    },
    professional: {
        id: "professional",
        name: "Professional",
        icon: "💼",
        description: "Polished and clear",
        color: "bg-gradient-to-br from-gray-700 to-slate-700"
    },
    love: {
        id: "love",
        name: "Love",
        icon: "❤️",
        description: "Affectionate and heartfelt",
        color: "bg-gradient-to-br from-pink-500 to-rose-500"
    },
    emotional_intelligence: {
        id: "emotional_intelligence",
        name: "Emotional Intelligence",
        icon: "🧠",
        description: "Thoughtful, perceptive, and emotionally aware",
        color: "bg-gradient-to-br from-purple-600 to-violet-600"
    }
};
