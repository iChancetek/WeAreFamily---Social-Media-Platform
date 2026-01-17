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
        console.log(`[Stocks] Fetching quotes for: ${symbols.join(',')}`);

        const results: StockQuote[] = [];

        // Yahoo Finance API - free, no key needed
        // Fetch each symbol individually
        for (const symbol of symbols) {
            try {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
                const response = await fetch(url, {
                    next: { revalidate: 60 },
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }
                });

                if (!response.ok) {
                    console.error(`[Stocks] Failed for ${symbol}:`, response.status);
                    continue;
                }

                const data = await response.json();
                const result = data?.chart?.result?.[0];

                if (!result) {
                    console.error(`[Stocks] No result data for ${symbol}`);
                    continue;
                }

                const meta = result.meta;
                const currentPrice = meta.regularMarketPrice;
                const previousClose = meta.chartPreviousClose || meta.previousClose;
                const change = currentPrice - previousClose;
                const changePercent = (change / previousClose) * 100;

                results.push({
                    symbol: symbol,
                    price: currentPrice,
                    change: change,
                    changesPercentage: changePercent,
                    name: meta.shortName || symbol
                });

            } catch (symbolError) {
                console.error(`[Stocks] Error fetching ${symbol}:`, symbolError);
            }
        }

        console.log(`[Stocks] Successfully fetched ${results.length} of ${symbols.length} stocks`);
        return results;

    } catch (error) {
        console.error('[Stocks] Error fetching stock quotes:', error);
        return [];
    }
}
