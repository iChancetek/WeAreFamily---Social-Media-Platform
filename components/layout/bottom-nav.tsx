"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Bell, User, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState } from "react";

export function BottomNav() {
    const pathname = usePathname();
    const { profile } = useAuth();
    const [open, setOpen] = useState(false);

    const links = [
        { href: "/", label: "Home", icon: Home },
        { href: "/family", label: "Family", icon: Users },
        { href: "/notifications", label: "Alerts", icon: Bell },
        { href: "/profile", label: "Profile", icon: User },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t border-gray-200 dark:border-white/10 px-4 py-2 flex justify-around items-center z-[100] pb-safe shadow-xl">
            {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                            isActive
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <link.icon className={cn("w-6 h-6", isActive && "fill-current")} />
                        <span className="text-[10px] font-medium mt-1">{link.label}</span>
                    </Link>
                );
            })}

            {/* Menu Trigger for the rest of the items */}
            {/* Menu Trigger for the rest of the items */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <button className="flex flex-col items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground">
                        <Menu className="w-6 h-6" />
                        <span className="text-[10px] font-medium mt-1">Menu</span>
                    </button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                    <VisuallyHidden>
                        <SheetTitle>Navigation Menu</SheetTitle>
                        <SheetDescription>Main navigation links</SheetDescription>
                    </VisuallyHidden>
                    <Sidebar className="static w-full h-full border-none" onLinkClick={() => setOpen(false)} />
                </SheetContent>
            </Sheet>
        </div>
    );
}
