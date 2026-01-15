"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToneSelector } from "./tone-selector";
import { X, ArrowLeft, Check, Edit3, Loader2 } from "lucide-react";
import type { EmotionalTone } from "@/types/magic-ai";

interface AIPreviewPanelProps {
    isOpen: boolean;
    onClose: () => void;
    originalContent: string;
    enhancedContent: string | null;
    selectedTone: EmotionalTone | null;
    isGenerating: boolean;
    onSelectTone: (tone: EmotionalTone) => void;
    onAccept: () => void;
    onRevert: () => void;
}

export function AIPreviewPanel({
    isOpen,
    onClose,
    originalContent,
    enhancedContent,
    selectedTone,
    isGenerating,
    onSelectTone,
    onAccept,
    onRevert
}: AIPreviewPanelProps) {
    const showPreview = enhancedContent !== null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-2xl">✨</span>
                        <span>Magic AI - Emotional Intelligence</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Tone Selector */}
                    <ToneSelector
                        selectedTone={selectedTone}
                        onSelectTone={onSelectTone}
                        disabled={isGenerating}
                    />

                    {/* Loading State */}
                    {isGenerating && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-3">
                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">
                                Generating your {selectedTone?.replace('_', ' ')} content...
                            </p>
                        </div>
                    )}

                    {/* Preview Comparison */}
                    {showPreview && !isGenerating && (
                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Original Content */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-xs">
                                            Original
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {originalContent.length} characters
                                        </span>
                                    </div>
                                    <div className="p-4 bg-muted rounded-lg border border-border min-h-[120px]">
                                        <p className="text-sm whitespace-pre-wrap">{originalContent}</p>
                                    </div>
                                </div>

                                {/* Enhanced Content */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                                            ✨ Magic AI Enhanced
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {enhancedContent.length} characters
                                        </span>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-primary/5 to-purple/5 rounded-lg border border-primary/20 min-h-[120px]">
                                        <p className="text-sm whitespace-pre-wrap">{enhancedContent}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col-reverse md:flex-row gap-3 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={onRevert}
                                    className="gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Revert to Original
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        // Re-open tone selector
                                        onRevert();
                                    }}
                                    className="gap-2"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Try Another Tone
                                </Button>

                                <Button
                                    onClick={onAccept}
                                    className="gap-2 bg-primary hover:bg-primary/90 flex-1"
                                >
                                    <Check className="w-4 h-4" />
                                    Use This Content
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Empty State - Waiting for tone selection */}
                    {!showPreview && !isGenerating && (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">
                                Select a tone above to see your enhanced content
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
