import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { text, voice = 'alloy' } = await req.json();

        if (!text) {
            return NextResponse.json(
                { error: 'No text provided' },
                { status: 400 }
            );
        }

        // Validate voice
        const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
        if (!validVoices.includes(voice)) {
            return NextResponse.json(
                { error: `Invalid voice. Choose from: ${validVoices.join(', ')}` },
                { status: 400 }
            );
        }

        console.log('[TTS] Generating speech:', { voice, textLength: text.length });

        // Generate speech with OpenAI TTS
        const mp3 = await openai.audio.speech.create({
            model: 'tts-1', // Use tts-1-hd for higher quality
            voice: voice as any,
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
            },
        });

    } catch (error: any) {
        console.error('[TTS] Generation error:', error);

        return NextResponse.json(
            {
                error: 'TTS generation failed',
                details: error.message
            },
            { status: 500 }
        );
    }
}
