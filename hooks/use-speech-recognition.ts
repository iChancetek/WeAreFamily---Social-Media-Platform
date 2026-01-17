import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseSpeechRecognitionProps {
    onResult?: (transcript: string) => void;
    onEnd?: () => void;
    useWhisper?: boolean; // Use OpenAI Whisper instead of browser API
    continuous?: boolean; // NEW: Continuous listening mode
}

export function useSpeechRecognition({
    onResult,
    onEnd,
    useWhisper = true, // Default to Whisper for better accuracy
    continuous = false // Default to single-turn
}: UseSpeechRecognitionProps = {}) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);

    // Whisper-specific state
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Use refs to avoid recreating recognition instance
    const onResultRef = useRef(onResult);
    const onEndRef = useRef(onEnd);
    const continuousRef = useRef(continuous);

    // Update refs when props change
    useEffect(() => {
        onResultRef.current = onResult;
        onEndRef.current = onEnd;
        continuousRef.current = continuous;
    }, [onResult, onEnd, continuous]);

    // Initialize browser Speech Recognition (fallback)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            try {
                const recognitionInstance = new SpeechRecognition();
                recognitionInstance.continuous = continuous; // Use continuous flag
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
                    // Only stop listening state if NOT continuous, or if explicitly stopped
                    if (!continuousRef.current) {
                        setIsListening(false);
                    }
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
    }, [continuous]);

    // Initialize MediaRecorder for Whisper
    useEffect(() => {
        if (!useWhisper || typeof window === 'undefined') return;

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                setIsSupported(true);
            })
            .catch((err) => {
                console.error('Microphone access denied:', err);
                setIsSupported(false);
            });
    }, [useWhisper]);

    // Whisper transcription
    const transcribeWithWhisper = useCallback(async (audioBlob: Blob) => {
        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Transcription failed');
            }

            const data = await response.json();
            const transcriptText = data.text;

            setTranscript(transcriptText);
            if (onResultRef.current) {
                onResultRef.current(transcriptText);
            }
        } catch (error) {
            console.error('Whisper transcription error:', error);
        } finally {
            setIsProcessing(false);
            if (onEndRef.current) onEndRef.current();
        }
    }, []);

    const startListening = useCallback(async () => {
        if (isListening) return;

        // Use Whisper if enabled
        if (useWhisper) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                const chunks: Blob[] = [];

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunks.push(e.data);
                    }
                };

                recorder.onstop = async () => {
                    const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                    await transcribeWithWhisper(audioBlob);
                    stream.getTracks().forEach(track => track.stop());

                    // If continuous, restart recording after processing (or handled by wrapper)
                    // Note: Whisper continuous mode is better handled by VAD wrapper essentially calling start/stop
                };

                recorder.start();
                setMediaRecorder(recorder);
                setAudioChunks([]);
                setIsListening(true);
                setTranscript('');
            } catch (e) {
                console.error("Failed to start Whisper recording", e);
            }
        }
        // Fallback to browser API
        else if (recognition && !isListening) {
            try {
                recognition.start();
                setIsListening(true);
                setTranscript('');
            } catch (e) {
                console.error("Failed to start browser recognition", e);
            }
        }
    }, [recognition, isListening, useWhisper, transcribeWithWhisper]);

    const stopListening = useCallback(() => {
        if (!isListening) return;

        if (useWhisper && mediaRecorder) {
            mediaRecorder.stop();
            setMediaRecorder(null);
        } else if (recognition) {
            recognition.stop();
        }

        setIsListening(false);
    }, [recognition, isListening, useWhisper, mediaRecorder]);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        isSupported,
        isProcessing,
        mode: useWhisper ? 'whisper' : 'browser',
    };
}
