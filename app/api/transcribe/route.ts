import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json(
                { error: 'No audio file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
        if (!allowedTypes.includes(audioFile.type)) {
            return NextResponse.json(
                { error: 'Invalid audio format. Supported: webm, mp4, mpeg, wav, ogg' },
                { status: 400 }
            );
        }

        // Validate file size (max 25MB)
        if (audioFile.size > 25 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 25MB' },
                { status: 400 }
            );
        }

        console.log('[Whisper] Transcribing audio:', {
            filename: audioFile.name,
            type: audioFile.type,
            size: audioFile.size,
        });

        // Transcribe using Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            language: 'en', // Auto-detect if omitted
            response_format: 'json',
        });

        console.log('[Whisper] Transcription complete:', transcription.text);

        return NextResponse.json({
            text: transcription.text,
            language: 'en',
        });

    } catch (error: any) {
        console.error('[Whisper] Transcription error:', error);

        return NextResponse.json(
            {
                error: 'Transcription failed',
                details: error.message
            },
            { status: 500 }
        );
    }
}
