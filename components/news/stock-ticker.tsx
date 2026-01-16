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
    if (!stocks.length) return null;

    // Duplicate list for seamless infinite scroll
    const marqueeItems = [...stocks, ...stocks];

    return (
        <div className="w-full overflow-hidden bg-card/50 backdrop-blur-sm border-b border-border/50 py-2 mb-2 select-none relative group">
            <div className="flex animate-marquee hover:pause-animation whitespace-nowrap">
                {marqueeItems.map((stock, index) => (
                    <div
                        key={`${stock.symbol}-${index}`}
                        className="inline-flex items-center gap-2 mx-6 text-xs font-medium"
                    >
                        <span className="font-bold text-foreground">{stock.symbol}</span>
                        <span className="text-muted-foreground">${stock.price.toFixed(2)}</span>
                        <div className={cn(
                            "flex items-center gap-0.5",
                            stock.change > 0 ? "text-green-500" : stock.change < 0 ? "text-red-500" : "text-gray-500"
                        )}>
                            {stock.change > 0 ? <TrendingUp className="w-3 h-3" /> : stock.change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            <span>{stock.change > 0 ? '+' : ''}{stock.changesPercentage.toFixed(2)}%</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Gradient masks for smooth fade edges */}
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />

            <style jsx>{`
                .animate-marquee {
                    animation: marquee 30s linear infinite;
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
