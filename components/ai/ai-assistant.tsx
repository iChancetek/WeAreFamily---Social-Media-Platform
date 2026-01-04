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

export function AIAssistant() {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [externalContext, setExternalContext] = useState<string | null>(null)
    const [isSeeding, setIsSeeding] = useState(false)

    // Listen for custom "Open AI" events from other components
    useEffect(() => {
        const handleOpenAI = (e: any) => {
            const { context } = e.detail || {};
            setIsOpen(true);
            if (context) {
                setExternalContext(context);
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
                <Card className="w-[350px] md:w-[400px] h-[500px] shadow-2xl border-blue-200 flex flex-col bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 flex flex-row items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-yellow-300" />
                            <CardTitle className="text-base">Famio Intelligence</CardTitle>
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
                            onContextHandled={() => setExternalContext(null)}
                        />
                    </CardContent>
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
