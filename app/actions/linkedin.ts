'use server';

import OpenAI from 'openai';

export type LinkedInContent = {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    aiSummary?: {
        topic: string;
        keyInsights: string[];
        whyItMatters: string;
        discussionPrompts: string[];
    };
};

export async function analyzeLinkedInContent(url: string, ogData?: { title?: string; description?: string; image?: string }): Promise<LinkedInContent> {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return { url, ...ogData };
        }

        const openai = new OpenAI({ apiKey });

        // Use available OG metadata
        const title = ogData?.title || 'LinkedIn Post';
        const description = ogData?.description || '';

        const prompt = `Analyze this LinkedIn content and provide intelligent insights:

Title: ${title}
Description: ${description}
URL: ${url}

Generate a JSON response with:
1. "topic": Main topic/theme (max 5 words)
2. "keyInsights": Array of 2-3 key takeaways (each max 20 words)
3. "whyItMatters": One sentence explaining relevance (max 25 words)
4. "discussionPrompts": Array of 2 engaging questions to spark conversation

Be neutral, professional, and insightful. Focus on value to Famio users.

Format:
{
  "topic": "string",
  "keyInsights": ["insight 1", "insight 2"],
  "whyItMatters": "string",
  "discussionPrompts": ["question 1?", "question 2?"]
}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are an AI content analyst helping users understand professional content shared on LinkedIn.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.4,
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message.content;
        if (!content) {
            return { url, ...ogData };
        }

        const parsed = JSON.parse(content);

        return {
            url,
            title,
            description,
            image: ogData?.image,
            aiSummary: {
                topic: parsed.topic || '',
                keyInsights: parsed.keyInsights || [],
                whyItMatters: parsed.whyItMatters || '',
                discussionPrompts: parsed.discussionPrompts || []
            }
        };
    } catch (error) {
        console.error('LinkedIn AI Analysis Error:', error);
        return { url, ...ogData };
    }
}
