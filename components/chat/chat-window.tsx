'use client'

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import { getChatDetails, sendMessage } from "@/app/actions/chat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ChatWindow({ chatId, onBack, currentUserId }: any) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial fetch
    useEffect(() => {
        let isMounted = true;
        const fetchMessages = async () => {
            try {
                const details = await getChatDetails(chatId);
                if (isMounted && details) {
                    setMessages(details.messages);
                }
            } catch (e) {
                console.error(e);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Polling every 3s
        return () => { isMounted = false; clearInterval(interval); }
    }, [chatId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const content = input;
        setInput(""); // Optimistic clear

        // Optimistic update
        const optimisticMsg = {
            id: Date.now(),
            content,
            senderId: currentUserId,
            createdAt: new Date(),
            sender: { id: currentUserId } // Mock
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            await sendMessage(chatId, content);
        } catch {
            toast.error("Failed to send");
        }
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-4 border-b bg-white flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="font-bold">Chat #{chatId}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg: any) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                        <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                                isMe ? "bg-rose-500 text-white" : "bg-white text-gray-900"
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t flex gap-2">
                <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1"
                />
                <Button onClick={handleSend} size="icon" className="bg-rose-500 hover:bg-rose-600">
                    <Send className="w-4 h-4 absolute text-white" />
                </Button>
            </div>
        </div>
    )
}
