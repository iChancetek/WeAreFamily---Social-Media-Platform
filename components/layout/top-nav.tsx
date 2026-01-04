'use client'

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Heart } from "lucide-react";
import { Sidebar } from "./sidebar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function TopNav({ className }: { className?: string }) {
    const [open, setOpen] = useState(false);

    return (
        <header className={`flex items-center justify-between px-4 h-14 text-white relative z-50 ${className}`}>
            <div className="flex items-center gap-2 font-bold text-lg text-primary">
                <Heart className="w-5 h-5 fill-current" />
                WeAreFamily
            </div>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="w-5 h-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                    <VisuallyHidden>
                        <SheetTitle>Navigation Menu</SheetTitle>
                        <SheetDescription>Main navigation links</SheetDescription>
                    </VisuallyHidden>
                    <Sidebar className="static w-full h-full border-none" onLinkClick={() => setOpen(false)} />
                </SheetContent>
            </Sheet>
        </header>
    );
}
