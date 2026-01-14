'use client'

import { useAuth } from "@/components/auth-provider";
import { LogOut, Home, Users, MessageSquare, Ticket, Image as ImageIcon, Settings, Shield, Tent, Heart, Briefcase, Bell, User, Video, Bot, Sun, Moon, Laptop } from "lucide-react";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-context";
import { useTheme } from "next-themes";

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

    const groups = [
        {
            title: "Main",
            items: [
                { href: "/", label: "Home", icon: Home },
                { href: "/profile", label: profile?.displayName || "Profile", icon: User },
                { href: "/family", label: "Companions", icon: Users },
                { href: "/groups", label: "Groups", icon: Tent },
                { href: "/chat", label: "AI Assistant", icon: Bot },
            ]
        },
        {
            title: "Social",
            items: [
                { href: "/messages", label: "Messages", icon: MessageSquare },
                { href: "/live", label: "Live", icon: Video },
                { href: "/events", label: "Events", icon: Ticket },
                { href: "/gallery", label: "Gallery", icon: ImageIcon },
            ]
        },
        {
            title: "System",
            items: [
                { href: "/branding", label: "Branding", icon: Briefcase },
                { href: "/notifications", label: "Notifications", icon: Bell },
                { href: "/settings", label: "Settings", icon: Settings },
            ]
        }
    ];

    if (isAdmin) {
        groups.push({
            title: "Admin",
            items: [
                { href: "/admin", label: "Admin", icon: Shield }
            ]
        });
    }

    return (
        <div className={cn("hidden md:flex flex-col h-[calc(100vh-2rem)] my-4 ml-4 rounded-[1.5rem] glass-panel w-64 fixed left-0 top-0 z-50 overflow-hidden shadow-2xl transition-all duration-300 ring-1 ring-black/5", className)}>
            <div className="px-6 py-6 flex-shrink-0">
                <Link
                    href="/"
                    className="flex items-center gap-3 pointer-events-auto cursor-pointer group"
                    onClick={() => {
                        onLinkClick?.();
                    }}
                >
                    <div className="relative">
                        <Heart className="w-8 h-8 text-primary fill-primary/20 group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-50 group-hover:opacity-80 transition-opacity" />
                    </div>
                    <span className="text-2xl font-bold text-primary tracking-tight">Famio</span>
                </Link>
            </div>

            <nav className="flex-1 px-4 mt-2 space-y-8 overflow-y-auto custom-scrollbar">
                {groups.map((group, index) => (
                    <div key={group.title} className="space-y-2">
                        {group.title !== "Main" && (
                            <h4 className="px-4 text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mb-3">
                                {group.title}
                            </h4>
                        )}
                        {group.items.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={onLinkClick}
                                    className={cn(
                                        "flex items-center gap-3 w-full text-[15px] font-medium transition-all h-11 rounded-xl px-4 relative group",
                                        isActive
                                            ? "bg-primary/10 text-primary shadow-sm"
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:pl-5"
                                    )}
                                >
                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />}
                                    <link.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary fill-primary/10" : "text-muted-foreground group-hover:text-primary")} />
                                    <span className="truncate">{link.label}</span>
                                    {link.href === '/notifications' && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                            <NotificationBadge />
                                        </div>
                                    )}
                                </a>
                            )
                        })}
                    </div>
                ))}
            </nav>

            <div className="px-4 py-4 mt-auto border-t border-border/50 bg-white/50 dark:bg-black/20 backdrop-blur-md space-y-3">
                {/* Inline Theme Toggle for Desktop Reliability */}
                <div className="flex items-center p-1 bg-muted/50 rounded-xl border border-border/50">
                    <button
                        onClick={() => setTheme("light")}
                        className={cn(
                            "flex-1 flex items-center justify-center p-2 rounded-lg transition-all",
                            theme === 'light' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                        title="Light Mode"
                    >
                        <Sun className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setTheme("dark")}
                        className={cn(
                            "flex-1 flex items-center justify-center p-2 rounded-lg transition-all",
                            theme === 'dark' ? "bg-zinc-800 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                        title="Dark Mode"
                    >
                        <Moon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setTheme("system")}
                        className={cn(
                            "flex-1 flex items-center justify-center p-2 rounded-lg transition-all",
                            theme === 'system' ? "bg-white dark:bg-zinc-800 shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                        title="System Theme"
                    >
                        <Laptop className="w-4 h-4" />
                    </button>
                </div>

                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-destructive/10 rounded-xl px-3 h-10"
                    onClick={() => {
                        // Force a hard navigation to login if needed, or stick to router
                        signOut().then(() => {
                            window.location.href = '/login';
                        });
                    }}
                >
                    <LogOut className="h-5 w-5" />
                    {t("nav.signout")}
                </Button>
            </div>
        </div>
    );
}

