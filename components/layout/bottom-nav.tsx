"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Users, Bell, User, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { MobileSidebar } from "./mobile-sidebar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState, useEffect } from "react";

export function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { profile } = useAuth();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpen(false);
    }, [pathname]);

    const links = [
        { href: "/", label: "Home", icon: Home },
        { href: "/family", label: "Family", icon: Users },
        { href: "/notifications", label: "Alerts", icon: Bell },
        { href: "/profile", label: "Profile", icon: User },
    ];

    const handleNavigation = (href: string, label: string) => {
        console.log('🔵 BOTTOM NAV CLICK:', label, href);

        try {
            console.log('🔵 Attempting navigation to:', href);
            router.push(href);

            // Fallback to window.location after a short delay if router doesn't work
            setTimeout(() => {
                if (pathname === href) {
                    console.log('🔵 Already at destination, no navigation needed');
                } else {
                    console.log('🔵 Using window.location fallback');
                    window.location.assign(href);
                }
            }, 300);

        } catch (error) {
            console.error('🔴 Navigation error:', error);
            window.location.assign(href);
        }
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t border-gray-200 dark:border-white/10 px-4 py-2 flex justify-around items-center z-[100] pb-safe shadow-xl">
            {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                    <button
                        key={link.href}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleNavigation(link.href, link.label);
                        }}
                        onTouchStart={() => console.log('🔵 Bottom nav touch:', link.label)}
                        className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-lg transition-colors cursor-pointer border-none bg-transparent",
                            isActive
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground active:text-foreground"
                        )}
                        type="button"
                    >
                        <link.icon className={cn("w-6 h-6", isActive && "fill-current")} />
                        <span className="text-[10px] font-medium mt-1">{link.label}</span>
                    </button>
                );
            })}

            {/* Menu Trigger for the rest of the items */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <button
                        className="flex flex-col items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground active:text-foreground cursor-pointer border-none bg-transparent"
                        type="button"
                    >
                        <Menu className="w-6 h-6" />
                        <span className="text-[10px] font-medium mt-1">Menu</span>
                    </button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                    <VisuallyHidden>
                        <SheetTitle>Navigation Menu</SheetTitle>
                        <SheetDescription>Main navigation links</SheetDescription>
                    </VisuallyHidden>
                    <MobileSidebar className="w-full h-full" onLinkClick={() => setOpen(false)} />
                </SheetContent>
            </Sheet>
        </div>
    );
}
