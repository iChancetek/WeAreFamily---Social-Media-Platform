'use client'

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Heart } from "lucide-react";
import { MobileSidebar } from "./mobile-sidebar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useVoice } from "@/components/ai/voice-provider";
import { VoiceStatusIndicator } from "@/components/ai/voice-status-indicator";

export function TopNav({ className }: { className?: string }) {
    const [open, setOpen] = useState(false);
    const { state: aiState, toggleContinuous } = useVoice();

    return (
        <header className={`flex items-center justify-between px-4 h-16 fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${className} bg-background/80 backdrop-blur-md border-b border-white/5`}>
            {/* Logo Area */}
            <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-8 h-8">
                    <img src="/icons/icon-72x72.png" alt="Famio" className="w-6 h-6" />
                </div>
                <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                    Famio
                </span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
                {/* Mobile AI Status Orb (Mini) */}
                <div className="mr-2">
                    <VoiceStatusIndicator
                        state={aiState}
                        onClick={toggleContinuous}
                        className="w-10 h-10 p-1 bg-transparent hover:bg-white/10 border-none"
                    />
                </div>

                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full w-10 h-10">
                            <Menu className="w-6 h-6 text-zinc-300" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[85vw] max-w-[300px] border-r border-white/10 bg-[#0B0F14]">
                        <VisuallyHidden>
                            <SheetTitle>Navigation Menu</SheetTitle>
                            <SheetDescription>Main navigation links</SheetDescription>
                        </VisuallyHidden>
                        <MobileSidebar className="w-full h-full bg-transparent" onLinkClick={() => setOpen(false)} />
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}
