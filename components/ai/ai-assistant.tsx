"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Sparkles, X, Database, Loader2 } from "lucide-react"
import { seedKnowledgeBase } from "@/app/actions/ai-agents"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ChatInterface } from "@/components/ai/chat-interface"
import { useAuth } from "@/components/auth-provider"
import { AgentMode } from "@/types/ai"

export function AIAssistant() {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [externalContext, setExternalContext] = useState<string | null>(null)
    const [mode, setMode] = useState<AgentMode>('general')
    const [isSeeding, setIsSeeding] = useState(false)

    // Listen for custom "Open AI" events from other components
    useEffect(() => {
        const handleOpenAI = (e: any) => {
            const { context, mode: newMode } = e.detail || {};
            setIsOpen(true);
            if (context) {
                setExternalContext(context);
            }
            if (newMode) {
                setMode(newMode);
            }
        };

        window.addEventListener('famio:open-ai', handleOpenAI);
        return () => window.removeEventListener('famio:open-ai', handleOpenAI);
    }, []);

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

    if (!user) return null

    return (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[30] flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            <div className={cn(
                "mb-4 transition-all duration-300 origin-bottom-right pointer-events-auto",
                isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 h-0 w-0 overflow-hidden"
            )}>
                <Card className="w-[350px] md:w-[400px] h-[600px] shadow-real border-primary/20 flex flex-col bg-white dark:bg-zinc-950 backdrop-blur-md overflow-hidden rounded-[2.5rem]">
                    <CardHeader className="bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 text-white p-5 flex flex-row items-center justify-between shrink-0 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/20">
                                <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                            </div>
                            <CardTitle className="text-xl font-black tracking-tighter leading-none">famio Intelligence</CardTitle>
                        </div>
                        <div className="flex items-center gap-1">
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

                    <CardContent className="flex-1 overflow-hidden p-0 relative flex flex-col">
                        <ChatInterface
                            isCompact={true}
                            externalContext={externalContext}
                            initialMode={mode}
                            onContextHandled={() => setExternalContext(null)}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Toggle Button */}
            <Button
                size="lg"
                className={cn(
                    "h-18 w-18 rounded-[2rem] shadow-glow-lg shadow-primary/40 bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 hover:from-indigo-700 hover:via-blue-700 hover:to-violet-700 text-white transition-all duration-500 hover:scale-110 active:scale-90 border-2 border-white/30 pointer-events-auto",
                    isOpen ? "rotate-90 scale-0 opacity-0" : "scale-100 opacity-100"
                )}
                onClick={() => setIsOpen(true)}
            >
                <Sparkles className="w-10 h-10 animate-pulse fill-white" />
            </Button>
        </div>
    )
}
