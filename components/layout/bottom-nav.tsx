"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Users, Bell, User, Menu, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { MobileSidebar } from "./mobile-sidebar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState, useEffect } from "react";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-context";

export function BottomNav() {
    const { t } = useLanguage();
    const pathname = usePathname();
    const router = useRouter();
    const { profile } = useAuth();
    const [open, setOpen] = useState(false);
    const scrollDirection = useScrollDirection();

    // Auto-hide logic: default to visible, hide on scroll down, show on scroll up
    // Also allow manual collapse preference?
    const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpen(false);
    }, [pathname]);

    // React to scroll direction
    useEffect(() => {
        if (scrollDirection === 'down') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsVisible((prev) => (prev ? false : prev));
        } else if (scrollDirection === 'up') {

            setIsVisible((prev) => (!prev ? true : prev));
        }
    }, [scrollDirection]);

    const links = [
        { href: "/", label: t('nav.home'), icon: Home },
        { href: "/companions", label: t('nav.family'), icon: Users },
        { href: "/notifications", label: t("nav.notifications"), icon: Bell },
        { href: "/profile", label: t("nav.profile"), icon: User },
    ];

    const handleNavigation = (href: string, label: string) => {
        try {
            router.push(href);
            // Fallback check
            setTimeout(() => {
                if (pathname !== href) window.location.assign(href);
            }, 300);
        } catch {
            window.location.assign(href);
        }
    };

    const shouldShow = isVisible && !isManuallyCollapsed;

    return (
        <>
            {/* Manual Collapse Toggle (Visible when collapsed or hidden) */}
            <div className={cn(
                "md:hidden fixed bottom-6 right-4 z-[101] transition-all duration-300",
                shouldShow ? "opacity-0 translate-y-10 pointer-events-none" : "opacity-100 translate-y-0"
            )}>
                <Button
                    onClick={() => {
                        setIsManuallyCollapsed(false);
                        setIsVisible(true);
                    }}
                    size="icon"
                    className="h-10 w-10 rounded-full bg-primary/20 backdrop-blur-md border border-primary/20 shadow-lg text-primary hover:bg-primary/30"
                >
                    <ChevronUp className="h-6 w-6" />
                </Button>
            </div>

            <div className={cn(
                "md:hidden fixed bottom-6 left-4 right-4 z-[100] pb-safe transition-all duration-500 ease-in-out transform",
                shouldShow ? "translate-y-0 opacity-100" : "translate-y-[150%] opacity-0"
            )}>
                {/* Floating Glass Island */}
                <div className="relative flex justify-around items-center px-2 py-3 bg-[rgba(11,15,20,0.85)] dark:bg-[rgba(11,15,20,0.85)] backdrop-blur-xl rounded-[24px] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">

                    {/* Collapse Button (Absolute positioned on the bar) */}
                    <button
                        onClick={() => setIsManuallyCollapsed(true)}
                        className="absolute -top-3 right-4 h-6 w-6 bg-background/50 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white shadow-sm"
                    >
                        <ChevronDown className="h-3 w-3" />
                    </button>

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
        </>
    );
}
