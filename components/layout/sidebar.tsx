'use client'

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { LogOut, Home, Users, MessageSquare, Ticket, Image as ImageIcon, Settings, Shield, Tent, Briefcase, Bell, User, Video, Bot, Sun, Moon, HelpCircle, Music, ShoppingBag, Heart, type LucideIcon } from "lucide-react";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-context";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarItem } from "./sidebar-item";
import { VoiceStatusIndicator } from "@/components/ai/voice-status-indicator";
import { LiveSetupDialog } from "@/components/live/live-setup-dialog";

import { useVoice } from "@/components/ai/voice-provider";

interface SidebarProps {
    isAdmin?: boolean;
    className?: string;
    onLinkClick?: () => void;
}

interface SidebarLink {
    href: string;
    label: string;
    icon: LucideIcon;
    hasNotification?: boolean;
    color?: string;
    onClick?: () => void;
}

interface SidebarGroup {
    title: string;
    items: SidebarLink[];
}

export function Sidebar({ isAdmin, className, onLinkClick }: SidebarProps) {
    const pathname = usePathname();
    const { user, signOut, profile } = useAuth();
    const { t } = useLanguage();
    const { theme, setTheme } = useTheme();
    const [isHovered, setIsHovered] = useState(false);
    const [showLiveSetup, setShowLiveSetup] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Global Voice State
    const { state: aiState, toggleContinuous } = useVoice();

    const groups: SidebarGroup[] = [
        {
            title: t("nav.section.main"),
            items: [
                { href: "/", label: t("nav.home"), icon: Home, color: "blue" },
                { href: "/chat", label: t("nav.ai"), icon: Bot, color: "indigo" }, 
                { href: "/profile", label: profile?.displayName || t("nav.profile"), icon: User, color: "orange" },
                { href: "/messages", label: t("nav.messages"), icon: MessageSquare, hasNotification: true, color: "red" },
            ]
        },
        {
            title: t("nav.section.discover"),
            items: [
                { href: "/companions", label: "Family", icon: Heart, color: "rose" },
                { href: "/groups", label: "Groups", icon: Users, color: "emerald" },
                { href: "#", label: t("nav.social.live"), icon: Video, color: "red", onClick: () => setShowLiveSetup(true) }, 
                { href: "/events", label: t("nav.events"), icon: Ticket, color: "yellow" },
                { href: "/marketplace", label: "Marketplace", icon: ShoppingBag, color: "blue" },
                { href: "/gallery", label: t("nav.gallery"), icon: ImageIcon, color: "violet" },
                { href: "/music", label: "Music", icon: Music, color: "emerald" },
            ]
        },
        {
            title: t("nav.section.system"),
            items: [
                { href: "/branding", label: t("nav.branding"), icon: Briefcase, color: "slate" },
                { href: "/notifications", label: t("nav.notifications"), icon: Bell, color: "yellow" },
                { href: "/privacy", label: t("nav.privacy"), icon: Shield, color: "emerald" },
                { href: "/help", label: "Help", icon: HelpCircle, color: "blue" },
                { href: "/settings", label: t("nav.settings"), icon: Settings, color: "slate" },
            ]
        }
    ];

    if (isAdmin) {
        groups.push({
            title: "Admin",
            items: [
                { href: "/admin", label: t("nav.admin"), icon: Shield, color: "indigo" }
            ]
        });
    }

    return (
        <motion.div
            className={cn(
                "hidden md:flex flex-col h-[calc(100vh-2rem)] my-4 ml-4 rounded-[24px] fixed left-0 top-0 z-50 overflow-hidden transition-colors duration-300",
                "glass-panel border-white/20 dark:border-white/10 shadow-lg",
                className
            )}
            initial={{ width: 80 }}
            animate={{ width: isHovered ? 260 : 84 }} // 84px collapsed, 260px expanded
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 1. Header: Logo & AI Indicator */}
            <div className="flex flex-col items-center px-4 pt-6 pb-2">
                <div className="flex items-center justify-between w-full mb-4 pl-1">
                    <Link
                        href="/"
                        className="flex items-center gap-3 group"
                        onClick={onLinkClick}
                    >
                        <div className="relative flex items-center justify-center w-16 h-16">
                            {/* Animated Logo Mark */}
                            <img
                                src="/icons/famio-logo.png"
                                alt="Famio"
                                className={cn(
                                    "w-14 h-14 rounded-2xl object-cover transition-transform duration-200",
                                    isHovered ? "scale-100" : "scale-90"
                                )}
                            />
                        </div>

                        {/* Title text fades in */}
                        <AnimatePresence>
                            {isHovered && (
                                <motion.span
                                    className="text-xl font-bold tracking-tight text-foreground whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                >
                                    Famio
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>
                </div>

                {/* AI Presence Bar */}
                <div className="w-full">
                    <VoiceStatusIndicator
                        state={aiState}
                        className="w-full bg-transparent hover:bg-transparent"
                        onClick={toggleContinuous}
                    />
                </div>
            </div>

            {/* 2. Scrollable Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {groups.map((group) => (
                    <div key={group.title} className="space-y-1">
                        {/* Section Title (Only visible when expanded) */}
                        <div className={cn(
                            "px-3 text-[11px] font-black text-foreground dark:text-zinc-500 uppercase tracking-[0.2em] transition-opacity duration-200 h-4 mb-4 flex items-center",
                            isHovered ? "opacity-100" : "opacity-0"
                        )}>
                            {group.title}
                        </div>

                        {group.items.map((link) => (
                            <SidebarItem
                                key={link.href}
                                icon={link.icon}
                                label={link.label}
                                href={link.href}
                                isActive={pathname === link.href}
                                isExpanded={isHovered}
                                color={link.color}
                                hasNotification={link.href === '/notifications' || link.href === '/messages'} // Logic for demo
                                onClick={link.onClick || onLinkClick}
                            />
                        ))}
                    </div>
                ))}
            </nav>

            {/* 3. Footer: User & Settings */}
            <div className="p-3">
                {/* Theme Toggles (Simplified) */}
                {mounted ? (
                    isHovered ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-1 p-1 mb-2 bg-muted/50 dark:bg-white/5 rounded-xl border border-border dark:border-white/5"
                        >
                            {['light', 'dark', 'system'].map((tMode) => (
                                <button
                                    key={tMode}
                                    onClick={() => setTheme(tMode)}
                                    className={cn(
                                        "flex-1 p-1.5 rounded-lg text-xs font-medium transition-all",
                                        theme === tMode
                                            ? "bg-card text-foreground shadow-sm dark:bg-zinc-800 dark:text-white"
                                            : "text-foreground dark:text-zinc-500 hover:text-foreground dark:hover:text-zinc-300"
                                    )}
                                >
                                    {tMode === 'light' && <p>☀</p>}
                                    {tMode === 'dark' && <p>☾</p>}
                                    {tMode === 'system' && <p>💻</p>}
                                </button>
                            ))}
                        </motion.div>
                    ) : (
                        // Collapsed Theme Toggle (Cycle)
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="w-full flex items-center justify-center h-10 text-foreground dark:text-zinc-500 hover:text-foreground dark:hover:text-white transition-colors mb-2"
                        >
                            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>
                    )
                ) : (
                    <div className="w-full h-10 mb-2" />
                )}

                <div className="border-t border-border dark:border-white/10 pt-3 mt-1">
                    <SidebarItem
                        icon={LogOut}
                        label={t("nav.signout")}
                        href="#"
                        onClick={() => signOut().then(() => window.location.href = '/login')}
                        isExpanded={isHovered}
                        isActive={false}
                    />
                </div>
            </div>

            {/* Drag Handle Indicator (Optional visual cue) */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-zinc-200/50 dark:bg-white/5 rounded-l-full" />

            <LiveSetupDialog open={showLiveSetup} onOpenChange={setShowLiveSetup} />
        </motion.div>
    );
}

