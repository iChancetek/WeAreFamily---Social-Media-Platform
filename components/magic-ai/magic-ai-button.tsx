"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface MagicAIButtonProps {
    onClick: () => void;
    disabled?: boolean;
    isGenerating?: boolean;
}

export function MagicAIButton({ onClick, disabled, isGenerating }: MagicAIButtonProps) {
    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            disabled={disabled || isGenerating}
            className="gap-2 flex-1 md:flex-none text-primary hover:bg-primary/10 border border-primary/20 bg-primary/5"
            aria-label="Enhance content with Magic AI"
        >
            {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
                <Sparkles className="w-6 h-6 text-primary" />
            )}
            <span className="text-[15px] font-bold text-primary">Magic AI ✨</span>
        </Button>
    );
}
