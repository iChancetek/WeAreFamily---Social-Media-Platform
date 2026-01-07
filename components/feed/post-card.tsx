'use client';

import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { SafeDate } from "@/components/shared/safe-date";

// Level 1: Extreme Safety PostCard
// This component replaces the complex PostCard to verify if the crash is caused by specific UI elements.
export function PostCard({ post, currentUserId }: { post: any, currentUserId?: string }) {
    if (!post) return <div className="p-4 border border-red-500 rounded text-red-500">Error: Post Undefined</div>;

    return (
        <Card className="mb-4 bg-card">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-lg">Safe Mode Debug: {post.id}</h3>
                        <p className="text-sm text-muted-foreground">Author: {post.author?.displayName || "Unknown"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        <SafeDate date={post.createdAt} />
                    </span>
                </div>

                <hr className="my-2 border-border" />

                <p className="whitespace-pre-wrap">{post.content || "No Content"}</p>

                <div className="mt-4 p-2 bg-muted rounded text-xs text-muted-foreground">
                    <p>Reactions: {post.reactions ? Object.keys(post.reactions).length : 0}</p>
                    <p>Comments: {post.comments ? post.comments.length : 0}</p>
                    <p>Media: {post.mediaUrls ? post.mediaUrls.length : 0}</p>
                </div>
            </CardContent>
        </Card>
    );
}

// Dummy export to prevent import errors in other files that might import these
export function ReactionSelector() { return null; }
export function getReactionIcon() { return "👍"; }
export function getReactionLabel() { return "Like"; }
export function getReactionColor() { return "text-gray-500"; }
