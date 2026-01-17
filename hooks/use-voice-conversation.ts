import { useState, useCallback, useEffect, useRef } from 'react';
import { useSpeechRecognition } from './use-speech-recognition';
import { useTextToSpeech } from './use-text-to-speech';

interface UseVoiceConversationProps {
    onMessage: (message: string) => Promise<string>; // Callback to send message to AI
    onStateChange?: (state: 'idle' | 'listening' | 'processing' | 'speaking') => void;
}

export function useVoiceConversation({ onMessage, onStateChange }: UseVoiceConversationProps) {
    const [state, setState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
    const [isContinuous, setIsContinuous] = useState(false);

    // Audio refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // TTS Hook - Use Nova voice (warm, natural)
    const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech({
        useOpenAI: true,
        voice: 'nova'
    });

    // Update state helper
    const updateState = useCallback((newState: 'idle' | 'listening' | 'processing' | 'speaking') => {
        setState(newState);
        onStateChange?.(newState);
    }, [onStateChange]);

    // Handle incoming transcript result
    const handleResult = useCallback(async (transcript: string) => {
        if (!transcript.trim()) return;

        // Stop listening while processing
        updateState('processing');

        try {
            // Get AI response
            const response = await onMessage(transcript);

            // Speak response
            updateState('speaking');
            speak(response);

            // If continuous, we will restart listening AFTER speaking finishes
            // This logic needs to be in an effect checking isSpeaking
        } catch (error) {
            console.error('Conversation error:', error);
            updateState('idle');
        }
    }, [onMessage, speak, updateState]);

    // Speech Recognition Hook
    const {
        isListening,
        startListening,
        stopListening: stopRecognition,
        isProcessing
    } = useSpeechRecognition({
        useWhisper: true,
        continuous: true, // We handle the restart logic manually for better control
        onResult: handleResult
    });

    // Effect to restart listening after speaking finishes (if continuous)
    useEffect(() => {
        if (isContinuous && state === 'speaking' && !isSpeaking) {
            // Finished speaking, back to listening
            // Use setTimeout to avoid "cannot update component while rendering" warning
            setTimeout(() => {
                updateState('listening');
                startListening();
            }, 0);
        }
    }, [isContinuous, state, isSpeaking, updateState, startListening]);

    // Barge-in: Stop speaking if user starts talking
    const handleUserSpeechStart = useCallback(() => {
        if (isSpeaking) {
            stopSpeaking();
            updateState('listening'); // Switch back to listening state
        }
    }, [isSpeaking, stopSpeaking, updateState]);

    // -------------------------------------------------------------------------
    // VAD Logic (Simplified)
    // -------------------------------------------------------------------------
    const startVAD = useCallback(async () => {
        try {
            // Close existing context if any
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

            analyserRef.current.fftSize = 256;
            sourceRef.current.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const checkAudio = () => {
                if (!analyserRef.current) return;

                analyserRef.current.getByteFrequencyData(dataArray);

                // Calculate average volume
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;

                // Threshold for "User is speaking"
                if (average > 20) { // Slightly higher threshold to avoid background noise
                    handleUserSpeechStart();

                    // Clear silence timer if user is talking
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = null;
                    }
                } else {
                    // Silence detected 
                    // Only start timer if we are in listening state and have detecting 'some' previous activity?
                    // For simplicity: if silence persists for 1.5s while listening, assume end of turn
                    if (!silenceTimerRef.current && state === 'listening') {
                        silenceTimerRef.current = setTimeout(() => {
                            // End of turn - stop recording to trigger Whisper
                            if (isListening) {
                                stopRecognition();
                            }
                        }, 2000); // 2s of silence = end of turn
                    }
                }

                animationFrameRef.current = requestAnimationFrame(checkAudio);
            };

            checkAudio();
        } catch (err) {
            console.error('VAD Error:', err);
        }
    }, [state, isListening, handleUserSpeechStart, stopRecognition]); // Added state/isListening dependencies

    const cleanupVAD = useCallback(() => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }, []);

    // Toggle Continuous Mode
    const toggleContinuous = useCallback(() => {
        setIsContinuous(prev => {
            const next = !prev;
            if (next) {
                updateState('listening');
                startListening();
                startVAD();
            } else {
                updateState('idle');
                stopRecognition();
                stopSpeaking();
                cleanupVAD();
            }
            return next;
        });
    }, [startListening, stopRecognition, stopSpeaking, startVAD, cleanupVAD, updateState]);

    // Cleanup effects
    useEffect(() => {
        return () => {
            cleanupVAD();
            stopSpeaking();
        };
    }, []);

    return {
        state,
        isContinuous,
        toggleContinuous,
        isSpeaking,
        isProcessing
    };
}
