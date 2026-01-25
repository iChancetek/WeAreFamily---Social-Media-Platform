'use client'

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { LogOut, Home, Users, MessageSquare, Ticket, Image as ImageIcon, Settings, Shield, Tent, Briefcase, Bell, User, Video, Bot, Sun, Moon, HelpCircle } from "lucide-react";
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

import { useVoice } from "@/components/ai/voice-provider";

interface SidebarProps {
    isAdmin?: boolean;
    className?: string;
    onLinkClick?: () => void;
}

export function Sidebar({ isAdmin, className, onLinkClick }: SidebarProps) {
    const pathname = usePathname();
    const { user, signOut, profile } = useAuth();
    const { t } = useLanguage();
    const { theme, setTheme } = useTheme();
    const [isHovered, setIsHovered] = useState(false);

    // Global Voice State
    const { state: aiState, toggleContinuous } = useVoice();

    const groups = [
        {
            title: t("nav.section.main"),
            items: [
                { href: "/", label: t("nav.home"), icon: Home },
                { href: "/chat", label: t("nav.ai"), icon: Bot }, // Moved up for AI-first focus
                { href: "/profile", label: profile?.displayName || t("nav.profile"), icon: User },
                { href: "/messages", label: t("nav.messages"), icon: MessageSquare, hasNotification: true }, // Example notif
            ]
        },
        {
            title: t("nav.section.discover"),
            items: [
                { href: "/companions", label: t("nav.family"), icon: Users },
                { href: "/groups", label: t("nav.groups"), icon: Tent },
                { href: "/live", label: t("nav.live"), icon: Video },
                { href: "/events", label: t("nav.events"), icon: Ticket },
                { href: "/gallery", label: t("nav.gallery"), icon: ImageIcon },
            ]
        },
        {
            title: t("nav.section.system"),
            items: [
                { href: "/branding", label: t("nav.branding"), icon: Briefcase },
                { href: "/notifications", label: t("nav.notifications"), icon: Bell },
                { href: "/privacy", label: t("nav.privacy"), icon: Shield },
                { href: "/help", label: "Help", icon: HelpCircle },
                { href: "/settings", label: t("nav.settings"), icon: Settings },
            ]
        }
    ];

    if (isAdmin) {
        groups.push({
            title: "Admin",
            items: [
                { href: "/admin", label: t("nav.admin"), icon: Shield }
            ]
        });
    }

    return (
        <motion.div
            className={cn(
                "hidden md:flex flex-col h-[calc(100vh-2rem)] my-4 ml-4 rounded-[24px] fixed left-0 top-0 z-50 shadow-2xl overflow-hidden",
                // Edgy Design: Dark charcoal background in dark mode, clean white in light mode
                "bg-white/80 dark:bg-[#0B0F14] backdrop-blur-xl border border-zinc-200 dark:border-white/5 shadow-xl dark:shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]",
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
                        <div className="relative flex items-center justify-center w-10 h-10">
                            {/* Animated Logo Mark */}
                            <img
                                src="/icons/icon-72x72.png"
                                alt="Famio"
                                className={cn(
                                    "w-6 h-6 rounded-lg transition-transform duration-200",
                                    isHovered ? "scale-100" : "scale-90"
                                )}
                            />
                        </div>

                        {/* Title text fades in */}
                        <AnimatePresence>
                            {isHovered && (
                                <motion.span
                                    className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white whitespace-nowrap"
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
                        className="w-full bg-zinc-100/50 hover:bg-zinc-100 dark:bg-white/5 dark:hover:bg-white/10"
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
                            "px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest transition-opacity duration-200 h-4 mb-2 flex items-center",
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
                                hasNotification={link.href === '/notifications' || link.href === '/messages'} // Logic for demo
                                onClick={onLinkClick}
                            />
                        ))}
                    </div>
                ))}
            </nav>

            {/* 3. Footer: User & Settings */}
            <div className="p-3 bg-gradient-to-t from-zinc-100/80 to-transparent dark:from-black/50 dark:to-transparent">
                {/* Theme Toggles (Simplified) */}
                {isHovered ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-1 p-1 mb-2 bg-zinc-100 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5"
                    >
                        {['light', 'dark', 'system'].map((tMode) => (
                            <button
                                key={tMode}
                                onClick={() => setTheme(tMode)}
                                className={cn(
                                    "flex-1 p-1.5 rounded-lg text-xs font-medium transition-all",
                                    theme === tMode
                                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
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
                        className="w-full flex items-center justify-center h-10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-2"
                    >
                        {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                )}

                <div className="border-t border-zinc-200 dark:border-white/10 pt-3 mt-1">
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
        </motion.div>
    );
}

