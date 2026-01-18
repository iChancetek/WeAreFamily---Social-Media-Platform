'use client';

import { useEffect, useState } from 'react';
import { getStockQuotes } from '@/app/actions/stocks';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Crypto {
    symbol: string;
    price: number;
    changesPercentage: number;
    change: number;
    name: string;
}

export function CryptoTicker() {
    const [cryptos, setCryptos] = useState<Crypto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCryptos = async () => {
            try {
                // Fetch major cryptocurrencies
                const data = await getStockQuotes([
                    'BTCUSD', 'ETHUSD', 'SOLUSD'
                ]);
                setCryptos(data);
            } catch (error) {
                console.error("Failed to load crypto ticker", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCryptos();

        // Refresh every 60s
        const interval = setInterval(fetchCryptos, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="h-10 w-full bg-muted/30 animate-pulse rounded-md mb-2" />;

    // Show debug message if no cryptos loaded
    if (!cryptos.length) {
        return (
            <div className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-md px-4 py-2 mb-2 text-xs text-yellow-700 dark:text-yellow-400">
                Crypto ticker: No data available. Check server logs for [Stocks] entries or verify FMP_API_KEY in .env.local
            </div>
        );
    }

    // Duplicate list for seamless infinite scroll
    const marqueeItems = [...cryptos, ...cryptos];

    // Asset-specific accent colors
    const getAccentColor = (symbol: string) => {
        if (symbol === 'BTCUSD') return 'hsl(30, 95%, 55%)'; // Bitcoin Orange
        if (symbol === 'ETHUSD') return 'hsl(255, 82%, 67%)'; // Ethereum Purple
        if (symbol === 'SOLUSD') return 'hsl(180, 75%, 50%)'; // Solana Teal
        return 'hsl(199, 89%, 48%)'; // Default blue
    };

    return (
        <div className="w-full overflow-hidden ticker-professional py-2.5 select-none relative group z-20">
            <div className="flex animate-marquee hover:pause-animation whitespace-nowrap">
                {marqueeItems.map((crypto, index) => (
                    <div
                        key={`${crypto.symbol}-${index}`}
                        className="inline-flex items-center gap-3 mx-8 text-xs group/item"
                    >
                        <span
                            className="font-bold tracking-tight text-foreground/90"
                            style={{
                                textShadow: `0 0 10px ${getAccentColor(crypto.symbol)}40`
                            }}
                        >
                            {crypto.symbol.replace('USD', '')}
                        </span>
                        <span className="font-mono font-medium text-foreground/80 tracking-tighter ticker-glow-price">${crypto.price.toFixed(2)}</span>
                        <div className={cn(
                            "flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded-full bg-white/50 dark:bg-white/5 transition-colors",
                            crypto.change > 0
                                ? "text-emerald-600 dark:text-emerald-400 ticker-glow-change-positive"
                                : crypto.change < 0
                                    ? "text-rose-600 dark:text-rose-400 ticker-glow-change-negative"
                                    : "text-gray-500"
                        )}>
                            {crypto.change > 0 ? <TrendingUp className="w-3 h-3 stroke-[3px]" /> : crypto.change < 0 ? <TrendingDown className="w-3 h-3 stroke-[3px]" /> : <Minus className="w-3 h-3" />}
                            <span className="tracking-tight">{crypto.change > 0 ? '+' : ''}{crypto.changesPercentage.toFixed(2)}%</span>
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
