'use client';

import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { sendMessage } from "@/app/actions/chat";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon, Video, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function ChatWindow({ chatId, otherUser }: { chatId: string, otherUser?: any }) {
    const { messages, loading } = useRealtimeMessages(chatId);
    const { user } = useAuth();
    const [inputValue, setInputValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        setIsSending(true);
        try {
            await sendMessage(chatId, inputValue);
            setInputValue("");
        } catch (error) {
            console.error("Failed to send", error);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
    }

    // Group messages by date? Optional enhancement.

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center p-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
                {otherUser && (
                    <>
                        <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={otherUser.imageUrl} />
                            <AvatarFallback>{otherUser.displayName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-bold">{otherUser.displayName}</h2>
                            <p className="text-xs text-green-500">Online now</p> {/* TODO: Real presence */}
                        </div>
                    </>
                )}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.senderId === user?.uid;
                    return (
                        <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-[70%] rounded-2xl px-4 py-2",
                                isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"
                            )}>
                                <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>
                                <span className="text-[10px] opacity-70 block mt-1 text-right">
                                    {format(msg.createdAt, "h:mm a")}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t sticky bottom-0 bg-background">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="shrink-0">
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    {/* Phase 2: Media Upload */}

                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message..."
                        className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
                    />

                    <Button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isSending}
                        size="icon"
                        variant={inputValue.trim() ? "default" : "ghost"}
                        className={cn("shrink-0 rounded-full transition-all", inputValue.trim() ? "scale-100 opacity-100" : "scale-90 opacity-0 w-0 p-0 overflow-hidden")}
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
