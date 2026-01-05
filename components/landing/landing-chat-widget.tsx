"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Bot, Send, X, MessageCircle, Sparkles, User, ChevronDown, ChevronUp } from "lucide-react";
import { chatWithLandingAgent } from "@/app/actions/landing-rag";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export function LandingChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hi! I'm the Famio Assistant. Ask me anything about our features, security, or how Famio fits your lifestyle!" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const text = inputValue.trim();
        if (!text || isLoading) return;

        // Dev Command: Seed Knowledge Base
        if (text === '/seed') {
            setMessages(prev => [...prev, { role: 'user', content: text }]);
            setInputValue("");
            setIsLoading(true);
            try {
                // Dynamic import to avoid server-action bundling issues if any
                const { seedKnowledgeBase } = await import("@/app/actions/landing-rag");
                const res = await seedKnowledgeBase();
                if (res.success) {
                    setMessages(prev => [...prev, { role: 'assistant', content: `✅ Knowledge Base Seeded with ${res.count} documents.` }]);
                } else {
                    setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error seeding: ${res.error}` }]);
                }
            } catch (err) {
                setMessages(prev => [...prev, { role: 'assistant', content: "Failed to run seed command." }]);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setInputValue("");
        setIsLoading(true);

        try {
            const response = await chatWithLandingAgent(text, 'gpt-4o');
            setMessages(prev => [...prev, { role: 'assistant', content: response || "Error getting response." }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, something went wrong." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white z-50 animate-bounce-slow"
            >
                <MessageCircle className="w-8 h-8" />
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-6 right-6 w-[350px] h-[500px] flex flex-col shadow-2xl border-blue-100 z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-1.5 rounded-full">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Famio Assistant</h3>
                        <p className="text-[10px] text-blue-100 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Powered by AI
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 rounded-full h-8 w-8">
                    <ChevronDown className="w-5 h-5" />
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex gap-2 max-w-[85%]",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs",
                            msg.role === 'assistant' ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-600"
                        )}>
                            {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className={cn(
                            "p-3 rounded-2xl text-sm shadow-sm",
                            msg.role === 'user'
                                ? "bg-blue-600 text-white rounded-tr-none"
                                : "bg-white border border-gray-100 text-gray-700 rounded-tl-none"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 bg-white">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask about features..."
                        className="pr-10 rounded-full py-5 bg-gray-50 border-gray-200 focus-visible:ring-blue-500"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!inputValue.trim() || isLoading}
                        className="absolute right-1 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </Card>
    );
}
