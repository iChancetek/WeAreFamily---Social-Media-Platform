"use client";

import { useState, useCallback, useEffect, useRef } from 'react';

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

interface UseTextToSpeechOptions {
    useOpenAI?: boolean; // Use OpenAI TTS for premium quality
    voice?: TTSVoice;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
    const {
        useOpenAI = true, // Default to OpenAI for best quality
        voice = 'alloy'
    } = options;

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsSupported(true);
            // Create audio element for OpenAI TTS
            if (useOpenAI) {
                audioRef.current = new Audio();
                audioRef.current.onended = () => setIsSpeaking(false);
                audioRef.current.onerror = () => setIsSpeaking(false);
            }
        }
    }, [useOpenAI]);

    const speakWithOpenAI = useCallback(async (text: string, selectedVoice: TTSVoice) => {
        try {
            setIsSpeaking(true);

            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, voice: selectedVoice }),
            });

            if (!response.ok) {
                throw new Error('TTS request failed');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                await audioRef.current.play();
            }
        } catch (error) {
            console.error('OpenAI TTS error:', error);
            setIsSpeaking(false);
            // Fallback to browser TTS on error
            speakWithBrowser(text);
        }
    }, []);

    const speakWithBrowser = useCallback((text: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        // Cancel any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Select a pleasant voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, []);

    const speak = useCallback((text: string) => {
        if (useOpenAI) {
            speakWithOpenAI(text, voice);
        } else {
            speakWithBrowser(text);
        }
    }, [useOpenAI, voice, speakWithOpenAI, speakWithBrowser]);

    const stop = useCallback(() => {
        setIsSpeaking(false);

        // Stop OpenAI audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        // Stop browser TTS
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }, []);

    return {
        speak,
        stop,
        isSpeaking,
        isSupported,
        mode: useOpenAI ? 'openai' : 'browser',
        voice
    };
}
