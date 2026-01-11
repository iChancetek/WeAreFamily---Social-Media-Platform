
import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseSpeechRecognitionProps {
    onResult?: (transcript: string) => void;
    onEnd?: () => void;
}

export function useSpeechRecognition({ onResult, onEnd }: UseSpeechRecognitionProps = {}) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);

    // Use refs to avoid recreating recognition instance
    const onResultRef = useRef(onResult);
    const onEndRef = useRef(onEnd);

    // Update refs when callbacks change
    useEffect(() => {
        onResultRef.current = onResult;
        onEndRef.current = onEnd;
    }, [onResult, onEnd]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (typeof window !== 'undefined' && SpeechRecognition) {
            try {
                const recognitionInstance = new SpeechRecognition();
                recognitionInstance.continuous = false;
                recognitionInstance.interimResults = true;
                recognitionInstance.lang = 'en-US';

                recognitionInstance.onresult = (event: any) => {
                    let interimTranscript = '';
                    let finalTranscript = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }

                    const currentTranscript = finalTranscript || interimTranscript;
                    setTranscript(currentTranscript);
                    if (onResultRef.current) {
                        onResultRef.current(currentTranscript);
                    }
                };

                recognitionInstance.onend = () => {
                    setIsListening(false);
                    if (onEndRef.current) onEndRef.current();
                };

                recognitionInstance.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setIsListening(false);
                };

                setRecognition(recognitionInstance);
                setIsSupported(true);
            } catch (e) {
                console.error("SpeechRecognition initialization failed:", e);
                setIsSupported(false);
            }
        }
    }, []); // Empty dependency array - only runs once

    const startListening = useCallback(() => {
        if (recognition && !isListening) {
            try {
                recognition.start();
                setIsListening(true);
                setTranscript('');
            } catch (e) {
                console.error("Failed to start recognition", e);
            }
        }
    }, [recognition, isListening]);

    const stopListening = useCallback(() => {
        if (recognition && isListening) {
            recognition.stop();
            setIsListening(false);
        }
    }, [recognition, isListening]);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        isSupported
    };
}
