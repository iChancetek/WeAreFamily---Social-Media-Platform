"use client";

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { generateMagicContent } from '@/app/actions/ai-agents';
import type { EmotionalTone, MagicAIState, MagicAIRequest } from '@/types/magic-ai';

interface UseMagicAIOptions {
    context?: {
        type?: 'timeline' | 'group' | 'branding';
        name?: string;
    };
}

export function useMagicAI(options?: UseMagicAIOptions) {
    const [state, setState] = useState<MagicAIState>({
        originalContent: '',
        enhancedContent: null,
        selectedTone: null,
        isGenerating: false,
        isPreviewOpen: false,
        error: null
    });

    // Open Magic AI with user's current content
    const openMagic = useCallback((content: string) => {
        if (!content.trim()) {
            toast.error("Please type something first!");
            return false;
        }

        setState(prev => ({
            ...prev,
            originalContent: content,
            isPreviewOpen: true,
            error: null
        }));

        return true;
    }, []);

    // Generate preview with selected tone
    const generatePreview = useCallback(async (tone: EmotionalTone) => {
        setState(prev => ({ ...prev, isGenerating: true, selectedTone: tone, error: null }));

        try {
            const request: MagicAIRequest = {
                content: state.originalContent,
                tone,
                context: options?.context
            };

            const response = await generateMagicContent(request);

            setState(prev => ({
                ...prev,
                enhancedContent: response.enhancedContent,
                isGenerating: false
            }));

            toast.success(`✨ ${tone.replace('_', ' ')} tone applied!`);
        } catch (error) {
            console.error('Magic AI error:', error);
            setState(prev => ({
                ...prev,
                isGenerating: false,
                error: error instanceof Error ? error.message : 'Generation failed'
            }));
            toast.error("Magic AI failed. Please try again.");
        }
    }, [state.originalContent, options?.context]);

    // Accept enhanced content
    const acceptEnhanced = useCallback(() => {
        if (!state.enhancedContent) return null;

        setState(prev => ({
            ...prev,
            isPreviewOpen: false
        }));

        return state.enhancedContent;
    }, [state.enhancedContent]);

    // Revert to original content
    const revertToOriginal = useCallback(() => {
        setState(prev => ({
            ...prev,
            enhancedContent: null,
            selectedTone: null,
            isPreviewOpen: false
        }));

        toast.info("Reverted to original text");
        return state.originalContent;
    }, [state.originalContent]);

    // Close preview without accepting
    const closePreview = useCallback(() => {
        setState(prev => ({
            ...prev,
            isPreviewOpen: false,
            enhancedContent: null,
            selectedTone: null
        }));
    }, []);

    // Reset entire state
    const reset = useCallback(() => {
        setState({
            originalContent: '',
            enhancedContent: null,
            selectedTone: null,
            isGenerating: false,
            isPreviewOpen: false,
            error: null
        });
    }, []);

    return {
        ...state,
        openMagic,
        generatePreview,
        acceptEnhanced,
        revertToOriginal,
        closePreview,
        reset
    };
}
