import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { query, maxResults = 5 } = await req.json();

        if (!query) {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.TAVILY_API_KEY;
        if (!apiKey) {
            console.error('[Tavily] API key not configured');
            return NextResponse.json(
                { error: 'Tavily API not configured' },
                { status: 500 }
            );
        }

        console.log(`[Tavily] Searching for: "${query}"`);

        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                max_results: maxResults,
                include_answer: true,
                search_depth: 'advanced',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Tavily] API error:', response.status, errorText);
            return NextResponse.json(
                { error: 'Search failed', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();

        console.log(`[Tavily] Found ${data.results?.length || 0} results`);

        return NextResponse.json({
            answer: data.answer,
            results: data.results,
            query: data.query,
        });

    } catch (error: any) {
        console.error('[Tavily] Search error:', error);
        return NextResponse.json(
            { error: 'Search failed', details: error.message },
            { status: 500 }
        );
    }
}
