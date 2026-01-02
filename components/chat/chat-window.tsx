"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getMessages, sendMessage, Message, ChatSession } from "@/app/actions/chat";
import { Send, Loader2, Smile } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ChatWindowProps {
    session: ChatSession;
    currentUserId: string;
}

export function ChatWindow({ session, currentUserId }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    const otherUser = session.otherUser;

    const fetchMessages = async () => {
        try {
            const data = await getMessages(session.id);
            setMessages(data);
            setIsLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    // Initial fetch and Polling
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [session.id]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const content = inputText;
        setInputText(""); // Optimistic clear

        // Optimistic append
        const tempMsg: Message = {
            id: Date.now().toString(), // Temp ID as string
            senderId: currentUserId,
            content: content,
            createdAt: new Date(),
        };
        setMessages(prev => [...prev, tempMsg]);

        setIsSending(true);
        try {
            await sendMessage(session.id, content);
            await fetchMessages(); // Sync real ID
        } catch {
            // Revert or show error (simplified)
            console.error("Failed to send");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-card rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3 bg-white/50 backdrop-blur-md">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={otherUser?.imageUrl || undefined} />
                    <AvatarFallback>{otherUser?.displayName?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-semibold text-sm md:text-base text-foreground">
                        {otherUser?.displayName || "Family Member"}
                    </h3>
                    <p className="text-xs text-green-500 font-medium">Online</p>
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 bg-gray-50/50 dark:bg-background/50">
                <div className="flex flex-col gap-3 min-h-full justify-end">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10 text-sm">
                            Say hello! 👋
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.senderId === currentUserId;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe
                                        ? 'bg-primary text-primary-foreground rounded-br-none'
                                        : 'bg-white dark:bg-card text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/5 rounded-bl-none shadow-sm'
                                        }`}>
                                        {msg.content}
                                        <div className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-primary-foreground/80' : 'text-gray-500'}`}>
                                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-card border-t border-gray-100 dark:border-white/5">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2 items-center"
                >
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
                                <Smile className="w-5 h-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-2" align="start">
                            <div className="grid grid-cols-8 gap-2">
                                {["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🔥", "😎", "✨", "👋", "🙏", "🤝", "👀", "💯", "🤔"].map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => setInputText(prev => prev + emoji)}
                                        className="text-xl hover:bg-muted p-1 rounded transition-colors"
                                        type="button"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Input
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="flex-1 bg-gray-100 dark:bg-secondary border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                    <Button type="submit" size="icon" disabled={!inputText.trim() || isSending} className="shrink-0">
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
