
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Send, User, Sparkles, Terminal, BookOpen, Briefcase, Volume2, Square, StopCircle } from "lucide-react";
import { chatWithAgent, AgentMode } from "@/app/actions/ai-agents";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { Loader2 } from "lucide-react";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export function FullScreenChat() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hello! I am your AI Research Assistant. I can help you find information, write code, or explain complex topics. What are we working on today?" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMode, setSelectedMode] = useState<AgentMode>('general');
    const scrollRef = useRef<HTMLDivElement>(null);
    const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();

    useEffect(() => {
        // Stop speech when unmounting or changing modes
        return () => stop();
    }, [stop]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        // Stop any current speech
        stop();

        const userMsg = inputValue.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInputValue("");
        setIsLoading(true);

        try {
            const response = await chatWithAgent(userMsg, selectedMode);
            const aiMsg = response || "I couldn't generate a response.";
            setMessages(prev => [...prev, { role: 'assistant', content: aiMsg }]);

            // Auto-speak response if desired? Maybe let user click.
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const modes = [
        { id: 'general', label: 'General', icon: Sparkles, desc: 'Everyday assistance' },
        { id: 'architect', label: 'Architect (Code)', icon: Terminal, desc: 'Software & Code generation' },
        { id: 'tutor', label: 'Tutor', icon: BookOpen, desc: 'Explanations & learning' },
        { id: 'executive', label: 'Executive', icon: Briefcase, desc: 'Concise summaries' },
    ] as const;

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Bot className="w-8 h-8 text-primary" />
                    AI Research Assistant
                </h1>
                <p className="text-muted-foreground mt-1">
                    Powered by Famio Universal Intelligence (GPT-4o)
                </p>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {modes.map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => setSelectedMode(mode.id as AgentMode)}
                        className={cn(
                            "flex flex-col items-center p-3 rounded-xl border transition-all hover:bg-muted/50",
                            selectedMode === mode.id
                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                : "border-border bg-card text-muted-foreground"
                        )}
                    >
                        <mode.icon className="w-5 h-5 mb-2" />
                        <span className="font-semibold text-sm">{mode.label}</span>
                        <span className="text-[10px] opacity-70 hidden md:block">{mode.desc}</span>
                    </button>
                ))}
            </div>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-sm bg-card/50 glass-effect">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-6 max-w-3xl mx-auto">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "flex gap-4 w-full group relative",
                                    msg.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {msg.role === 'assistant' && (
                                    <Avatar className="w-8 h-8 border border-primary/20 bg-primary/10 flex-shrink-0">
                                        <AvatarFallback><Bot className="w-5 h-5 text-primary" /></AvatarFallback>
                                    </Avatar>
                                )}

                                <div className={cn(
                                    "rounded-2xl p-4 max-w-[80%] text-sm leading-relaxed shadow-sm relative",
                                    msg.role === 'user'
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-white dark:bg-zinc-900 border border-border rounded-tl-none pr-10" // Extra padding for speaker icon
                                )}>
                                    <div className="whitespace-pre-wrap font-sans">
                                        {msg.content}
                                    </div>

                                    {/* TTS Button for Assistant */}
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

                                {msg.role === 'user' && (
                                    <Avatar className="w-8 h-8 border border-border flex-shrink-0">
                                        <AvatarImage src={user?.photoURL || undefined} />
                                        <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                        {isSpeaking && (
                            <div className="sticky bottom-4 left-1/2 -translate-x-1/2 z-10">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="rounded-full shadow-lg gap-2 animate-in fade-in slide-in-from-bottom-2"
                                    onClick={stop}
                                >
                                    <StopCircle className="h-4 w-4 animate-pulse" />
                                    Stop Speaking
                                </Button>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-border bg-card">
                    <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto relative flex gap-3">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={`Ask the ${selectedMode} agent anything...`}
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
                        Famio Intelligence can make mistakes. Consider checking important information.
                    </p>
                </div>
            </Card>
        </div>
    );
}
