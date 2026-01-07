'use client';

// Level 2 (Restored): Visual Restoration (No Complex Interactions)
// This version was confirmed STABLE. 
// We are rolling back to this to stop the crashing.

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SafeDate } from "@/components/shared/safe-date";
import { Heart, MessageCircle, Share2, Sparkles, MoreHorizontal, ExternalLink } from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// Dynamic Player for Media Safe Rendering
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

// Helper: Video Detection
function isUrlVideo(url: string | null | undefined): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg');
}

export function PostCard({ post, currentUserId }: { post: any, currentUserId?: string }) {
    // Safety check just in case
    if (!post) return null;

    const author = post.author || { displayName: "Unknown" };
    const name = author.displayName || author.email || "Unknown";
    const profilePic = author.imageUrl;

    // Safely extract YouTube link
    const youtubeMatch = post.content?.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+(?<![.,!?])/);

    return (
        <Card className="mb-4 overflow-hidden border-none shadow-sm bg-card">
            {/* 1. Header Section */}
            <div className="flex flex-row items-center gap-3 p-4 pb-2">
                <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={profilePic || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {name.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-semibold text-sm">{name}</span>
                        {post.context?.type === 'group' && (
                            <>
                                <span className="text-muted-foreground text-xs">▶</span>
                                <span className="font-semibold text-sm">{post.context.name}</span>
                            </>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        <SafeDate date={post.createdAt} />
                    </span>
                </div>
                {/* Visual Only Menu Button */}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
            </div>

            {/* 2. Content Section */}
            <div className="px-4 py-2">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                    {post.content}
                </p>

                {/* YouTube Embed */}
                {youtubeMatch && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-border bg-black aspect-video relative group">
                        <ReactPlayer url={youtubeMatch[0]} width="100%" height="100%" controls />
                    </div>
                )}

                {/* Post Media */}
                {post.mediaUrls?.map((url: string, idx: number) => (
                    <div key={idx} className="mt-3 rounded-xl overflow-hidden border border-border">
                        {isUrlVideo(url) ? (
                            <video src={url} controls className="w-full max-h-[600px] bg-black" />
                        ) : (
                            <img src={url} alt="Post media" className="w-full h-auto max-h-[600px] object-cover" />
                        )}
                    </div>
                ))}
            </div>

            {/* 3. Footer / Actions (Visual Only - Normal Buttons, No Dropdowns) */}
            <div className="flex flex-col px-2 py-1 mx-2 mt-1 border-t border-border">
                {/* Stats */}
                <div className="flex justify-between items-center text-xs text-muted-foreground w-full mb-2 px-1 pt-2">
                    <span>{post.reactions ? Object.keys(post.reactions).length : 0} reactions</span>
                    <span>{post.comments ? post.comments.length : 0} comments</span>
                </div>

                {/* Buttons - Intentionally simple to stress test standard button rendering */}
                <div className="flex justify-between items-center w-full mb-1">
                    <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground hover:text-pink-500">
                        <Heart className="w-5 h-5" />
                        <span>Like</span>
                    </Button>

                    <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground">
                        <MessageCircle className="w-5 h-5" />
                        <span>Comment</span>
                    </Button>

                    <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground hover:text-indigo-500">
                        <Sparkles className="w-4 h-4" />
                        <span>AI</span>
                    </Button>

                    <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground">
                        <Share2 className="w-5 h-5" />
                        <span>Share</span>
                    </Button>
                </div>
            </div>
        </Card>
    );
}
