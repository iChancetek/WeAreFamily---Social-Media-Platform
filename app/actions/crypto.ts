'use server';

interface CryptoQuote {
    symbol: string;
    price: number;
    changesPercentage: number;
    change: number;
    name: string;
}

/**
 * Fetch cryptocurrency quotes from Yahoo Finance (completely free, no API key needed)
 * Yahoo Finance crypto symbols format: BTC-USD, ETH-USD, SOL-USD
 */
export async function getCryptoQuotes(symbols: string[] = ['BTC-USD', 'ETH-USD', 'SOL-USD']): Promise<CryptoQuote[]> {
    try {
        console.log(`[Crypto] Fetching quotes for: ${symbols.join(',')}`);

        const results: CryptoQuote[] = [];

        // Yahoo Finance API - free, no key needed
        // Fetch each symbol individually
        for (const symbol of symbols) {
            try {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
                const response = await fetch(url, {
                    next: { revalidate: 60 }, // Cache for 60 seconds
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }
                });

                if (!response.ok) {
                    console.error(`[Crypto] Failed for ${symbol}:`, response.status);
                    continue;
                }

                const data = await response.json();
                const result = data?.chart?.result?.[0];

                if (!result) {
                    console.error(`[Crypto] No result data for ${symbol}`);
                    continue;
                }

                const meta = result.meta;
                const currentPrice = meta.regularMarketPrice;
                const previousClose = meta.chartPreviousClose || meta.previousClose;
                const change = currentPrice - previousClose;
                const changePercent = (change / previousClose) * 100;

                // Extract clean symbol (e.g., "BTC" from "BTC-USD")
                const cleanSymbol = symbol.split('-')[0];

                results.push({
                    symbol: cleanSymbol,
                    price: currentPrice,
                    change: change,
                    changesPercentage: changePercent,
                    name: meta.shortName || cleanSymbol
                });

            } catch (symbolError) {
                console.error(`[Crypto] Error fetching ${symbol}:`, symbolError);
            }
        }

        console.log(`[Crypto] Successfully fetched ${results.length} of ${symbols.length} cryptos`);
        return results;

    } catch (error) {
        console.error('[Crypto] Error fetching crypto quotes:', error);
        return [];
    }
}

/**
 * Get popular crypto quotes with additional options
 */
export async function getPopularCryptos(): Promise<CryptoQuote[]> {
    return getCryptoQuotes([
        'BTC-USD',   // Bitcoin
        'ETH-USD',   // Ethereum
        'SOL-USD',   // Solana
        'BNB-USD',   // Binance Coin
        'XRP-USD',   // Ripple
        'ADA-USD',   // Cardano
    ]);
}
