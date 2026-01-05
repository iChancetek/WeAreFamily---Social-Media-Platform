"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Send, User, Sparkles, Terminal, BookOpen, Briefcase, Volume2, StopCircle, ArrowLeft, Trash2, LayoutList, PanelLeft, X, Cpu } from "lucide-react";
import { chatWithAgent } from "@/app/actions/ai-agents";
import { AgentMode, AIModel } from "@/types/ai";
import {
    createConversation,
    getConversations,
    getMessages,
    saveMessage,
    softDeleteConversation,
    restoreConversation,
    permanentlyDeleteConversation,
    getTrash,
    AIConversation
} from "@/app/actions/ai-chat";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { Loader2 } from "lucide-react";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export function FullScreenChat() {
    const { user } = useAuth();
    const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();

    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMode, setSelectedMode] = useState<AgentMode>('general');
    const [selectedModel, setSelectedModel] = useState<AIModel>('gpt-4o');

    // Persistence State
    const [conversations, setConversations] = useState<AIConversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showTrash, setShowTrash] = useState(false);
    const [trashItems, setTrashItems] = useState<AIConversation[]>([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Load Conversations on Mount
    useEffect(() => {
        if (user) {
            loadConversations();
        }
    }, [user]);

    // Load Messages when Active Chat Changes
    useEffect(() => {
        if (activeConversationId) {
            loadMessages(activeConversationId);
        } else {
            // New Chat State
            setMessages([{ role: 'assistant', content: "Hello! I am your AI Research Assistant. I can help you find information, write code, or explain complex topics. What are we working on today?" }]);
        }
    }, [activeConversationId]);

    // Cleanup Speech
    useEffect(() => {
        return () => stop();
    }, [stop]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const loadConversations = async () => {
        if (!user) return;
        try {
            const data = await getConversations();
            setConversations(data);
            if (isInitialLoad && data.length > 0) {
                // Optional: Auto-load most recent? For now let's default to New Chat or let user choose
                // setActiveConversationId(data[0].id);
            }
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setIsInitialLoad(false);
        }
    };

    const loadTrash = async () => {
        if (!user) return;
        try {
            const data = await getTrash();
            setTrashItems(data);
        } catch (error) {
            console.error("Failed to load trash", error);
        }
    };

    const loadMessages = async (chatId: string) => {
        setIsLoading(true);
        try {
            const history = await getMessages(chatId);
            if (history.length > 0) {
                setMessages(history);
            } else {
                // Fallback for empty chat
                setMessages([{ role: 'assistant', content: "This conversation is empty." }]);
            }
        } catch (error) {
            console.error("Failed to load messages", error);
            toast.error("Failed to load chat history");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        stop(); // Stop speech
        const userMsg = inputValue.trim();
        setInputValue("");

        // Optimistic UI Update
        const newMessages = [...messages, { role: 'user', content: userMsg } as Message];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            let chatId = activeConversationId;

            // Create new conversation if none active
            if (!chatId) {
                chatId = await createConversation(userMsg, selectedMode, selectedModel);
                setActiveConversationId(chatId);
                // Refresh list without await to not block
                loadConversations();
            } else {
                // Save user message to existing
                await saveMessage(chatId, 'user', userMsg);
            }

            // Get AI Response
            const response = await chatWithAgent(userMsg, selectedMode, selectedModel);
            const aiMsg = response || "I couldn't generate a response.";

            // Save AI message
            await saveMessage(chatId!, 'assistant', aiMsg);

            // Update UI
            setMessages(prev => [...prev, { role: 'assistant', content: aiMsg }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error saving your chat. Please try refreshing." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        setActiveConversationId(null);
        setMessages([{ role: 'assistant', content: "Hello! I am your AI Research Assistant. I can help you find information, write code, or explain complex topics. What are we working on today?" }]);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        try {
            await softDeleteConversation(chatId);
            toast.success("Moved to Trash");
            if (activeConversationId === chatId) handleNewChat();
            loadConversations();
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const handleRestoreChat = async (chatId: string) => {
        try {
            await restoreConversation(chatId);
            toast.success("Restored");
            loadTrash();
            loadConversations();
        } catch (error) {
            toast.error("Failed to restore");
        }
    };

    const handlePermanentDelete = async (chatId: string) => {
        if (!confirm("Permanently delete this chat? This cannot be undone.")) return;
        try {
            await permanentlyDeleteConversation(chatId);
            toast.success("Deleted permanently");
            loadTrash();
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const modes = [
        { id: 'general', label: 'General', icon: Sparkles, desc: 'Everyday assistance' },
        { id: 'architect', label: 'Architect (Code)', icon: Terminal, desc: 'Software & Code generation' },
        { id: 'tutor', label: 'Tutor', icon: BookOpen, desc: 'Explanations & learning' },
        { id: 'executive', label: 'Executive', icon: Briefcase, desc: 'Concise summaries' },
    ] as const;

    // ... UI Layout Refactor ...
    // Since this is a FULL refactor of the render, I'll provide the complete UI structure
    // encompassing Sidebar + Main Chat Area inside the return.

    return (
        <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-border shadow-sm bg-background">

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar History */}
            <div className={cn(
                "flex flex-col w-64 border-r border-border bg-muted/30 absolute md:static z-50 h-full transition-transform duration-300 md:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <span className="font-semibold text-sm">History</span>
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-2">
                    <Button onClick={handleNewChat} className="w-full justify-start gap-2" variant={!activeConversationId ? "secondary" : "ghost"}>
                        <Sparkles className="w-4 h-4 text-primary" />
                        New Research
                    </Button>
                </div>

                <ScrollArea className="flex-1 px-2">
                    {showTrash ? (
                        <div className="space-y-1">
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Trash</div>
                            {trashItems.length === 0 && <p className="text-xs text-muted-foreground p-2 text-center">Trash is empty</p>}
                            {trashItems.map(chat => (
                                <div key={chat.id} className="flex flex-col gap-1 p-2 rounded-lg hover:bg-muted/50 text-sm group border border-transparent hover:border-border">
                                    <div className="font-medium truncate">{chat.title}</div>
                                    <div className="text-xs text-muted-foreground">{formatDistanceToNow(chat.updatedAt)} ago</div>
                                    <div className="flex gap-2 mt-1">
                                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => handleRestoreChat(chat.id)}>Restore</Button>
                                        <Button size="sm" variant="destructive" className="h-6 text-[10px]" onClick={() => handlePermanentDelete(chat.id)}>Delete</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent</div>
                            {conversations.length === 0 && <p className="text-xs text-muted-foreground p-2 text-center">No history yet</p>}
                            {conversations.map(chat => (
                                <button
                                    key={chat.id}
                                    onClick={() => {
                                        setActiveConversationId(chat.id);
                                        if (window.innerWidth < 768) setIsSidebarOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left p-2 rounded-lg text-sm transition-colors flex items-center justify-between group",
                                        activeConversationId === chat.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <div className="truncate flex-1 pr-2">
                                        {chat.title}
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center" onClick={(e) => handleDeleteChat(e, chat.id)}>
                                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-2 border-t border-border">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 text-muted-foreground"
                        onClick={() => {
                            setShowTrash(!showTrash);
                            if (!showTrash) loadTrash();
                        }}
                    >
                        {showTrash ? <ArrowLeft className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                        {showTrash ? "Back to History" : "Trash & Recovery"}
                    </Button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-card/50 glass-effect">
                {/* Header */}
                <div className="h-14 border-b border-border flex items-center px-4 justify-between bg-card/80 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={() => setIsSidebarOpen(true)}>
                            <PanelLeft className="w-5 h-5" />
                        </Button>
                        <Bot className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-sm md:text-base truncate">
                            {activeConversationId ? (conversations.find(c => c.id === activeConversationId)?.title || "Research Session") : "New Research"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Model Selector */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 hidden md:flex border-dashed">
                                    <Cpu className="w-3.5 h-3.5" />
                                    {selectedModel === 'gpt-4o' ? 'GPT-4o' : 'Claude 3.5'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedModel('gpt-4o')} className="gap-2">
                                    <span>GPT-4o</span>
                                    {selectedModel === 'gpt-4o' && <span className="opacity-50 text-xs">(Active)</span>}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedModel('claude-3-5-sonnet-20240620')} className="gap-2">
                                    <span>Claude 3.5 Sonnet</span>
                                    {selectedModel === 'claude-3-5-sonnet-20240620' && <span className="opacity-50 text-xs">(Active)</span>}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Mode Selector - Compact */}
                        <div className="flex bg-muted/50 rounded-lg p-0.5">
                            {modes.map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setSelectedMode(mode.id as AgentMode)}
                                    className={cn(
                                        "p-1.5 rounded-md transition-all",
                                        selectedMode === mode.id
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                    title={mode.label}
                                >
                                    <mode.icon className="w-4 h-4" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-6 max-w-3xl mx-auto pb-4">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "flex gap-4 w-full group relative animate-in fade-in slide-in-from-bottom-2",
                                    msg.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {msg.role === 'assistant' && (
                                    <Avatar className="w-8 h-8 border border-primary/20 bg-primary/10 flex-shrink-0 mt-1">
                                        <AvatarFallback><Bot className="w-5 h-5 text-primary" /></AvatarFallback>
                                    </Avatar>
                                )}

                                <div className={cn(
                                    "rounded-2xl p-4 max-w-[85%] md:max-w-[75%] text-sm leading-relaxed shadow-sm relative",
                                    msg.role === 'user'
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-white dark:bg-zinc-900 border border-border rounded-tl-none pr-10"
                                )}>
                                    <div className="whitespace-pre-wrap font-sans">
                                        {msg.content}
                                    </div>

                                    {/* TTS Button */}
                                    {msg.role === 'assistant' && isSupported && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary"
                                                onClick={() => speak(msg.content)}
                                            >
                                                <Volume2 className="h-3.5 w-3.5" />
                                                <span className="sr-only">Read Aloud</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-4 w-full justify-start animate-pulse">
                                <Avatar className="w-8 h-8 border border-primary/20 bg-primary/10 flex-shrink-0">
                                    <AvatarFallback><Bot className="w-5 h-5 text-primary" /></AvatarFallback>
                                </Avatar>
                                <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm">
                    <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto relative flex gap-3">
                        {isSpeaking && (
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="rounded-full shadow-lg gap-2"
                                    onClick={stop}
                                >
                                    <StopCircle className="h-4 w-4 animate-pulse" />
                                    Stop Speaking
                                </Button>
                            </div>
                        )}
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={`Message ${selectedMode} agent...`}
                            className="flex-1 min-h-[50px] pr-12 text-base rounded-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm focus-visible:ring-primary"
                            disabled={isLoading}
                            autoFocus
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!inputValue.trim() || isLoading}
                            className={cn(
                                "absolute right-1.5 top-1.5 h-[38px] w-[38px] rounded-full transition-all",
                                inputValue.trim() ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground hover:bg-muted"
                            )}
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </Button>
                    </form>
                    <p className="text-center text-[10px] text-muted-foreground mt-2">
                        AI responses are auto-saved.
                    </p>
                </div>
            </div>
        </div>
    );
}
