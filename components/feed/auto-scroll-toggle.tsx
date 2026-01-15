'use client';

import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AutoScrollToggleProps {
    isEnabled: boolean;
    isPaused: boolean;
    onToggle: () => void;
    className?: string;
}

export function AutoScrollToggle({
    isEnabled,
    isPaused,
    onToggle,
    className,
}: AutoScrollToggleProps) {
    const isActive = isEnabled && !isPaused;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={onToggle}
                        variant="outline"
                        size="icon"
                        className={cn(
                            'fixed bottom-24 right-6 z-40 h-12 w-12 rounded-full shadow-lg transition-all duration-300',
                            'border-2 bg-background/95 backdrop-blur-sm',
                            isActive
                                ? 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                                : 'border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary',
                            'md:bottom-6',
                            className
                        )}
                        aria-label={isEnabled ? 'Pause auto-scroll' : 'Resume auto-scroll'}
                    >
                        {isActive ? (
                            <Pause className="h-5 w-5" />
                        ) : (
                            <Play className="h-5 w-5" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                    <p className="font-medium">
                        {isActive ? 'Auto-scroll Active' : 'Auto-scroll Paused'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {isActive
                            ? 'Feed is flowing. Click to pause.'
                            : 'Click to enable living feed mode'}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
