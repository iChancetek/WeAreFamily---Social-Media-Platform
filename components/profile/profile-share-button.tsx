'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Facebook, Linkedin, Twitter, Link as LinkIcon, Check } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ProfileShareButtonProps {
    userId: string;
    displayName: string;
    isPublic: boolean;
}

export function ProfileShareButton({ userId, displayName, isPublic }: ProfileShareButtonProps) {
    const [copied, setCopied] = useState(false);
    const [open, setOpen] = useState(false);

    // Use actual deployment URL
    const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : 'https://we-are-family-221.web.app';

    const profileUrl = `${baseUrl}/u/${userId}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(profileUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error("Failed to copy link");
        }
    };

    const handleShareFacebook = () => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
        window.open(fbUrl, '_blank', 'width=600,height=400');
        setOpen(false);
    };

    const handleShareLinkedIn = () => {
        const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
        window.open(liUrl, '_blank', 'width=600,height=600');
        setOpen(false);
    };

    const handleShareTwitter = () => {
        const text = `Check out ${displayName}'s profile on Famio`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
        setOpen(false);
    };

    // Show share button by default (profiles are shareable unless explicitly set to private)
    // Only hide if user has explicitly set isPublic to false
    const shouldHide = isPublic === false;

    if (shouldHide) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Share Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Profile</DialogTitle>
                    <DialogDescription>
                        Share {displayName}'s profile on social media or copy the link
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 py-4">
                    {/* External Share Options */}
                    <button
                        onClick={handleShareFacebook}
                        className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                    >
                        <div className="p-2 rounded-full bg-blue-500/10">
                            <Facebook className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <div className="font-medium">Share on Facebook</div>
                            <div className="text-xs text-muted-foreground">Post to your timeline</div>
                        </div>
                    </button>

                    <button
                        onClick={handleShareLinkedIn}
                        className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                    >
                        <div className="p-2 rounded-full bg-blue-700/10">
                            <Linkedin className="w-5 h-5 text-blue-700" />
                        </div>
                        <div className="flex-1">
                            <div className="font-medium">Share on LinkedIn</div>
                            <div className="text-xs text-muted-foreground">Share professionally</div>
                        </div>
                    </button>

                    <button
                        onClick={handleShareTwitter}
                        className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                    >
                        <div className="p-2 rounded-full bg-sky-500/10">
                            <Twitter className="w-5 h-5 text-sky-500" />
                        </div>
                        <div className="flex-1">
                            <div className="font-medium">Share on X</div>
                            <div className="text-xs text-muted-foreground">Post a tweet</div>
                        </div>
                    </button>

                    <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                    >
                        <div className="p-2 rounded-full bg-primary/10">
                            {copied ? (
                                <Check className="w-5 h-5 text-green-600" />
                            ) : (
                                <LinkIcon className="w-5 h-5 text-primary" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="font-medium">{copied ? "Copied!" : "Copy Link"}</div>
                            <div className="text-xs text-muted-foreground truncate">
                                {profileUrl}
                            </div>
                        </div>
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
