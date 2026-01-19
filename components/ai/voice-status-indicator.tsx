'use client';

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import { useLanguage } from "@/components/language-context";

interface VoiceStatusIndicatorProps {
    state: 'idle' | 'listening' | 'processing' | 'speaking';
    isBroadcasting?: boolean;
    onClick?: () => void;
    className?: string;
}

export function VoiceStatusIndicator({
    state,
    isBroadcasting,
    onClick,
    className
}: VoiceStatusIndicatorProps) {
    const { t } = useLanguage();

    // Status color mapping
    const getStatusColor = () => {
        switch (state) {
            case 'listening': return "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]";
            case 'processing': return "bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]";
            case 'speaking': return "bg-primary shadow-[0_0_15px_rgba(111,76,255,0.6)]";
            default: return "bg-zinc-400 group-hover:bg-zinc-600 dark:bg-zinc-600 dark:group-hover:bg-zinc-400"; // Idle
        }
    };

    const getStatusText = () => {
        switch (state) {
            case 'listening': return t('ai.status.listening');
            case 'processing': return t('ai.status.processing');
            case 'speaking': return t('ai.status.speaking');
            default: return t('ai.status.ready');
        }
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative flex items-center justify-center p-2 rounded-xl transition-all duration-300",
                "hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-white/10",
                className
            )}
        >
            {/* Orb Container */}
            <div className="relative w-8 h-8 flex items-center justify-center">
                {/* Core Orb */}
                <motion.div
                    className={cn(
                        "w-3 h-3 rounded-full transition-colors duration-300",
                        getStatusColor()
                    )}
                    animate={state === 'listening' ? {
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.8, 1]
                    } : state === 'speaking' ? {
                        scale: [1, 1.5, 1],
                    } : {
                        scale: 1
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Ripple Effect for Listening */}
                {state === 'listening' && (
                    <motion.div
                        className="absolute inset-0 rounded-full border border-red-500/30"
                        animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                )}

                {/* Processing Spinner Ring */}
                {state === 'processing' && (
                    <motion.div
                        className="absolute inset-0 rounded-full border-t-2 border-yellow-400"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                )}

                {/* Speaking Waveform Sim (Simple bars) */}
                {state === 'speaking' && (
                    <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                className="w-0.5 bg-primary/80"
                                animate={{ height: [4, 12, 4] }}
                                transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    delay: i * 0.1
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Expanded Label (handled by parent layout usually, but we can include text here) */}
            <div className="ml-3 overflow-hidden hidden group-hover:block md:group-[.expanded]:block">
                <span className={cn(
                    "text-xs font-medium uppercase tracking-wider",
                    state !== 'idle' ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-500"
                )}>
                    {getStatusText()}
                </span>
            </div>
        </button>
    );
}
