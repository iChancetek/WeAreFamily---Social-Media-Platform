"use server";

import OpenAI from "openai";

// Helper to get client only when needed
function getClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OpenAI API Key is missing");
    }
    return new OpenAI({ apiKey });
}

export async function generatePostContent(prompt: string) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        console.log("AI Action: Checking API Key...", apiKey ? "Present" : "Missing");

        if (!apiKey) {
            throw new Error("OpenAI API Key is missing");
        }

        const openai = getClient();
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant for a family social media app. Write a warm, engaging, and family-friendly post caption based on the user's input. Keep it under 280 characters if possible, but prioritize natural tone. Add emojis where appropriate."
                },
                {
                    role: "user",
                    content: `Write a post regarding: ${prompt}`
                }
            ],
            temperature: 0.7,
        });

        return response.choices[0].message.content || "";
    } catch (error) {
        console.error("OpenAI Error Details:", error);
        throw new Error("Failed to generate content. See server logs.");
    }
}

export async function generateCommentSuggestion(postContext: string) {
    try {
        const openai = getClient();
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant for a family social media app. Write a short, positive, and supportive comment in response to a post. Keep it casual and friendly. Max 1-2 sentences. Add an emoji."
                },
                {
                    role: "user",
                    content: `The post says: "${postContext}". Write a nice comment.`
                }
            ],
            temperature: 0.7,
        });

        return response.choices[0].message.content || "";
    } catch (error) {
        console.error("OpenAI Error:", error);
        throw new Error("Failed to generate comment. Check API Key.");
    }
}

export async function generateBirthdayWish(name: string) {
    try {
        const openai = getClient();
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a warm, loving member writing a short, heartwarming birthday wish. Use emojis. keep it under 50 words. Be festive!"
                },
                {
                    role: "user",
                    content: `Write a birthday wish for ${name}.`
                }
            ],
            temperature: 0.8,
        });

        return response.choices[0].message.content || `Happy Birthday ${name}! 🎂`;
        return response.choices[0].message.content || `Happy Birthday ${name}! 🎂`;
    } catch (error) {
        console.error("AI Error:", error);
        return `Happy Birthday ${name}! 🎂`; // Fallback
    }
}

// --- RAG & Vector Search Implementation ---

import { adminDb } from "@/lib/firebase-admin";

// Helper: Cosine Similarity
function cosineSimilarity(vecA: number[], vecB: number[]) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function generateEmbedding(text: string) {
    const openai = getClient();
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float",
    });
    return response.data[0].embedding;
}

export async function chatWithAI(userMessage: string) {
    try {
        const openai = getClient();

        // 1. Embed the user's question
        const userEmbedding = await generateEmbedding(userMessage);

        // 2. Fetch Knowledge Base (For this scale, fetching all is fine ~10-20 docs)
        // In production with 1000s of docs, use a real Vector DB like Pinecone or Firestore Vector Search extension
        const snapshot = await adminDb.collection("knowledge_base").get();

        if (snapshot.empty) {
            // Fallback if KB is empty
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: userMessage }],
            });
            return completion.choices[0].message.content;
        }

        // 3. Perform Similarity Search in-memory
        const docs = snapshot.docs.map((doc: any) => ({
            content: doc.data().content,
            embedding: doc.data().embedding,
            metadata: doc.data().metadata
        }));

        const scoredDocs = docs.map((doc: any) => ({
            ...doc,
            score: cosineSimilarity(userEmbedding, doc.embedding)
        }));

        // Get Top 3 most relevant chunks
        scoredDocs.sort((a: any, b: any) => b.score - a.score);
        const topDocs = scoredDocs.slice(0, 3);

        console.log("AI Context Found:", topDocs.map((d: any) => d.metadata.title));

        // 4. Generate Answer
        const contextText = topDocs.map((d: any) => `[${d.metadata.title}]: ${d.content}`).join("\n\n");

        const systemPrompt = `You are the Famio AI Assistant, a helpful guide for the Famio Family Social Platform.
        
        Use the following context to answer the user's question. 
        If the answer is not in the context, use your general knowledge but mention you are not 100% sure about specific platform details.
        Be warm, friendly, and concise. Use emojis.
        
        Context from Knowledge Base:
        ${contextText}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            temperature: 0.5,
        });

        return response.choices[0].message.content;

    } catch (error) {
        console.error("Chat With AI Error:", error);
        return "I'm having a little trouble thinking right now. Please try again later! 🤖";
    }
}

// --- Seeding Utility (Run once via a button or manually) ---
export async function seedKnowledgeBase() {
    const knowledgeData = [
        {
            title: "About Famio",
            content: "Famio is a private, secure social platform built exclusively for families. It allows you to share moments, plan events, and stay connected with the people who matter most. It is powered by ChanceTEK."
        },
        {
            title: "Privacy & Security",
            content: "Famio uses End-to-End Encryption to keep data safe. Only members you approve can see your content. Features include 'Public Profile' toggle (default off) and strict owner-only deletion rights for gallery photos."
        },
        {
            title: "Stories",
            content: "Stories are ephemeral photos or videos that disappear after 24 hours. You can upload them from the home tray. Videos autoplay muted but can be unmuted. You can see who viewed your story."
        },
        {
            title: "Groups",
            content: "You can create Groups for specific branches of the family or interests (e.g., 'Cousins', 'Planning Committee'). Groups have their own posts and member lists."
        },
        {
            title: "Events",
            content: "The Events feature lets you plan family gatherings. You can track RSVPs, see who is attending, and get reminders. Events appear on the main calendar."
        },
        {
            title: "Gallery",
            content: "The Gallery organizes all your shared photos. IMPORTANT: Deleting a photo from the Gallery also deletes the original Post it was attached to. Only the owner of the photo can delete it."
        },
        {
            title: "AI Features",
            content: "Famio includes AI features like: 1) Content Generation (helping write posts/comments), 2) Automated Birthday Wishes, 3) This AI Assistant (RAG) to answer questions."
        },
        {
            title: "Account & Settings",
            content: "You can update your profile, change your display name, and manage privacy settings in the Settings page. Display Name is mandatory for all users."
        }
    ];

    console.log("Starting Knowledge Base Seed...");
    const batch = adminDb.batch();
    const collectionRef = adminDb.collection("knowledge_base");

    // Clear existing first? Maybe not for now, just overwrite or add.
    // Ideally we delete all, but let's just add for this MVP step.

    for (const item of knowledgeData) {
        const embedding = await generateEmbedding(item.content);
        const docRef = collectionRef.doc();
        batch.set(docRef, {
            content: item.content,
            embedding: embedding,
            metadata: { title: item.title },
            createdAt: new Date()
        });
        console.log(`Prepared doc: ${item.title}`);
    }

    await batch.commit();
    console.log("Knowledge Base Seeded Successfully!");
    return { success: true, count: knowledgeData.length };
}

export async function translateText(text: string, targetLanguage: 'es' | 'en' | 'fr' | 'zh' | 'hi' | 'ar' = 'es') {
    try {
        const openai = getClient();

        const langMap: Record<string, string> = {
            'es': 'Spanish',
            'en': 'English',
            'fr': 'French',
            'zh': 'Chinese (Mandarin)',
            'hi': 'Hindi',
            'ar': 'Arabic'
        };

        const targetLangName = langMap[targetLanguage] || 'English';

        const systemPrompt = `You are a professional translator. Translate the following text to ${targetLangName}. Maintain the tone and emojis.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            temperature: 0.3,
        });

        return response.choices[0].message.content || text;
    } catch (error) {
        console.error("Translation Error:", error);
        return text; // Fallback to original
    }
}
