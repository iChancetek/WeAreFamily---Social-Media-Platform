"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Sparkles, Send, X, MessageCircle, Bot, User, Loader2, Database } from "lucide-react"
import { chatWithAI, seedKnowledgeBase } from "@/app/actions/ai"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

type Message = {
    role: 'user' | 'assistant';
    content: string;
}

export function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hi! I'm the Famio AI. 👋 Ask me anything about the platform!" }
    ])
    const [inputValue, setInputValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSeeding, setIsSeeding] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Auto-scroll to bottom
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, isOpen])

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!inputValue.trim() || isLoading) return

        const userMsg = inputValue.trim()
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setInputValue("")
        setIsLoading(true)

        try {
            const response = await chatWithAI(userMsg)
            setMessages(prev => [...prev, { role: 'assistant', content: response || "I couldn't find an answer to that." }])
        } catch (error) {
            console.error(error)
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSeed = async () => {
        setIsSeeding(true)
        try {
            toast.info("Updating AI Knowledge Base...")
            await seedKnowledgeBase()
            toast.success("Knowledge Base Updated Successfully!")
        } catch (e) {
            toast.error("Failed to seed knowledge base")
        } finally {
            setIsSeeding(false)
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            <div className={cn(
                "mb-4 transition-all duration-300 origin-bottom-right pointer-events-auto",
                isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 h-0 w-0 overflow-hidden"
            )}>
                <Card className="w-[350px] md:w-[400px] h-[500px] shadow-2xl border-blue-200 flex flex-col bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl p-4 flex flex-row items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-yellow-300" />
                            <CardTitle className="text-lg">Famio Assistant</CardTitle>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Hidden 'Power User' feature to re-seed DB */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/20"
                                onClick={handleSeed}
                                title="Refresh Knowledge Base"
                                disabled={isSeeding}
                            >
                                {isSeeding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => setIsOpen(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-hidden p-0 relative">
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-4">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={cn("flex gap-2", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                        {msg.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                <Bot className="w-5 h-5 text-blue-600" />
                                            </div>
                                        )}
                                        <div className={cn(
                                            "rounded-2xl px-4 py-2 max-w-[80%] text-sm",
                                            msg.role === 'user'
                                                ? "bg-blue-600 text-white rounded-tr-none"
                                                : "bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-100 rounded-tl-none"
                                        )}>
                                            {msg.content}
                                        </div>
                                        {msg.role === 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                                <User className="w-5 h-5 text-indigo-600" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-2 justify-start">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Bot className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="bg-gray-100 dark:bg-zinc-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>

                    <CardFooter className="p-3 border-t bg-gray-50 dark:bg-zinc-900/50">
                        <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
                            <Input
                                placeholder="Ask about Famio..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="flex-1 bg-white dark:bg-zinc-950"
                                disabled={isLoading}
                            />
                            <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} className="bg-blue-600 hover:bg-blue-700">
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            </div>

            {/* Toggle Button */}
            <Button
                size="lg"
                className={cn(
                    "h-14 w-14 rounded-full shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-transform duration-300 pointer-events-auto",
                    isOpen ? "rotate-90 scale-0 opacity-0" : "scale-100 opacity-100"
                )}
                onClick={() => setIsOpen(true)}
            >
                <Sparkles className="w-6 h-6 animate-pulse" />
            </Button>
        </div>
    )
}
