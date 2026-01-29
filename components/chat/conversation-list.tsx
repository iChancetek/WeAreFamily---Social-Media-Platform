'use client';
// Force git update

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useRealtimeChats } from "@/hooks/use-realtime-chats";
import { Skeleton } from "@/components/ui/skeleton";

export function ConversationList({ className }: { className?: string }) {
    const { chats, loading } = useRealtimeChats();

    if (loading) {
        return (
            <div className={cn("p-4 space-y-4", className)}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[60%]" />
                            <Skeleton className="h-3 w-[80%]" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (chats.length === 0) {
        return (
            <div className={cn("p-4 text-center text-sm text-muted-foreground", className)}>
                No conversations yet.
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col overflow-y-auto", className)}>
            {chats.map((chat) => (
                <Link
                    key={chat.id}
                    href={`/messages/${chat.id}`}
                    className="flex items-center p-4 hover:bg-muted/50 transition-colors border-b last:border-0"
                >
                    <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={chat.otherUser?.imageUrl || undefined} />
                        <AvatarFallback>{chat.otherUser?.displayName?.slice(0, 2).toUpperCase() || "??"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="font-medium truncate block max-w-[120px] sm:max-w-[140px]">
                                {chat.otherUser?.displayName || "Unknown User"}
                            </span>
                            {chat.lastMessageAt && (
                                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                    {formatDistanceToNow(chat.lastMessageAt, { addSuffix: true })}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                            {/* Make "You: " logic if needed, simplifed here */}
                            {chat.lastMessage || "Started a conversation"}
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    );
}
