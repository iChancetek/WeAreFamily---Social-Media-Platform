'use client'

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Heart } from "lucide-react";
import { Sidebar } from "./sidebar";

export function TopNav({ className }: { className?: string }) {
    return (
        <header className={`flex items-center justify-between px-4 h-14 text-white ${className}`}>
            <div className="flex items-center gap-2 font-bold text-lg text-primary">
                <Heart className="w-5 h-5 fill-current" />
                WeAreFamily
            </div>
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="w-5 h-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                    <Sidebar />
                </SheetContent>
            </Sheet>
        </header>
    );
}
