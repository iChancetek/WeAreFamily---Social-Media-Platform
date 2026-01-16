'use server';

interface StockQuote {
    symbol: string;
    price: number;
    changesPercentage: number;
    change: number;
    name: string;
}

export async function getStockQuotes(symbols: string[] = ['AAPL', 'TSLA', 'MSFT', 'AMZN', 'GOOGL']): Promise<StockQuote[]> {
    try {
        const symbolString = symbols.join(',');
        // Using demo key as requested. For production, this should be process.env.FMP_API_KEY
        const apiKey = process.env.FMP_API_KEY || 'demo';
        console.log(`[Stocks] Fetching quotes for: ${symbolString} using key: ${apiKey === 'demo' ? 'demo' : '***'}`);

        const url = `https://financialmodelingprep.com/api/v3/quote/${symbolString}?apikey=${apiKey}`;
        const response = await fetch(
            url,
            { next: { revalidate: 60 } } // Cache for 60 seconds
        );

        if (!response.ok) {
            console.error('[Stocks] Failed to fetch stock data:', response.status, response.statusText);
            const text = await response.text();
            console.error('[Stocks] Response body:', text);
            return [];
        }

        const data = await response.json();
        console.log(`[Stocks] Fetched ${data.length} stock quotes.`);

        if (!Array.isArray(data)) {
            console.error('[Stocks] API returned non-array data:', data);
            return [];
        }

        // FMP returns an array of objects
        return data.map((item: any) => ({
            symbol: item.symbol,
            price: item.price,
            changesPercentage: item.changesPercentage,
            change: item.change,
            name: item.name
        }));

    } catch (error) {
        console.error('[Stocks] Error fetching stock quotes:', error);
        return [];
    }
}
