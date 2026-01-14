/**
 * Memory Controls Component
 * Allows users to manage conversation memory and privacy settings
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash2, Brain } from 'lucide-react';
import { toast } from 'sonner';

interface MemoryControlsProps {
    memoryEnabled: boolean;
    onMemoryToggle: (enabled: boolean) => void;
    onClearHistory: () => void;
}

export function MemoryControls({
    memoryEnabled,
    onMemoryToggle,
    onClearHistory,
}: MemoryControlsProps) {
    const [showClearDialog, setShowClearDialog] = useState(false);

    const handleClearHistory = () => {
        onClearHistory();
        setShowClearDialog(false);
        toast.success('Conversation history cleared');
    };

    return (
        <div className="p-4 border-t border-border bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <Label htmlFor="memory-toggle" className="text-sm font-medium">
                        Remember Conversations
                    </Label>
                </div>
                <Switch
                    id="memory-toggle"
                    checked={memoryEnabled}
                    onCheckedChange={onMemoryToggle}
                />
            </div>

            <p className="text-xs text-muted-foreground">
                When enabled, the AI will remember your conversation history to provide
                better context-aware responses.
            </p>

            <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        disabled={!memoryEnabled}
                    >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Clear History
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear Conversation History?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all messages in this conversation.
                            The AI will no longer remember this conversation context. This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClearHistory}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Clear History
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
