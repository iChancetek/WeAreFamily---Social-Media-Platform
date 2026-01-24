"use client";

import { useAuth } from "@/components/auth-provider";
import { LogOut, Home, Users, MessageSquare, Ticket, Image as ImageIcon, Settings, Shield, Tent, Heart, Briefcase, Bell, User, Video, Bot, Newspaper, Sun, Moon, Laptop } from "lucide-react";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-context";
import { useTheme } from "next-themes";

interface MobileSidebarProps {
    isAdmin?: boolean;
    className?: string;
    onLinkClick?: () => void;
}

export function MobileSidebar({ isAdmin, className, onLinkClick }: MobileSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOut, profile } = useAuth();
    const { t } = useLanguage();
    const { theme, setTheme } = useTheme();

    const handleNavigation = (href: string, label: string) => {
        console.log('🔵 MOBILE NAV CLICK:', label, href);

        try {
            // Close the sheet
            if (onLinkClick) {
                console.log('🔵 Calling onLinkClick to close sheet');
                onLinkClick();
            }

            // Navigate immediately using window.location as fallback
            console.log('🔵 Attempting navigation to:', href);

            // Try router.push first
            router.push(href);

            // Fallback to window.location after a short delay if router doesn't work
            setTimeout(() => {
                if (pathname === href) {
                    console.log('🔵 Already at destination, no navigation needed');
                } else {
                    console.log('🔵 Using window.location fallback');
                    window.location.href = href;
                }
            }, 300);

        } catch (error) {
            console.error('🔴 Navigation error:', error);
            // Ultimate fallback
            window.location.href = href;
        }
    };

    const groups = [
        {
            title: t("nav.section.main"),
            items: [
                { href: "/", label: t("nav.home"), icon: Home },
                { href: "/profile", label: profile?.displayName || t("nav.profile"), icon: User },
                { href: "/family", label: t("nav.family"), icon: Users },
                { href: "/groups", label: t("nav.groups"), icon: Tent },
                { href: "/chat", label: t("nav.ai"), icon: Bot },
            ]
        },
        {
            title: t("nav.section.discover"),
            items: [
                { href: "/messages", label: t("nav.messages"), icon: MessageSquare },
                { href: "/news", label: t("nav.news"), icon: Newspaper },
                { href: "/live", label: t("nav.social.live"), icon: Video },
                { href: "/events", label: t("nav.social.events"), icon: Ticket },
                { href: "/gallery", label: t("nav.social.gallery"), icon: ImageIcon },
            ]
        },
        {
            title: t("nav.section.system"),
            items: [
                { href: "/branding", label: t("nav.branding"), icon: Briefcase },
                { href: "/notifications", label: t("nav.notifications"), icon: Bell },
                { href: "/settings", label: t("nav.settings"), icon: Settings },
            ]
        }
    ];

    if (isAdmin) {
        groups.push({
            title: t("nav.admin"),
            items: [
                { href: "/admin", label: t("nav.admin"), icon: Shield }
            ]
        });
    }

    // Helper for theme labels
    const getThemeLabel = (mode: string) => {
        switch (mode) {
            case 'light': return t('theme.light');
            case 'dark': return t('theme.dark');
            case 'system': return t('theme.system');
            default: return mode;
        }
    };

    return (
        <div className={cn("flex flex-col h-full py-4 overflow-y-auto bg-transparent", className)}>
            {/* Header / Logo */}
            <div className="px-6 py-4 flex-shrink-0 mb-6">
                <button
                    className="flex items-center gap-3 cursor-pointer border-none bg-transparent p-0 group"
                    onClick={() => handleNavigation("/", "Logo")}
                    type="button"
                >
                    <div className="relative flex items-center justify-center w-10 h-10">
                        <img src="/icons/icon-72x72.png" alt="Famio" className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400">
                        Famio
                    </span>
                </button>
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 px-4 space-y-8">
                {groups.map((group) => (
                    <div key={group.title} className="space-y-2">
                        {/* Section Title */}
                        {group.title !== t("nav.section.main") && (
                            <h4 className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 opacity-80">
                                {group.title}
                            </h4>
                        )}

                        {group.items.map((link) => {
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
                                        "relative flex items-center gap-4 w-full text-base font-medium transition-all h-14 rounded-2xl px-4",
                                        "border-none bg-transparent text-left cursor-pointer group overflow-hidden",
                                        isActive
                                            ? "text-primary dark:text-white"
                                            : "text-zinc-600 dark:text-zinc-400 hover:text-primary dark:hover:text-white"
                                    )}
                                    type="button"
                                >
                                    {/* Active Background Glow */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-primary/10 dark:bg-white/5 border border-primary/20 dark:border-white/10 rounded-2xl" />
                                    )}

                                    {/* Hover Effect */}
                                    <div className="absolute inset-0 bg-zinc-100/50 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                                    <div className={cn(
                                        "relative z-10 p-2 rounded-xl transition-all duration-300",
                                        isActive ? "bg-primary/20 text-primary dark:bg-white/10 dark:text-white" : "bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 group-hover:scale-110"
                                    )}>
                                        <link.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                                    </div>

                                    <span className={cn("relative z-10 font-medium tracking-wide", isActive && "font-semibold")}>
                                        {link.label}
                                    </span>

                                    {link.href === '/notifications' && (
                                        <div className="ml-auto relative z-10">
                                            <NotificationBadge />
                                        </div>
                                    )}

                                    {/* Active Indicator Arrow */}
                                    {isActive && (
                                        <div className="absolute right-4 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_currentColor]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Footer Actions */}
            <div className="px-4 mt-8 pb-8 space-y-6">
                {/* Theme Toggle */}
                <div className="p-1.5 bg-zinc-100 dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/5 flex gap-1">
                    {['light', 'dark', 'system'].map((tMode) => (
                        <button
                            key={tMode}
                            onClick={() => setTheme(tMode)}
                            className={cn(
                                "flex-1 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2",
                                theme === tMode
                                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                            )}
                        >
                            {tMode === 'light' && <Sun className="w-4 h-4" />}
                            {tMode === 'dark' && <Moon className="w-4 h-4" />}
                            {tMode === 'system' && <Laptop className="w-4 h-4" />}
                            <span className="capitalize">{getThemeLabel(tMode)}</span>
                        </button>
                    ))}
                </div>

                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl h-14 px-4 text-base font-medium"
                    onClick={() => {
                        if (onLinkClick) onLinkClick();
                        signOut();
                    }}
                >
                    <div className="p-2 bg-red-500/10 rounded-xl">
                        <LogOut className="h-5 w-5" />
                    </div>
                    {t("nav.signout")}
                </Button>
            </div>
        </div>
    );
}
