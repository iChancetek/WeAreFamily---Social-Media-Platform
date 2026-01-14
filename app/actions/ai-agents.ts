"use server";

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminDb } from "@/lib/firebase-admin";
import { queryVectors, upsertVectors } from "@/lib/vector-db";
import { getRelevantMemories } from "@/lib/memory-manager";

// ------------------------------------------------------------------
// 🤖 Agent Definitions
// ------------------------------------------------------------------

import { AgentMode, AIModel, ConversationMessage } from "@/types/ai";

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
        dimensions: 512, // Match Pinecone index configuration
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

// ------------------------------------------------------------------
// 🔍 Tavily Search Integration
// ------------------------------------------------------------------

async function searchTavily(query: string) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
        console.warn("Tavily API Key missing");
        return "Search functionality is currently unavailable (Missing API Key).";
    }

    try {
        console.log(`🔍 Performing Tavily Search for: "${query}"`);
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                search_depth: "basic",
                include_answer: true,
                max_results: 5,
                include_images: false
            })
        });

        if (!response.ok) {
            throw new Error(`Tavily API Error: ${response.statusText}`);
        }

        const data = await response.json();
        // Return a summarized version to save tokens
        const results = data.results?.map((r: any) => `[${r.title}](${r.url}): ${r.content}`).join("\n\n") || "";
        const answer = data.answer ? `Direct Answer: ${data.answer}\n\n` : "";

        return `${answer}Search Results:\n${results}`.trim() || "No relevant results found.";

    } catch (error) {
        console.error("Tavily Search Error:", error);
        return "An error occurred while searching the internet.";
    }
}

// ------------------------------------------------------------------
// 🚀 Main Interaction Function
// ------------------------------------------------------------------

export async function chatWithAgent(
    userMessage: string,
    mode: AgentMode = "general",
    model: AIModel = "gpt-4o",
    attachments: { url: string; type: 'image' | 'file' }[] = [],
    previousMessages: { role: 'user' | 'assistant', content: string }[] = []
) {
    try {
        console.log(`🤖 AI Agent Activated: [${mode.toUpperCase()}] using [${model}] with [${attachments.length}] attachments`);

        // 1. Get RAG Context using Vector Database (Pinecone)
        let contextText = "";
        if (attachments.length === 0) {
            try {
                const userEmbedding = await generateEmbedding(userMessage);

                // Query vector database for relevant knowledge
                const results = await queryVectors(
                    'knowledge',
                    userEmbedding,
                    3, // top 3 results
                    undefined,
                    0.7 // minimum similarity score
                );

                if (results.length > 0) {
                    contextText = results
                        .map((r: any) => `[Knowledge: ${r.metadata.title || 'Reference'}]: ${r.metadata.content}`)
                        .join("\n\n");
                    console.log(`📚 Found ${results.length} relevant knowledge items`);
                }
            } catch (error) {
                console.warn('Vector DB query failed, continuing without context:', error);
                // Graceful degradation - continue without RAG context
            }
        }

        // 2. Select Persona
        const systemPrompt = AGENT_PERSONAS[mode] || AGENT_PERSONAS.general;
        const fullSystemMessage = systemPrompt +
            "\n\nYou have access to the internet via the 'search_internet' tool. USE IT FREQUENTLY for current events, sports, weather, news, or any question requiring up-to-date information." +
            (contextText ? `\n\nKnowledge Base Context:\n${contextText}` : "");

        // 3. Dispatch to Model
        if (model.startsWith("claude")) {
            // ... (Claude Implementation kept similar but simplified for now - No tools implementation for Claude in this pass unless requested)
            // For brevity, falling back to simple text for Claude as user seems focused on "Tavily" which implies a tool use flow often paired with GPT.

            const anthropicKey = process.env.ANTHROPIC_API_KEY;
            if (!anthropicKey) throw new Error("Anthropic API Key is missing");
            const anthropic = new Anthropic({ apiKey: anthropicKey });

            // Construct Message with Content Blocks
            const messageContent: any[] = [{ type: "text", text: userMessage }];

            if (attachments.length > 0) {
                return "Image analysis is currently optimized for GPT-4o. Please switch models to GPT-4o to analyze this image!";
            }

            // Convert previous messages to Anthropic format
            const history = previousMessages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant', // Map 'system' if present? Anthropic doesn't support system in messages
                content: msg.content
            })) as any[];

            const response = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 1024,
                system: fullSystemMessage,
                messages: [
                    ...history,
                    { role: "user", content: messageContent }
                ]
            });

            const contentBlock = response.content[0];
            if (contentBlock.type === 'text') {
                return contentBlock.text;
            }
            return "I couldn't process the response.";

        } else if (model.startsWith("gemini")) {
            // ... (Gemini Implementation - Keeping basic for now)
            const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
            if (!googleKey) throw new Error("Google API Key is missing");
            const genAI = new GoogleGenerativeAI(googleKey);
            const geminiModel = genAI.getGenerativeModel({ model: model });

            if (attachments.length > 0) {
                return "Image analysis is currently optimized for GPT-4o. Please switch models to GPT-4o to analyze this image!";
            }

            // Convert hisotry
            const history = previousMessages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));

            const chat = geminiModel.startChat({
                history: [
                    { role: "user", parts: [{ text: fullSystemMessage }] }, // Seed system prompt as first user message? Or Gemini system instruction
                    { role: "model", parts: [{ text: "Understood. I am ready to assist." }] },
                    ...history
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

            // Define Tools
            const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
                {
                    type: "function",
                    function: {
                        name: "search_internet",
                        description: "Search the internet for real-time information, current events, sports scores, news, weather, etc.",
                        parameters: {
                            type: "object",
                            properties: {
                                query: {
                                    type: "string",
                                    description: "The search query, e.g. 'Who won the Super Bowl 2024' or 'Weather in New York'",
                                },
                            },
                            required: ["query"],
                        },
                    },
                },
            ];

            // Build Messages
            const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
                { role: "system", content: fullSystemMessage },
                ...previousMessages.map(msg => ({ role: msg.role, content: msg.content } as any)),
            ];

            // Current User Message
            const userContent: any[] = [{ type: "text", text: userMessage }];
            attachments.forEach(att => {
                if (att.type === 'image') {
                    userContent.push({
                        type: "image_url",
                        image_url: { url: att.url, detail: "high" }
                    });
                }
            });
            messages.push({ role: "user", content: userContent });

            // 1st Call to OpenAI
            const response = await openai.chat.completions.create({
                model: model.startsWith("o1") ? "gpt-4o" : model, // o1 preview doesn't support tools yet properly in some tiers, safe fallback or specific handling
                messages: messages,
                temperature: mode === "executive" ? 0.3 : 0.7,
                tools: tools,
                tool_choice: "auto",
            });

            const responseMessage = response.choices[0].message;

            // Check for Tool Calls
            if (responseMessage.tool_calls) {
                // Return intermediate thought?? Or just process?
                // Append the assistant's request to the conversation
                messages.push(responseMessage);

                // Process each tool call
                // Process each tool call
                for (const toolCall of responseMessage.tool_calls) {
                    if (toolCall.type === 'function' && toolCall.function.name === "search_internet") {
                        const args = JSON.parse(toolCall.function.arguments);
                        const searchResult = await searchTavily(args.query);

                        messages.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            content: searchResult,
                        });
                    }
                }

                // 2nd Call to OpenAI (with tool outputs)
                const secondResponse = await openai.chat.completions.create({
                    model: model.startsWith("o1") ? "gpt-4o" : model,
                    messages: messages,
                });

                return secondResponse.choices[0].message.content;
            }

            return responseMessage.content;
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
            content: "Famio uses End-to-End Encryption to keep data safe. Only members you approve can see your content. Features include 'Public Profile' toggle (default off) and strict owner-only deletion rights for gallery photos."
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

    console.log("🌱 Starting Knowledge Base Seed to Pinecone...");

    const vectors = [];

    for (const item of knowledgeData) {
        const embedding = await generateEmbedding(item.content);
        vectors.push({
            id: `knowledge_${item.title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`,
            values: embedding,
            metadata: {
                title: item.title,
                content: item.content,
                createdAt: new Date().toISOString()
            }
        });
        console.log(`✅ Prepared vector: ${item.title}`);
    }

    // Upsert to Pinecone 'knowledge' namespace
    await upsertVectors('knowledge', vectors);

    console.log("✅ Knowledge Base Seeded Successfully to Pinecone!");
    return { success: true, count: knowledgeData.length };
}

