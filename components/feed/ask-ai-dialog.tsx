"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, FileText, HelpCircle, AlertTriangle, MessageSquare, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createConversation } from "@/app/actions/ai-chat";
import { toast } from "sonner";

interface AskAIDialogProps {
    isOpen: boolean;
    onClose: () => void;
    postContent: string;
    postAuthor: string;
}

export function AskAIDialog({ isOpen, onClose, postContent, postAuthor }: AskAIDialogProps) {
    const [customQuery, setCustomQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleAction = async (action: string) => {
        setIsLoading(true);
        try {
            let prompt = "";
            const context = `Context (Post by ${postAuthor}):\n"${postContent.substring(0, 1000)}${postContent.length > 1000 ? '...' : ''}"\n\n`;

            switch (action) {
                case 'summarize':
                    prompt = `${context}User Request:\nPlease summarize the key points of this post.`;
                    break;
                case 'explain':
                    prompt = `${context}User Request:\nPlease explain the concepts or context mentioned in this post in simple terms.`;
                    break;
                case 'fact-check':
                    prompt = `${context}User Request:\nPlease fact-check any claims made in this post and provide context if needed.`;
                    break;
                default: // Custom
                    if (!customQuery.trim()) return;
                    prompt = `${context}User Request:\n${customQuery}`;
                    break;
            }

            // Create conversation and redirect
            const chatId = await createConversation(prompt, 'general', 'gpt-4o');

            toast.success("Opening AI Chat...");
            router.push(`/chat?id=${chatId}`);
            onClose();
        } catch (error) {
            console.error("Failed to start chat", error);
            toast.error("Failed to start AI chat");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Ask AI about this Post
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground italic border border-border/50 max-h-24 overflow-y-auto">
                        "{postContent.substring(0, 200)}{postContent.length > 200 ? '...' : ''}"
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => handleAction('summarize')} disabled={isLoading}>
                            <FileText className="w-4 h-4 text-blue-500" />
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-xs">Summarize</span>
                                <span className="text-[10px] text-muted-foreground font-normal">Get key points</span>
                            </div>
                        </Button>
                        <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => handleAction('explain')} disabled={isLoading}>
                            <HelpCircle className="w-4 h-4 text-green-500" />
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-xs">Explain</span>
                                <span className="text-[10px] text-muted-foreground font-normal">Simple terms</span>
                            </div>
                        </Button>
                        <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => handleAction('fact-check')} disabled={isLoading}>
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-xs">Fact Check</span>
                                <span className="text-[10px] text-muted-foreground font-normal">Verify claims</span>
                            </div>
                        </Button>
                        <Button variant="outline" className="justify-start gap-2 h-auto py-3 opacity-50 cursor-not-allowed" disabled={true}>
                            <MessageSquare className="w-4 h-4 text-purple-500" />
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-xs">Critique</span>
                                <span className="text-[10px] text-muted-foreground font-normal">Coming soon</span>
                            </div>
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or ask specific question</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g. What does the author mean by..."
                            value={customQuery}
                            onChange={(e) => setCustomQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAction('custom')}
                            disabled={isLoading}
                        />
                        <Button size="icon" onClick={() => handleAction('custom')} disabled={isLoading || !customQuery.trim()}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
