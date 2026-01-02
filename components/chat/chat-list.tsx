"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatSession } from "@/app/actions/chat";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

interface ChatListProps {
    chats: ChatSession[];
}

export function ChatList({ chats }: ChatListProps) {
    const searchParams = useSearchParams();
    const activeChatId = searchParams.get("chatId");

    if (chats.length === 0) {
        return (
            <div className="p-4 text-center text-muted-foreground text-sm">
                No conversations yet.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1 p-2">
            {chats.map((chat) => {
                const isActive = chat.id === activeChatId;
                const otherUser = chat.otherUser;

                return (
                    <Link
                        key={chat.id}
                        href={`/messages?chatId=${chat.id}`}
                        className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/5",
                            isActive && "bg-blue-50 dark:bg-blue-900/20"
                        )}
                    >
                        <Avatar className="h-12 w-12 border border-gray-100 dark:border-white/10">
                            <AvatarImage src={otherUser?.imageUrl || undefined} />
                            <AvatarFallback>{otherUser?.displayName?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className={cn(
                                    "font-semibold truncate text-sm",
                                    isActive ? "text-primary" : "text-foreground"
                                )}>
                                    {otherUser?.displayName || "Family Member"}
                                </span>
                                {chat.lastMessageAt && (
                                    <span className="text-[10px] text-gray-400 shrink-0">
                                        {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false })}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                                {chat.lastMessage}
                            </p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
