"use client";

import React, { createContext, useContext, ReactNode, useCallback } from "react";
import { useVoiceConversation } from "@/hooks/use-voice-conversation";
import { chatWithAgent } from "@/app/actions/ai-agents";

interface VoiceContextType {
    state: 'idle' | 'listening' | 'processing' | 'speaking';
    isSpeaking: boolean;
    isListening: boolean;
    isContinuous: boolean;
    toggleContinuous: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {

    // Adapter to call the server action from the hook
    const handleMessage = useCallback(async (message: string) => {
        try {
            // Default to general mode, gpt-4o
            const response = await chatWithAgent(message, 'general', 'gpt-4o');
            return response || "I'm sorry, I didn't catch that.";
        } catch (error) {
            console.error("Voice Agent Error:", error);
            return "I'm having trouble connecting right now.";
        }
    }, []);

    const voice = useVoiceConversation({
        onMessage: handleMessage,
        onStateChange: (newState) => {
            // Optional: Log state changes or trigger other global effects
            // console.log("Voice State:", newState);
        }
    });

    return (
        <VoiceContext.Provider value={{
            state: voice.state,
            isSpeaking: voice.isSpeaking,
            isListening: voice.state === 'listening',
            isContinuous: voice.isContinuous,
            toggleContinuous: voice.toggleContinuous
        }}>
            {children}
        </VoiceContext.Provider>
    );
}

export function useVoice() {
    const context = useContext(VoiceContext);
    if (!context) {
        throw new Error("useVoice must be used within a VoiceProvider");
    }
    return context;
}
