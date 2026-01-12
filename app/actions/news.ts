'use server'

import { unstable_cache } from 'next/cache';

export type NewsItem = {
    title: string;
    link: string;
    source: string;
    pubDate: string;
    thumbnail?: string;
    description?: string;
    // AI-powered fields
    aiSummary?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
    whyItMatters?: string;
};

const FEEDS: Record<string, string> = {
    general: 'https://feeds.bbci.co.uk/news/rss.xml',
    sports: 'https://www.espn.com/espn/rss/news',
    tech: 'https://techcrunch.com/feed/',
    business: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147',
    world: 'https://feeds.bbci.co.uk/news/world/rss.xml',
};

const FEED_NAMES: Record<string, string> = {
    general: 'BBC News',
    sports: 'ESPN',
    tech: 'TechCrunch',
    business: 'CNBC',
    world: 'BBC World',
};

async function fetchFromUrl(url: string): Promise<string> {
    const res = await fetch(url, { next: { revalidate: 300 } }); // Cache for 5 mins
    if (!res.ok) throw new Error(`Failed to fetch RSS: ${res.statusText}`);
    return res.text();
}

function parseRSS(xml: string, sourceName: string): NewsItem[] {
    const items: NewsItem[] = [];

    // Simple regex parser for basic RSS 2.0
    // Matches <item>...</item>
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const itemContent = match[1];

        const title = extractTag(itemContent, 'title');
        const link = extractTag(itemContent, 'link');
        const pubDate = extractTag(itemContent, 'pubDate');
        const description = extractTag(itemContent, 'description');
        let thumbnail = extractTag(itemContent, 'media:content', 'url') || extractTag(itemContent, 'media:thumbnail', 'url');

        // Verify image url or try to extract from description if CDATA contains img
        if (!thumbnail && description) {
            const imgMatch = /src="([^"]+)"/.exec(description);
            if (imgMatch) thumbnail = imgMatch[1];
        }

        if (title && link) {
            // Clean CData
            items.push({
                title: cleanText(title),
                link: cleanText(link),
                pubDate: cleanText(pubDate),
                description: cleanText(description).replace(/<[^>]+>/g, '').substring(0, 100) + '...',
                source: sourceName,
                thumbnail
            });
        }
        if (items.length >= 8) break; // Limit to 8 items
    }
    return items;
}

function extractTag(content: string, tagName: string, attr?: string): string | undefined {
    if (attr) {
        // Match <tagName ... attr="VALUE" ... >
        const regex = new RegExp(`<${tagName}[^>]*${attr}=["']([^"']+)["']`, 'i');
        const match = regex.exec(content);
        return match ? match[1] : undefined;
    } else {
        // Match <tagName>VALUE</tagName>
        const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
        const match = regex.exec(content);
        return match ? match[1] : undefined;
    }
}

function cleanText(text: string | undefined): string {
    if (!text) return '';
    // Remove CDATA
    return text.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
}

export async function getNews(category: string = 'general'): Promise<NewsItem[]> {
    try {
        const url = FEEDS[category] || FEEDS.general;
        const xml = await fetchFromUrl(url);
        const items = parseRSS(xml, FEED_NAMES[category] || 'News');

        // Add AI summaries to first 3 items (to manage API costs)
        const itemsWithAI = await Promise.all(
            items.map(async (item, index) => {
                if (index < 3) {
                    // Only generate AI for top 3 stories
                    const aiEnhancements = await generateNewsSummary(item);
                    return { ...item, ...aiEnhancements };
                }
                return item;
            })
        );

        return itemsWithAI;
    } catch (e) {
        console.error("News fetch error:", e);
        return [];
    }
}

// AI Summary Generation
async function generateNewsSummary(item: NewsItem): Promise<Partial<NewsItem>> {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return {}; // Skip AI if no key
        }

        const { default: OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey });

        const prompt = `Analyze this news article and provide:
1. A concise 3-bullet summary (each bullet max 15 words)
2. Overall sentiment (positive, neutral, or negative)
3. A one-sentence "Why It Matters" explanation

Article Title: ${item.title}
Description: ${item.description}

Respond in JSON format:
{
  "summary": ["bullet 1", "bullet 2", "bullet 3"],
  "sentiment": "neutral",
  "whyItMatters": "one sentence explanation"
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Cost-effective model
            messages: [
                { role: "system", content: "You are a neutral news analyst. Provide factual, unbiased summaries." },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) return {};

        const parsed = JSON.parse(content);

        return {
            aiSummary: parsed.summary || [],
            sentiment: parsed.sentiment || 'neutral',
            whyItMatters: parsed.whyItMatters || ''
        };
    } catch (error) {
        console.error("AI Summary Error:", error);
        return {}; // Fail gracefully
    }
}

