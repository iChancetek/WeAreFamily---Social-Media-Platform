"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareButtonProps {
    title: string;
    text: string;
    url?: string; // Optional override, defaults to current window.location
    variant?: "default" | "outline" | "ghost" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
}

export function ShareButton({ title, text, url, variant = "outline", size = "default", className }: ShareButtonProps) {
    const [open, setOpen] = useState(false);

    const getUrl = () => {
        if (typeof window === 'undefined') return '';
        return url || window.location.href;
    };

    const handleCopy = async () => {
        const shareUrl = getUrl();
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Link copied to clipboard");
        } catch (err) {
            toast.error("Failed to copy link");
        }
    };

    const handleNativeShare = () => {
        const shareUrl = getUrl();
        if (navigator.share) {
            navigator.share({
                title: title,
                text: text,
                url: shareUrl,
            }).then(() => {
                toast.success("Shared successfully");
            }).catch((err) => {
                // User cancelled or failed
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            });
        }
    };

    // If native sharing is available, prefer it on mobile, but on desktop show options
    // Actually, Dropdown is safer everywhere to give choice (Copy vs Share)

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className={className}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleNativeShare}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Share via...
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopy}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy Link
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
