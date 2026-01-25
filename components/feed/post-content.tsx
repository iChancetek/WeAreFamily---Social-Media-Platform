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
    mediaUrl
}: PostContentProps) {
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
                // If in feed (!isEnlarged), clicking text bubbles to Card onClick -> handleEnlarge
                <div className={cn(
                    "text-sm leading-relaxed whitespace-pre-wrap",
                    isPinterest ? "text-foreground/95 font-medium line-clamp-2" : "text-foreground/90",
                    !isPinterest && (!isEnlarged && hasMedia ? "line-clamp-3" : "line-clamp-6")
                )}>
                    <Linkify text={translatedContent || postContent} hideUrls={mediaUrl ? [mediaUrl] : []} onMediaFound={() => { }} />
                </div>
            )}
        </div>
    );
}
