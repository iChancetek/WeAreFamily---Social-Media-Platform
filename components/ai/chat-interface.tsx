
'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Send, User, Sparkles, Terminal, BookOpen, Briefcase, Mic, MicOff, Volume2, Paperclip, FileText, X } from "lucide-react";
import { AgentMode } from "@/types/ai";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { Loader2 } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { Linkify } from "@/components/shared/linkify";
import { useChat } from "@/hooks/use-chat";

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

type FileAttachment = {
    name: string;
    content: string;
};

interface ChatInterfaceProps {
    isCompact?: boolean;
    externalContext?: string | null;
    initialMode?: AgentMode; // Added prop
    onContextHandled?: () => void;
}

export function ChatInterface({ isCompact = false, externalContext, initialMode, onContextHandled }: ChatInterfaceProps) {
    const { user } = useAuth();

    // Enhanced chat with memory support
    const [memoryEnabled, setMemoryEnabled] = useState(true);
    const [selectedMode, setSelectedMode] = useState<AgentMode>(initialMode || 'general');
    const chat = useChat({
        userId: user?.uid || 'anonymous',
        memoryEnabled,
        mode: selectedMode,
        model: 'gpt-4o'
    });

    const [inputValue, setInputValue] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachedFile, setAttachedFile] = useState<FileAttachment | null>(null);

    // Mode is now set directly in useState initialization above

    // Handle External Context (e.g. "Ask AI")
    useEffect(() => {
        if (externalContext) {
            const contextMsg = `[Shared Context]: "${externalContext.substring(0, 200)}${externalContext.length > 200 ? '...' : ''}"`;

            // Send the context as a message using chat hook
            chat.sendMessage(contextMsg);
            if (onContextHandled) onContextHandled();
        }
    }, [externalContext, onContextHandled, chat]);

    const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech({
        useOpenAI: true, // Enable premium OpenAI voices
        voice: 'nova' // Choose from: alloy, echo, fable, onyx, nova, shimmer
    });

    const { isListening, transcript, startListening, stopListening, isSupported: isSpeechSupported, isProcessing } = useSpeechRecognition({
        onResult: (result) => setInputValue(result), // Transcript is handled here
        useWhisper: true // Enable OpenAI Whisper for superior accuracy
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chat.messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const textToSend = inputValue.trim();
        if ((!textToSend && !attachedFile) || chat.isLoading) return;

        let fullMessage = textToSend;
        if (attachedFile) {
            fullMessage = `[Attached File: ${attachedFile.name}]\n\n${attachedFile.content}\n\n${textToSend}`;
        }

        // Use chat hook to send message
        await chat.sendMessage(fullMessage);
        setInputValue("");
        setAttachedFile(null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple text extraction for now
        // TODO: Expand to PDF/Docx using a library or service if needed
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            setAttachedFile({
                name: file.name,
                content: text
            });
        };
        reader.readAsText(file);
    };

    const modes = [
        { id: 'general', label: 'General', icon: Sparkles, desc: 'Everyday assistance' },
        { id: 'architect', label: 'Architect (Code)', icon: Terminal, desc: 'Software & Code generation' },
        { id: 'tutor', label: 'Tutor', icon: BookOpen, desc: 'Explanations & learning' },
        { id: 'executive', label: 'Executive', icon: Briefcase, desc: 'Concise summaries' },
    ] as const;

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {!isCompact && (
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Bot className="w-8 h-8 text-primary" />
                            AI Research Assistant
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Powered by OpenAI and Claude Models
                        </p>
                    </div>
                </div>
            )}

            {/* Mode Selector */}
            <div className={cn(
                "grid gap-3 mb-6",
                isCompact ? "grid-cols-4 gap-1 mb-2" : "grid-cols-2 md:grid-cols-4"
            )}>
                {modes.map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => setSelectedMode(mode.id as AgentMode)}
                        className={cn(
                            "flex flex-col items-center p-3 rounded-xl border transition-all hover:bg-muted/50",
                            isCompact ? "p-1.5 border-none bg-muted/20" : "",
                            selectedMode === mode.id
                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                : "border-border bg-card text-muted-foreground"
                        )}
                        title={mode.label}
                    >
                        <mode.icon className={cn("mb-2", isCompact ? "w-4 h-4 mb-0" : "w-5 h-5")} />
                        {!isCompact && <span className="font-semibold text-sm">{mode.label}</span>}
                        {!isCompact && <span className="text-[10px] opacity-70 hidden md:block">{mode.desc}</span>}
                    </button>
                ))}
            </div>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-sm bg-card/50 glass-effect">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-6 max-w-3xl mx-auto">
                        {chat.messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "flex gap-4 w-full",
                                    msg.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {msg.role === 'assistant' && (
                                    <Avatar className="w-8 h-8 border border-primary/20 bg-primary/10">
                                        <AvatarFallback><Bot className="w-5 h-5 text-primary" /></AvatarFallback>
                                    </Avatar>
                                )}

                                <div className={cn(
                                    "rounded-2xl p-4 max-w-[80%] text-sm leading-relaxed shadow-sm relative group",
                                    msg.role === 'user'
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-white dark:bg-zinc-900 border border-border rounded-tl-none"
                                )}>
                                    <div className="whitespace-pre-wrap font-sans">
                                        <Linkify text={msg.content} />
                                    </div>

                                    {/* TTS Button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6",
                                            msg.role === 'user' ? "right-0 text-white" : "left-0 text-muted-foreground"
                                        )}
                                        onClick={() => isSpeaking ? stopSpeaking() : speak(msg.content)}
                                    >
                                        <Volume2 className="w-3 h-3" />
                                    </Button>
                                </div>

                                {msg.role === 'user' && (
                                    <Avatar className="w-8 h-8 border border-border">
                                        <AvatarImage src={user?.photoURL || undefined} />
                                        <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-border bg-card">
                    {/* Attached File Preview */}
                    {attachedFile && (
                        <div className="max-w-3xl mx-auto mb-2 flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border text-xs">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="font-medium truncate flex-1">{attachedFile.name} (Preview loaded)</span>
                            <button onClick={() => setAttachedFile(null)} className="p-1 hover:bg-destructive/10 hover:text-destructive rounded-full">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto relative flex gap-3 items-end">
                        {/* File Upload Trigger */}
                        <div className="flex flex-col gap-2 pb-1">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileUpload}
                                accept=".txt,.md,.js,.ts,.tsx,.json,.csv"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="rounded-full text-muted-foreground hover:text-primary"
                                onClick={() => fileInputRef.current?.click()}
                                title="Attach text file"
                            >
                                <Paperclip className="w-5 h-5" />
                            </Button>
                        </div>

                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder={isListening ? "Listening..." : isProcessing ? "Processing with Whisper..." : `Ask the ${selectedMode} agent anything...`}
                            className="flex-1 min-h-[50px] py-3 pr-12 text-base rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm focus-visible:ring-primary resize-none"
                            disabled={chat.isLoading}
                            autoFocus
                        />

                        <div className="flex gap-2 pb-1">
                            {/* Voice Input Trigger */}
                            {isSpeechSupported && (
                                <Button
                                    type="button"
                                    variant={isListening ? "destructive" : "secondary"}
                                    size="icon"
                                    className="rounded-full h-[42px] w-[42px] shadow-sm"
                                    onClick={isListening ? stopListening : startListening}
                                >
                                    {isListening ? (
                                        <MicOff className="w-5 h-5 animate-pulse" />
                                    ) : (
                                        <Mic className="w-5 h-5" />
                                    )}
                                </Button>
                            )}

                            <Button
                                type="submit"
                                size="icon"
                                disabled={(!inputValue.trim() && !attachedFile) || chat.isLoading}
                                className={cn(
                                    "h-[42px] w-[42px] rounded-full transition-all shadow-sm",
                                    (inputValue.trim() || attachedFile) ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground hover:bg-muted"
                                )}
                            >
                                {chat.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </Button>
                        </div>
                    </form>
                    <p className="text-center text-[10px] text-muted-foreground mt-2">
                        Famio Intelligence can make mistakes. Consider checking important information.
                    </p>
                </div>
            </Card>
        </div>
    );
}
