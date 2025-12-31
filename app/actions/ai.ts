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
        console.error("OpenAI Error:", error);
        // Don't crash the UI, return empty string or error message
        throw new Error("Failed to generate content. Check API Key.");
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
                    content: "You are a warm, loving family member writing a short, heartwarming birthday wish. Use emojis. keep it under 50 words. Be festive!"
                },
                {
                    role: "user",
                    content: `Write a birthday wish for ${name}.`
                }
            ],
            temperature: 0.8,
        });

        return response.choices[0].message.content || `Happy Birthday ${name}! 🎂`;
    } catch (error) {
        console.error("AI Error:", error);
        return `Happy Birthday ${name}! 🎂`; // Fallback
    }
}
