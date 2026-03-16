'use client';

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Heart, Lock, ChevronDown } from "lucide-react";

export type SubscriptionTier = 'public' | 'free' | 'paid';

interface SubscriptionTierSelectorProps {
    value: SubscriptionTier;
    onChange: (value: SubscriptionTier) => void;
}

export function SubscriptionTierSelector({ value, onChange }: SubscriptionTierSelectorProps) {
    const getIcon = () => {
        switch (value) {
            case 'public': return <Globe className="w-4 h-4" />;
            case 'free': return <Heart className="w-4 h-4 text-pink-500" />;
            case 'paid': return <Lock className="w-4 h-4 text-amber-500" />;
            default: return <Globe className="w-4 h-4" />;
        }
    };

    const getLabel = () => {
        switch (value) {
            case 'public': return "Public";
            case 'free': return "Free Subs";
            case 'paid': return "Paid Subs";
            default: return "Public";
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8 px-3 rounded-full bg-background/50 backdrop-blur-sm border-white/20 hover:bg-white/10 dark:hover:bg-black/20 text-xs font-medium">
                    {getIcon()}
                    <span>{getLabel()}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Who can read this?</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={value} onValueChange={(val) => onChange(val as SubscriptionTier)}>
                    <DropdownMenuRadioItem value="public" className="cursor-pointer">
                        <Globe className="w-4 h-4 mr-2" />
                        <div className="flex flex-col">
                            <span>Public</span>
                            <span className="text-[10px] text-muted-foreground">Everyone can read</span>
                        </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="free" className="cursor-pointer">
                        <Heart className="w-4 h-4 mr-2 text-pink-500" />
                        <div className="flex flex-col">
                            <span>Free Subscribers</span>
                            <span className="text-[10px] text-muted-foreground">Requires free subscription</span>
                        </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="paid" className="cursor-pointer">
                        <Lock className="w-4 h-4 mr-2 text-amber-500" />
                        <div className="flex flex-col">
                            <span>Paid Subscribers</span>
                            <span className="text-[10px] text-muted-foreground">Premium content</span>
                        </div>
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
