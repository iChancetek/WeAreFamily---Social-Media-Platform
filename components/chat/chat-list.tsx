'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { User } from "lucide-react";

export function ChatList({ chats, selectedId, onSelect, currentUserId }: any) {
    return (
        <div className="flex-1 overflow-y-auto">
            {chats.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                    No messages yet.
                </div>
            )}
            {chats.map((chat: any) => {
                // Determine chat name (other participant or group name)
                const otherParticipants = (chat.participants as string[]).filter(id => id !== currentUserId);
                // In a real app we'd fetch user names for these IDs. For MVP, show IDs or "Chat".
                const chatName = chat.name || (otherParticipants.length > 0 ? `User ${otherParticipants[0].slice(0, 4)}...` : "Unknown");

                return (
                    <div
                        key={chat.id}
                        onClick={() => onSelect(chat.id)}
                        className={cn(
                            "p-4 border-b cursor-pointer hover:bg-gray-50 flex gap-3 items-center",
                            selectedId === chat.id && "bg-rose-50 border-rose-100"
                        )}
                    >
                        <Avatar>
                            <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-medium truncate">{chatName}</span>
                                {chat.lastMessageAt && (
                                    <span className="text-xs text-gray-400">
                                        {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false })}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                                {chat.messages[0]?.content || "No messages"}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
