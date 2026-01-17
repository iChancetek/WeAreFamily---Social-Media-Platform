"use client";

import { Button } from "@/components/ui/button";
import { Play, Pause, ChevronsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AutoScrollToggleProps {
    isEnabled: boolean;
    isPaused: boolean;
    onToggle: () => void;
    className?: string;
}

export function AutoScrollToggle({ isEnabled, isPaused, onToggle, className }: AutoScrollToggleProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={isEnabled ? "secondary" : "ghost"}
                        size="sm"
                        onClick={onToggle}
                        className={cn(
                            "h-8 px-2 lg:px-3 text-xs gap-1.5 transition-all",
                            isEnabled && "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20",
                            !isEnabled && "text-muted-foreground hover:text-foreground",
                            className
                        )}
                    >
                        {isEnabled ? (
                            isPaused ? (
                                <>
                                    <Pause className="w-3.5 h-3.5 animate-pulse" />
                                    <span className="hidden lg:inline">Paused</span>
                                </>
                            ) : (
                                <>
                                    <ChevronsUp className="w-3.5 h-3.5 animate-bounce" />
                                    <span className="hidden lg:inline">Scrolling</span>
                                </>
                            )
                        ) : (
                            <>
                                <Play className="w-3.5 h-3.5" />
                                <span className="hidden lg:inline">Auto-Scroll</span>
                            </>
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                    {isEnabled ? "Click to disable auto-scroll" : "Enable auto-scroll for hands-free reading"}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
