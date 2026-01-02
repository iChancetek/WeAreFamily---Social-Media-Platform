'use client'

import { useAuth } from "@/components/auth-provider";
import { LogOut, Home, Users, MessageSquare, Ticket, Image as ImageIcon, Settings, Shield, Tent, Heart, Briefcase, Bell } from "lucide-react";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { useLanguage } from "@/components/language-context";

interface SidebarProps {
    isAdmin?: boolean;
    className?: string;
}

export function Sidebar({ isAdmin, className }: SidebarProps) {
    const pathname = usePathname();
    const { user, signOut, profile } = useAuth();
    const { t } = useLanguage();

    // ... (rest of logic)

    return (
        <div className={cn("flex flex-col h-full py-4 bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-white/10 fixed left-0 top-0 bottom-0 w-64 z-50", className)}>
            <div className="px-6 py-4">
                <Link href="/" className="flex items-center gap-2">
                    <Heart className="w-8 h-8 fill-primary text-primary" />
                    <span className="text-2xl font-bold text-primary tracking-tight">Famio</span>
                </Link>
            </div>
            <nav className="flex-1 px-2 mt-4 space-y-1">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link key={link.href} href={link.href}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start gap-4 text-base font-medium transition-colors h-12 rounded-full px-4 relative",
                                    isActive
                                        ? "bg-primary/10 text-primary font-bold"
                                        : "text-foreground hover:bg-secondary hover:text-foreground"
                                )}>
                                <link.icon className={cn("w-6 h-6", isActive ? "text-primary" : "text-muted-foreground")} />
                                {link.label}
                                {link.href === '/notifications' && (
                                    <div className="absolute top-2 left-6">
                                        <NotificationBadge />
                                    </div>
                                )}
                            </Button>
                        </Link>
                    )
                })}
            </nav>
            <div className="px-2 mt-auto mb-4 space-y-2">
                <div className="px-4">
                    <ModeToggle />
                </div>
                <div className="p-4 border-t border-border mt-auto">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full" onClick={() => signOut()}>
                        <LogOut className="h-4 w-4" />
                        {t("nav.signout")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

