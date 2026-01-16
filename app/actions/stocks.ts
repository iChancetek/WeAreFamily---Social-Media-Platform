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

        const response = await fetch(
            `https://financialmodelingprep.com/api/v3/quote/${symbolString}?apikey=${apiKey}`,
            { next: { revalidate: 60 } } // Cache for 60 seconds
        );

        if (!response.ok) {
            console.error('Failed to fetch stock data:', response.statusText);
            return [];
        }

        const data = await response.json();

        // FMP returns an array of objects
        return data.map((item: any) => ({
            symbol: item.symbol,
            price: item.price,
            changesPercentage: item.changesPercentage,
            change: item.change,
            name: item.name
        }));

    } catch (error) {
        console.error('Error fetching stock quotes:', error);
        return [];
    }
}
