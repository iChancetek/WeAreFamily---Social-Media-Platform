"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Linkify } from "@/components/shared/linkify";
import { cn } from "@/lib/utils";

interface PostContentProps {
    isEditing: boolean;
    editContent: string;
    onEditContentChange: (val: string) => void;
    onEditCancel: () => void;
    onEditSave: () => void;
    isEnlarged: boolean;
    isPinterest: boolean;
    hasMedia: boolean;
    translatedContent: string | null;
    postContent: string;
    mediaUrl: string | null;
    title?: string;
    linkPreviewUrl?: string | null;
}

export function PostContent({
    isEditing,
    editContent,
    onEditContentChange,
    onEditCancel,
    onEditSave,
    isEnlarged,
    isPinterest,
    hasMedia,
    translatedContent,
    postContent,
    mediaUrl,
    title,
    linkPreviewUrl
}: PostContentProps) {
    // Collect all URLs that should be hidden from inline text
    const hideUrls: string[] = [];
    if (mediaUrl) hideUrls.push(mediaUrl);
    if (linkPreviewUrl) hideUrls.push(linkPreviewUrl);

    return (
        <div onClick={e => !isEditing && isEnlarged ? e.stopPropagation() : undefined}>
            {isEditing ? (
                <div className="space-y-2 mt-2" onClick={e => e.stopPropagation()}>
                    <Textarea value={editContent} onChange={e => onEditContentChange(e.target.value)} className="text-sm" />
                    <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={onEditCancel} variant="outline">Cancel</Button>
                        <Button size="sm" onClick={onEditSave}>Save</Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    {title && (
                        <h3 className={cn(
                            "font-black text-lg text-blue-700 dark:text-blue-400 tracking-tighter leading-tight",
                            isPinterest && "line-clamp-1"
                        )}>
                            {title}
                        </h3>
                    )}
                    <div className={cn(
                        "text-[15px] leading-relaxed whitespace-pre-wrap font-bold tracking-tight",
                        isPinterest ? "text-blue-600/90 dark:text-blue-300 font-black line-clamp-2" : "text-blue-600/90 dark:text-blue-300",
                        !isPinterest && (!isEnlarged && hasMedia ? "line-clamp-3" : "line-clamp-6")
                    )}>
                    <Linkify text={translatedContent || postContent} hideUrls={hideUrls} onMediaFound={() => { }} />
                    </div>
                </div>
            )}
        </div>
    );
}

