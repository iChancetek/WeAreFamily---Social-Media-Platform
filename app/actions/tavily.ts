'use server';

interface TavilySearchResult {
    title: string;
    url: string;
    content: string;
    score: number;
}

interface TavilySearchResponse {
    answer?: string;
    results: TavilySearchResult[];
    query: string;
}

export async function searchWithTavily(query: string, maxResults: number = 5): Promise<TavilySearchResponse | null> {
    try {
        console.log(`[Tavily Server Action] Searching: "${query}"`);

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tavily-search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, maxResults }),
        });

        if (!response.ok) {
            console.error('[Tavily Server Action] Search failed:', response.status);
            return null;
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('[Tavily Server Action] Error:', error);
        return null;
    }
}

/**
 * Format Tavily results for AI consumption
 */
export function formatTavilyResults(data: TavilySearchResponse | null): string {
    if (!data || !data.results || data.results.length === 0) {
        return 'No search results found.';
    }

    let formatted = '';

    if (data.answer) {
        formatted += `Direct Answer: ${data.answer}\n\n`;
    }

    formatted += 'Search Results:\n';
    data.results.forEach((result, index) => {
        formatted += `\n${index + 1}. ${result.title}\n`;
        formatted += `   ${result.content.slice(0, 300)}...\n`;
        formatted += `   Source: ${result.url}\n`;
    });

    return formatted;
}
