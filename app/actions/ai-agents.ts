"use server";

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminDb } from "@/lib/firebase-admin";

// ------------------------------------------------------------------
// 🤖 Agent Definitions
// ------------------------------------------------------------------

import { AgentMode, AIModel } from "@/types/ai";

// ------------------------------------------------------------------
// 🤖 Agent Definitions
// ------------------------------------------------------------------

const AGENT_PERSONAS: Record<AgentMode, string> = {
    general: `You are the Famio AI Assistant. You are helpful, warm, and family-oriented.
    Your goal is to help users navigate the platform and answer general questions.
    Use emojis liberally. Keep answers concise.`,

    tutor: `You are 'The Tutor', a patient and encouraging educational assistant for students.
    - Your target audience is school-age children and teenagers.
    - Explain complex topics simply ("Explain like I'm 5" when asked).
    - Be encouraging ("Great question!", "You're doing awesome!").
    - Safety First: Refuse to do homework *for* them, but explain *how* to do it.
    - Use clear structure (bullet points) and avoiding jargon.`,

    executive: `You are 'The Executive', a high-performance productivity partner.
    - Your target audience is busy professionals, business owners, and leaders.
    - Be extremely concise. Bottom line up front (BLUF).
    - Focus on action items, summaries, and planning.
    - Tone: Professional, efficient, no fluff. Default to bullet points.`,

    biographer: `You are 'The Family Biographer', a dedicated historian for preserving family legacy.
    - Your goal is to help users tell their stories and capture memories.
    - Ask follow-up questions to dig deeper ("Tell me more about that day...").
    - Be respectful, nostalgic, and curious.
    - Encourage users to upload photos for their stories.`,

    architect: `You are 'The Architect', a technical guide for developers and tech enthusiasts.
    - Your target audience is technical users.
    - Use technical terminology correctly.
    - Format code blocks perfectly with markdown.
    - Focus on system design, logic, and 'how things work'.`
};

// ------------------------------------------------------------------
// 🧠 RAG & Similarity Search (Shared)
// ------------------------------------------------------------------

async function generateEmbedding(text: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OpenAI API Key is missing");
    const openai = new OpenAI({ apiKey });

    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float",
    });
    return response.data[0].embedding;
}

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

// ------------------------------------------------------------------
// 🚀 Main Interaction Function
// ------------------------------------------------------------------

export async function chatWithAgent(
    userMessage: string,
    mode: AgentMode = "general",
    model: AIModel = "gpt-4o",
    attachments: { url: string; type: 'image' | 'file' }[] = []
) {
    try {
        console.log(`🤖 AI Agent Activated: [${mode.toUpperCase()}] using [${model}] with [${attachments.length}] attachments`);

        // 1. Get RAG Context (Shared Knowledge Base) - if no attachments (to save tokens/complexity for now)
        let contextText = "";
        if (attachments.length === 0) {
            const userEmbedding = await generateEmbedding(userMessage);
            const snapshot = await adminDb.collection("knowledge_base").get();

            if (!snapshot.empty) {
                const docs = snapshot.docs.map((doc: any) => ({
                    content: doc.data().content,
                    embedding: doc.data().embedding,
                    metadata: doc.data().metadata
                }));

                const scoredDocs = docs.map((doc: any) => ({
                    ...doc,
                    score: cosineSimilarity(userEmbedding, doc.embedding)
                }));

                scoredDocs.sort((a: any, b: any) => b.score - a.score);
                const topDocs = scoredDocs.slice(0, 3);
                contextText = topDocs.map((d: any) => `[Possible Context: ${d.metadata.title}]: ${d.content}`).join("\n\n");
            }
        }

        // 2. Select Persona
        const systemPrompt = AGENT_PERSONAS[mode] || AGENT_PERSONAS.general;

        // 3. Dispatch to Model
        if (model.startsWith("claude")) {
            // --- ANTHROPIC / CLAUDE ---
            const anthropicKey = process.env.ANTHROPIC_API_KEY;
            if (!anthropicKey) throw new Error("Anthropic API Key is missing");
            const anthropic = new Anthropic({ apiKey: anthropicKey });

            // Construct Message with Content Blocks
            const messageContent: any[] = [{ type: "text", text: userMessage }];

            // Add Images
            // Note: Claude API expects base64 for images usually, but assuming URL support or we need to fetch. 
            // SIMPLIFICATION: For now, if URL is public, we might need value-add logic. 
            // Anthropic SDK often requires base64. 
            // Let's assume for this step we append the URLs to the text if simple, or skip complex base64 fetching for speed unless requested.
            // BETTER: Claude doesn't support image URLs directly in the API yet (needs base64).
            // WORKAROUND: Just append URL to text and hope it can browse? No, it can't.
            // ERROR HANDLING: If attachments exist, tell user "I can see that" (Stub).
            // REAL IMPLEMENTATION: We would need to fetch the image and convert to base64.
            // Let's stick to OpenAI for Vision which supports URLs easily.

            if (attachments.length > 0) {
                return "Image analysis is currently optimized for GPT-4o. Please switch models to GPT-4o to analyze this image!";
            }

            const response = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 1024,
                system: systemPrompt + (contextText ? `\n\nContext:\n${contextText}` : ""),
                messages: [
                    { role: "user", content: messageContent }
                ]
            });

            // Extract text content
            const contentBlock = response.content[0];
            if (contentBlock.type === 'text') {
                return contentBlock.text;
            }
            return "I couldn't process the response.";

        } else if (model.startsWith("gemini")) {
            // --- GOOGLE GEMINI ---
            const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
            if (!googleKey) throw new Error("Google API Key is missing");
            const genAI = new GoogleGenerativeAI(googleKey);
            const geminiModel = genAI.getGenerativeModel({ model: model });

            // Gemini supports image parts? 
            // Need to fetch buffer. 
            // Fallback for now.
            if (attachments.length > 0) {
                return "Image analysis is currently optimized for GPT-4o. Please switch models to GPT-4o to analyze this image!";
            }

            const chat = geminiModel.startChat({
                history: [
                    { role: "user", parts: [{ text: systemPrompt + (contextText ? `\n\nContext:\n${contextText}` : "") }] },
                ],
            });

            const result = await chat.sendMessage(userMessage);
            const response = result.response;
            return response.text();

        } else {
            // --- OPENAI (GPT-4o, o1, etc) ---
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) throw new Error("OpenAI API Key is missing");
            const openai = new OpenAI({ apiKey });

            // Handle o1 models (No Vision on o1-preview yet?)
            if (model.startsWith("o1")) {
                const response = await openai.chat.completions.create({
                    model: model,
                    messages: [
                        { role: "user", content: `[SYSTEM INSTRUCTION: ${systemPrompt}]\n\n${userMessage}` }
                    ],
                });
                return response.choices[0].message.content;
            }

            // Standard GPT-4o / Mini (Supports Vision URL)
            const messages: any[] = [
                { role: "system", content: systemPrompt },
            ];

            if (contextText) {
                messages.push({
                    role: "system",
                    content: `Here is some relevant context. Use likely only if text matches:\n${contextText}`
                });
            }

            const userContent: any[] = [{ type: "text", text: userMessage }];

            // Append Images
            attachments.forEach(att => {
                if (att.type === 'image') {
                    userContent.push({
                        type: "image_url",
                        image_url: {
                            url: att.url,
                            detail: "high"
                        }
                    });
                }
            });

            messages.push({ role: "user", content: userContent });

            const response = await openai.chat.completions.create({
                model: model,
                messages: messages,
                temperature: mode === "executive" ? 0.3 : 0.7,
            });

            return response.choices[0].message.content;
        }

    } catch (error) {
        console.error(`Error in chatWithAgent (${mode}/${model}):`, error);
        return "I'm having trouble connecting to my neural core. Please try again in a moment. 🧠";
    }
}

// ------------------------------------------------------------------
// 🌱 Seeding Utility
// ------------------------------------------------------------------

export async function seedKnowledgeBase() {
    const knowledgeData = [
        {
            title: "About Famio",
            content: "Famio is a private, secure social platform built exclusively for families. It allows you to share moments, plan events, and stay connected with the people who matter most. It is powered by ChanceTEK."
        },
        {
            title: "Multi-Modal AI Agents",
            content: "Famio Universal Intelligence offers specialized AI modes: 1) General (Helpful Assistant), 2) Tutor (Explains simply for kids/students), 3) Executive (Concise summaries for busy pros), 4) Biographer (Interviews you to save memories), 5) Architect (Technical details)."
        },
        {
            title: "Magic Draft",
            content: "Found in the 'Create Post' box, the Magic Draft button (wand icon) uses AI to instantly write warm, engaging social media posts for you. You just type a rough idea, and it polishes it into a publish-ready message."
        },
        {
            title: "Ask AI (Contextual)",
            content: "On any post in the feed, you can click the Share menu and select 'Ask AI about this...'. This opens the AI Assistant with the post's content pre-loaded, allowing you to ask for summaries, explanations, or translations of that specific post."
        },
        {
            title: "Biographer & Legacy Building",
            content: "The 'Record Memory' button on your Profile page launches the Biographer Agent. It conducts a friendly interview to help you capture important life stories. These memories are preserved as part family legacy."
        },
        {
            title: "Branding Pages",
            content: "The Branding feature allows businesses, public figures, and organizations to create official pages. Users can follow Brands to see their updates. Brands are separate from personal profiles and have their own followers."
        },
        {
            title: "Live Broadcasts",
            content: "Famio Live allows you to stream video in real-time to your family. You can start a broadcast from the 'Live' tab. Viewers can chat in real-time. You can control privacy (Family Only vs Public) before starting."
        },
        {
            title: "Privacy & Security",
            content: "Famio uses End-to-End Encryption to keep data safe. Only family members you approve can see your content. Features include 'Public Profile' toggle (default off) and strict owner-only deletion rights for gallery photos."
        },
        {
            title: "Stories",
            content: "Stories are ephemeral photos or videos that disappear after 24 hours. You can upload them from the home tray. Videos autoplay muted but can be unmuted. You can see who viewed your story."
        },
        {
            title: "Groups",
            content: "Groups allow for micro-communities (e.g., 'Cousins', 'Planning Committee'). You can join public groups or be invited to private ones. Groups have dedicated feeds and member lists."
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
            title: "Account & Settings",
            content: "You can update your profile, change your display name, and manage privacy settings in the Settings page. Display Name is mandatory for all users."
        }
    ];

    console.log("Starting Knowledge Base Seed...");
    const batch = adminDb.batch();
    const collectionRef = adminDb.collection("knowledge_base");

    for (const item of knowledgeData) {
        const embedding = await generateEmbedding(item.content);
        // Create a new doc reference
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
