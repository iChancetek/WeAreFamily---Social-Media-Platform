'use client'

import { useState } from "react";
import { ChatList } from "./chat-list";
import { ChatWindow } from "./chat-window";

type Chat = {
    id: number;
    participants: unknown;
    lastMessageAt: Date | null;
    messages: { content: string, createdAt: Date }[];
}

export function ChatLayout({ initialChats, selectedChatId, currentUserId }: { initialChats: Chat[], selectedChatId?: number, currentUserId: string }) {
    const [selectedId, setSelectedId] = useState<number | undefined>(selectedChatId);

    return (
        <>
            <div className={`w-full md:w-80 border-r flex flex-col ${selectedId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b">
                    <h2 className="font-bold text-lg">Messages</h2>
                </div>
                <ChatList chats={initialChats} selectedId={selectedId} onSelect={setSelectedId} currentUserId={currentUserId} />
            </div>
            <div className={`flex-1 flex flex-col ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
                {selectedId ? (
                    <ChatWindow chatId={selectedId} onBack={() => setSelectedId(undefined)} currentUserId={currentUserId} />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Select a conversation to start chatting
                    </div>
                )}
            </div>
        </>
    )
}
