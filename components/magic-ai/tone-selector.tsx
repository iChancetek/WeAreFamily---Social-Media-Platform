"use client";

import { TONE_METADATA, type EmotionalTone } from "@/types/magic-ai";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ToneSelectorProps {
    selectedTone: EmotionalTone | null;
    onSelectTone: (tone: EmotionalTone) => void;
    disabled?: boolean;
}

export function ToneSelector({ selectedTone, onSelectTone, disabled }: ToneSelectorProps) {
    const tones = Object.values(TONE_METADATA);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                    Choose Your Tone
                </h3>
                <span className="text-xs text-muted-foreground">
                    Select an emotional style
                </span>
            </div>

            <TooltipProvider>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {tones.map((tone) => (
                        <Tooltip key={tone.id}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={selectedTone === tone.id ? "default" : "outline"}
                                    className={`
                                        h-auto py-3 px-3 flex flex-col items-center gap-2 
                                        transition-all duration-200 hover:scale-105
                                        ${selectedTone === tone.id
                                            ? `${tone.color} text-white border-transparent shadow-lg`
                                            : 'bg-card hover:bg-accent'
                                        }
                                    `}
                                    onClick={() => onSelectTone(tone.id)}
                                    disabled={disabled}
                                >
                                    <span className="text-2xl">{tone.icon}</span>
                                    <span className="text-xs font-semibold text-center leading-tight">
                                        {tone.name}
                                    </span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                                <p className="text-sm">{tone.description}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            </TooltipProvider>
        </div>
    );
}
