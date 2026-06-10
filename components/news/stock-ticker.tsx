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
                // Fetch major tech stocks only (crypto moved to separate ticker)
                const data = await getStockQuotes([
                    'AAPL', 'TSLA', 'MSFT', 'AMZN', 'GOOGL', 'NVDA', 'META'
                ]);
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
        <div className="w-full overflow-hidden ticker-professional py-2.5 select-none relative group z-20">
            <div className="flex animate-marquee hover:pause-animation whitespace-nowrap">
                {marqueeItems.map((stock, index) => (
                    <div
                        key={`${stock.symbol}-${index}`}
                        className="inline-flex items-center gap-4 mx-10 text-sm"
                    >
                        <span 
                            className="font-black tracking-tighter text-foreground uppercase border-b-2 border-primary/30"
                            style={{ textShadow: '0 0 15px hsla(var(--primary) / 0.2)' }}
                        >
                            {stock.symbol}
                        </span>
                        <span className="font-mono font-black text-foreground tracking-tighter ticker-glow-price text-base">${stock.price.toFixed(2)}</span>
                        <div className={cn(
                            "flex items-center gap-1 font-black px-3 py-1 rounded-xl shadow-sm transition-all",
                            stock.change > 0
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                                : stock.change < 0
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        )}>
                            {stock.change > 0 ? <TrendingUp className="w-4 h-4 stroke-[4px]" /> : stock.change < 0 ? <TrendingDown className="w-4 h-4 stroke-[4px]" /> : <Minus className="w-4 h-4 stroke-[4px]" />}
                            <span className="tracking-tighter">{stock.change > 0 ? '+' : ''}{stock.changesPercentage.toFixed(2)}%</span>
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
