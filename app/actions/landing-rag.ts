'use server';

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import OpenAI from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
import { AIModel } from "@/types/ai";

// Initialize Clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const COLLECTION_NAME = "knowledge_base";

// ------------------------------------------------------------------
// 1. Content Definition (Static Source based on Learn More Page)
// ------------------------------------------------------------------
const STATIC_CONTENT = [
    {
        category: "General",
        text: "Famio is a private, secure social platform built exclusively for families. Share moments, plan events, and stay connected with the people who matter most. It is powered by ChanceTEK."
    },
    {
        category: "Features",
        text: "AI Content Generation: Famio's AI helps you craft meaningful posts, comments, and birthday messages. It assists with writer's block by providing smart suggestions."
    },
    {
        category: "Features",
        text: "Automated Celebrations: Famio automatically celebrates family birthdays and milestones with personalized posts and festive messages. It ensures you never miss a special moment."
    },
    {
        category: "Features",
        text: "Core Platform: Includes Posts & Feed, Events & Planning (RSVP tracking), Stories (24h ephemeral), Groups (sub-groups for branches), Messaging (Private 1-on-1 and Group), and Gallery (Photo albums)."
    },
    {
        category: "Security",
        text: "Security & Privacy: Famio uses Enterprise-grade security. All data is encrypted. Privacy controls restrict visibility to members only. Admin controls allow moderation."
    },
    {
        category: "Target Audience: Executives",
        text: "For Executives: Famio provides a noise-free environment to stay connected with family without the distractions of public social media. Efficient summaries and automated updates respect your busy schedule."
    },
    {
        category: "Target Audience: Students",
        text: "For Students: A safe space to share achievements and keep in touch with family away from home, without the pressure of influencers or algorithms."
    },
    {
        category: "Target Audience: Business Owners",
        text: "For Business Owners: Securely separate your private family life from your public business persona. Manage family events as efficiently as your business meetings."
    },
    {
        category: "Platform Structure",
        text: "Famio is organized into: 1) Family (Your private network), 2) Groups (Micro-communities for cousins, planning, etc), 3) Social (Feed, Stories, Messages), 4) Workspace (Events, Calendar)."
    },
    {
        category: "Roles",
        text: "Chancellor: The 'Chancellor' is the primary administrator and guardian of the family space. They manage high-level settings and family admissions."
    },
    {
        category: "Feature: AI Research Assistant",
        text: "AI Research Assistant: A powerful multi-model companion (GPT-4o, Claude, Gemini). It helps users research topics, summarize documents, write drafts, and organize thoughts. It supports Voice Input and File Uploads."
    },
    {
        category: "Feature: Live",
        text: "Famio Live: Start real-time video broadcasts to share announcements, talent shows, or just hang out. Viewers can chat and react in real-time."
    },
    {
        category: "Feature: Messages",
        text: "Messages: Private, encrypted 1-on-1 and Group chats. Supports rich text and media sharing."
    },
    {
        category: "Feature: Events",
        text: "Events: comprehensive planning tool. Track RSVPs, send reminders, and sync with the family calendar."
    },
    {
        category: "Feature: Gallery",
        text: "Gallery: A centralized visual vault for all shared photos and videos. Organized by date and uploader."
    },
    {
        category: "Feature: Branding",
        text: "Branding: Unique pages for businesses or public figures within the family ecosystem."
    },
    {
        category: "Feature: Admin & Settings",
        text: "Admin & Settings: Granular control over privacy, notifications, and account security. Admins have oversight tools to ensure safety."
    },
    {
        category: "Target Audience: Researchers",
        text: "For Researchers & Tech Enthusiasts: Built on modern tech stacks (Next.js, Firebase, AI), Famio verifies that privacy-first social networking is possible."
    }
];

// ------------------------------------------------------------------
// 2. Ingestion Logic
// ------------------------------------------------------------------

export async function seedKnowledgeBase() {
    try {
        console.log("🌱 Seeding Knowledge Base...");

        // Clear existing (optional, for demo simplicity)
        // await deleteCollection(COLLECTION_NAME); 

        let count = 0;
        for (const item of STATIC_CONTENT) {
            // Generate Embedding
            const embedding = await generateEmbedding(item.text);

            // Store in Firestore
            await adminDb.collection(COLLECTION_NAME).add({
                text: item.text,
                category: item.category,
                embedding: embedding, // Vector
                metadata: { source: "static_seed", createdAt: FieldValue.serverTimestamp() }
            });
            count++;
        }

        console.log(`✅ Seeded ${count} documents.`);
        return { success: true, count };
    } catch (error) {
        console.error("Error seeding knowledge base:", error);
        return { success: false, error: String(error) };
    }
}

async function generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float",
    });
    return response.data[0].embedding;
}

// ------------------------------------------------------------------
// 3. Retrieval Logic (Cosine Similarity)
// ------------------------------------------------------------------

type ScoredDoc = { text: string; score: number };

async function retrieveRelevantContext(query: string, limit: number = 3): Promise<string> {
    const queryEmbedding = await generateEmbedding(query);

    // Fetch all docs (Note: In production, use a Vector DB like Pinecone or Firestore Vector Search Preview)
    // For this prototype with small dataset, in-memory cosine similarity is acceptable/fastest to implement WITHOUT new infra.
    const snapshot = await adminDb.collection(COLLECTION_NAME).get();

    const docs: ScoredDoc[] = [];

    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.embedding) {
            const score = cosineSimilarity(queryEmbedding, data.embedding);
            docs.push({ text: data.text, score });
        }
    });

    // Sort by score DESC
    docs.sort((a, b) => b.score - a.score);

    // Take top N
    const topDocs = docs.slice(0, limit);
    return topDocs.map(d => d.text).join("\n---\n");
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    return dotProduct / (magA * magB);
}

// ------------------------------------------------------------------
// 4. Chat Action
// ------------------------------------------------------------------

export async function chatWithLandingAgent(userQuery: string, model: AIModel = 'gpt-4o') {
    try {
        // 1. Retrieve Context
        const context = await retrieveRelevantContext(userQuery);

        // 2. Construct Prompt
        const systemPrompt = `You are the Famio Assistant, a helpful guide on the Famio landing page.
Your goal is to explain Famio's features, benefits, and target audiences (Executives, Students, etc.) based strictly on the provided context.
If the answer is not in the context, politely say you don't have that information but suggest signing up to explore.
Keep answers concise, welcoming, and professional.

CONTEXT:
${context}
`;

        // 3. Call LLM
        if (model === 'claude-3-5-sonnet-20240620') {
            const msg = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 1024,
                system: systemPrompt,
                messages: [{ role: "user", content: userQuery }]
            });
            const content = msg.content[0];
            if (content.type === 'text') return content.text;
            return "I could not generate a text response.";
        } else {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userQuery }
                ]
            });
            return completion.choices[0].message.content;
        }

    } catch (error) {
        console.error("Error in chatWithLandingAgent:", error);
        return "I apologize, but I'm having trouble connecting to my knowledge base right now.";
    }
}
