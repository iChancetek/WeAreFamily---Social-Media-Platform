'use client';

import { useEffect, useState } from 'react';
import { getStockQuotes } from '@/app/actions/stocks';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Stock {
    symbol: string;
    price: number;
    changesPercentage: number;
    change: number;
    name: string;
}

export function StockTicker() {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStocks = async () => {
            try {
                // Fetch major tech and requested stocks
                const data = await getStockQuotes(['AAPL', 'TSLA', 'MSFT', 'AMZN', 'GOOGL', 'NVDA', 'META']);
                setStocks(data);
            } catch (error) {
                console.error("Failed to load ticker", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStocks();

        // Refresh every 60s
        const interval = setInterval(fetchStocks, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="h-10 w-full bg-muted/30 animate-pulse rounded-md mb-2" />;

    // Show debug message if no stocks loaded
    if (!stocks.length) {
        return (
            <div className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-md px-4 py-2 mb-2 text-xs text-yellow-700 dark:text-yellow-400">
                Stock ticker: No data available. Check server logs for [Stocks] entries or verify FMP_API_KEY in .env.local
            </div>
        );
    }

    // Duplicate list for seamless infinite scroll
    const marqueeItems = [...stocks, ...stocks];

    return (
        <div className="w-full overflow-hidden bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md border-y border-black/5 dark:border-white/5 py-2.5 select-none relative group z-20 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] dark:shadow-none">
            <div className="flex animate-marquee hover:pause-animation whitespace-nowrap">
                {marqueeItems.map((stock, index) => (
                    <div
                        key={`${stock.symbol}-${index}`}
                        className="inline-flex items-center gap-3 mx-8 text-xs"
                    >
                        <span className="font-bold tracking-tight text-foreground/90">{stock.symbol}</span>
                        <span className="font-mono font-medium text-muted-foreground/80 tracking-tighter">${stock.price.toFixed(2)}</span>
                        <div className={cn(
                            "flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded-full bg-white/50 dark:bg-white/5 transition-colors",
                            stock.change > 0
                                ? "text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                                : stock.change < 0
                                    ? "text-rose-600 dark:text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.15)]"
                                    : "text-gray-500"
                        )}>
                            {stock.change > 0 ? <TrendingUp className="w-3 h-3 stroke-[3px]" /> : stock.change < 0 ? <TrendingDown className="w-3 h-3 stroke-[3px]" /> : <Minus className="w-3 h-3" />}
                            <span className="tracking-tight">{stock.change > 0 ? '+' : ''}{stock.changesPercentage.toFixed(2)}%</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Radiant Gradient masks */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent pointer-events-none" />

            <style jsx>{`
                .animate-marquee {
                    animation: marquee 40s linear infinite;
                }
                .hover\\:pause-animation:hover {
                    animation-play-state: paused;
                }
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}
