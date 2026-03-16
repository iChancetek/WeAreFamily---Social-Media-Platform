'use client';

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Smile } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EMOJI_CATEGORIES = [
    {
        name: 'Smileys',
        icon: '😀',
        emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩']
    },
    {
        name: 'Gestures',
        icon: '👍',
        emojis: ['👍', '👎', '👌', '🤌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '🤝', '🙏', '👏', '🙌']
    },
    {
        name: 'Hearts',
        icon: '❤️',
        emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟']
    },
    {
        name: 'Party',
        icon: '🎉',
        emojis: ['🎉', '🥳', '🎈', '🎁', '🎂', '🎊', '🎀', '🪄', '✨', '🌟', '⭐', '🔥', '⚡', '🌈', '☀️', '☁️', '❄️', '🌸', '🌻']
    }
];

export function EmojiPicker({ onEmojiSelect, align = "end" }: { onEmojiSelect: (emoji: string) => void, align?: "start" | "end" }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground shrink-0">
                    <Smile className="w-5 h-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-[280px] p-2 bg-background/95 backdrop-blur-sm z-50 shadow-xl border border-border/50">
                <Tabs defaultValue="Smileys" className="w-full">
                    <TabsList className="grid grid-cols-4 h-8 p-0.5 bg-muted/50 rounded-lg">
                        {EMOJI_CATEGORIES.map(cat => (
                            <TabsTrigger key={cat.name} value={cat.name} className="px-0 text-base data-[state=active]:bg-background">
                                {cat.icon}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {EMOJI_CATEGORIES.map(cat => (
                        <TabsContent key={cat.name} value={cat.name} className="mt-2 focus-visible:outline-none">
                            <div className="grid grid-cols-6 gap-1 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                                {cat.emojis.map(emoji => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => onEmojiSelect(emoji)}
                                        className="text-xl p-1.5 hover:bg-muted rounded-md hover:scale-125 transition-all text-center focus-visible:outline-none focus:bg-muted"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
