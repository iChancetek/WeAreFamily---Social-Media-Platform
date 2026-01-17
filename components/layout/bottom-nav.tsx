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
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-[100] pb-safe">
            {/* Floating Glass Island */}
            <div className="flex justify-around items-center px-2 py-3 bg-[rgba(11,15,20,0.85)] dark:bg-[rgba(11,15,20,0.85)] backdrop-blur-xl rounded-[24px] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
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
                            className={cn(
                                "relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 w-16 group",
                                isActive ? "text-primary" : "text-zinc-400 hover:text-white"
                            )}
                            type="button"
                        >
                            {/* Active Background Glow */}
                            {isActive && (
                                <div className="absolute inset-0 bg-primary/10 blur-md rounded-full transform scale-75" />
                            )}

                            <link.icon
                                className={cn(
                                    "w-6 h-6 transition-all duration-300 relative z-10",
                                    isActive ? "-translate-y-1 scale-110 drop-shadow-[0_0_8px_rgba(111,76,255,0.6)]" : "scale-100"
                                )}
                                strokeWidth={isActive ? 2.5 : 2}
                            />

                            {/* Animated Label */}
                            <span className={cn(
                                "text-[10px] font-medium mt-1 transition-all duration-300 relative z-10",
                                isActive ? "text-white opacity-100 translate-y-0" : "opacity-0 -translate-y-2 absolute"
                            )}>
                                {link.label}
                            </span>

                            {/* Active Dot */}
                            {isActive && (
                                <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_currentColor]" />
                            )}
                        </button>
                    );
                })}

                {/* Menu Trigger */}
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <button
                            className="relative flex flex-col items-center justify-center p-2 rounded-xl text-zinc-400 hover:text-white transition-colors w-16"
                            type="button"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="p-0 h-[80vh] rounded-t-[32px] border-t border-white/10 bg-[#0B0F14]/95 backdrop-blur-xl">
                        <VisuallyHidden>
                            <SheetTitle>Navigation Menu</SheetTitle>
                            <SheetDescription>Main navigation links</SheetDescription>
                        </VisuallyHidden>
                        <div className="p-6 h-full overflow-y-auto">
                            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-8" /> {/* Drag Handle */}
                            <MobileSidebar className="w-full h-full bg-transparent shadow-none border-none p-0" onLinkClick={() => setOpen(false)} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}
