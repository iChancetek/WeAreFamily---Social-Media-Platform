"use client";

import { useState, useCallback } from "react";
import { Check, Copy, X, Share2, Facebook, Twitter, Mail, MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ShareSheetProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
    postUrl: string;
    title: string;
    description?: string;
    thumbnailUrl?: string | null;
    authorName?: string;
}

// Social platform share configs
const platforms = [
    {
        id: "facebook",
        label: "Facebook",
        color: "bg-[#1877F2] hover:bg-[#0E65D1]",
        icon: <Facebook className="w-5 h-5" />,
        getUrl: (url: string, text: string) =>
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
    },
    {
        id: "twitter",
        label: "X / Twitter",
        color: "bg-black hover:bg-neutral-800",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
        getUrl: (url: string, text: string) =>
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    },
    {
        id: "whatsapp",
        label: "WhatsApp",
        color: "bg-[#25D366] hover:bg-[#1DAA55]",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
        ),
        getUrl: (url: string, text: string) =>
            `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
    },
    {
        id: "telegram",
        label: "Telegram",
        color: "bg-[#26A5E4] hover:bg-[#1A96D5]",
        icon: <Send className="w-5 h-5" />,
        getUrl: (url: string, text: string) =>
            `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    },
    {
        id: "email",
        label: "Email",
        color: "bg-neutral-600 hover:bg-neutral-500",
        icon: <Mail className="w-5 h-5" />,
        getUrl: (url: string, text: string) =>
            `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`Check this out on famio:\n\n${url}`)}`,
    },
];

export function ShareSheet({ isOpen, onClose, postId, postUrl, title, description, thumbnailUrl, authorName }: ShareSheetProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(postUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Fallback for browsers that don't support clipboard API
            const textarea = document.createElement("textarea");
            textarea.value = postUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            toast.success("Link copied!");
            setTimeout(() => setCopied(false), 2500);
        }
    }, [postUrl]);

    const handlePlatformShare = useCallback((platform: typeof platforms[number]) => {
        const shareText = title ? `${title} — via famio` : "Check this out on famio!";
        const shareUrl = platform.getUrl(postUrl, shareText);
        window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
    }, [postUrl, title]);

    const handleNativeShare = useCallback(async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title || "famio Post",
                    text: description || title || "Check this out on famio!",
                    url: postUrl,
                });
            } catch (err: any) {
                // AbortError means user dismissed — that's fine
                if (err?.name !== "AbortError") {
                    toast.error("Could not share. Please copy the link instead.");
                }
            }
        } else {
            handleCopy();
        }
    }, [postUrl, title, description, handleCopy]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Share post"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Sheet */}
            <div
                className="relative w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border/50 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <div className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-base">Share</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        aria-label="Close share sheet"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Post Preview Card (like YouTube's share dialog) */}
                {(thumbnailUrl || title) && (
                    <div className="mx-4 mb-4 rounded-xl border border-border/60 bg-muted/30 overflow-hidden flex gap-3 items-center p-2.5">
                        {thumbnailUrl && (
                            <img
                                src={thumbnailUrl}
                                alt={title || "Post thumbnail"}
                                className="w-16 h-16 rounded-lg object-cover shrink-0 bg-muted"
                            />
                        )}
                        {!thumbnailUrl && (
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0">
                                <Share2 className="w-6 h-6 text-primary/60" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            {authorName && (
                                <p className="text-xs text-muted-foreground mb-0.5 truncate">{authorName} · famio</p>
                            )}
                            {title && (
                                <p className="text-sm font-medium leading-snug line-clamp-2">{title}</p>
                            )}
                            {description && !title && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Copy Link Field */}
                <div className="px-4 mb-4">
                    <div className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border/60 p-1 pl-3.5">
                        <span className="text-sm text-muted-foreground truncate flex-1 font-mono text-xs">{postUrl}</span>
                        <button
                            onClick={handleCopy}
                            className={cn(
                                "flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                                copied
                                    ? "bg-green-500 text-white"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Platform Buttons */}
                <div className="px-4 pb-2">
                    <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">Share to</p>
                    <div className="grid grid-cols-5 gap-2">
                        {platforms.map(platform => (
                            <button
                                key={platform.id}
                                onClick={() => handlePlatformShare(platform)}
                                className={cn(
                                    "flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-white transition-all duration-150 active:scale-95",
                                    platform.color
                                )}
                                title={`Share on ${platform.label}`}
                            >
                                {platform.icon}
                                <span className="text-[10px] font-medium leading-none">{platform.label.split(" ")[0]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Native Share Button (mobile) */}
                {typeof navigator !== "undefined" && "share" in navigator && (
                    <div className="px-4 pb-4 pt-3">
                        <button
                            onClick={handleNativeShare}
                            className="w-full py-2.5 rounded-xl border border-border/60 text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <Share2 className="w-4 h-4" />
                            More sharing options…
                        </button>
                    </div>
                )}

                {/* Safe area padding for iOS */}
                <div className="sm:hidden h-safe-area-inset-bottom" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} />
            </div>
        </div>
    );
}
