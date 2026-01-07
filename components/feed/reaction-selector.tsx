'use client';

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReactionType } from "@/types/posts";

export const REACTIONS: { type: ReactionType; label: string; emoji: string; color: string }[] = [
    { type: 'brilliant', label: 'Brilliant', emoji: '💡', color: 'text-amber-500' },
    { type: 'excellent', label: 'Excellent', emoji: '🌟', color: 'text-yellow-500' },
    { type: 'hugs', label: 'Hugs', emoji: '🤗', color: 'text-orange-500' },
    { type: 'thinking_of_you', label: 'Thinking of you', emoji: '💖', color: 'text-pink-500' },
    { type: 'vibe', label: "That's a Vibe", emoji: '😎', color: 'text-purple-500' },
    { type: 'positive_energy', label: 'Positive Energy', emoji: '✨', color: 'text-yellow-400' },
    { type: 'healing_energy', label: 'Sending Healing Energy', emoji: '❤️‍🩹', color: 'text-red-400' },
];

interface ReactionSelectorProps {
    onSelect: (type: ReactionType) => void;
    currentReaction?: ReactionType;
}

export function ReactionSelector({ onSelect, currentReaction }: ReactionSelectorProps) {
    return (
        <div className="flex items-center gap-1 p-1 bg-background border border-border rounded-full shadow-lg animate-in fade-in zoom-in-95 duration-200">
            {REACTIONS.map((reaction) => (
                <button
                    key={reaction.type}
                    onClick={() => onSelect(reaction.type)}
                    title={reaction.label}
                    className={cn(
                        "text-2xl p-2 hover:scale-125 transition-transform duration-200 rounded-full hover:bg-muted",
                        currentReaction === reaction.type && "bg-muted scale-110"
                    )}
                >
                    {reaction.emoji}
                </button>
            ))}
        </div>
    );
}

export function getReactionIcon(type?: ReactionType) {
    const reaction = REACTIONS.find(r => r.type === type);
    return reaction ? reaction.emoji : '👍';
}

export function getReactionLabel(type?: ReactionType) {
    const reaction = REACTIONS.find(r => r.type === type);
    return reaction ? reaction.label : 'Like';
}

export function getReactionColor(type?: ReactionType) {
    const reaction = REACTIONS.find(r => r.type === type);
    return reaction ? reaction.color : 'text-muted-foreground';
}
