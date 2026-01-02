'use client'

import { useAuth } from "@/components/auth-provider";
import { LogOut, Home, Users, MessageSquare, Ticket, Image as ImageIcon, Settings, Shield, Tent, Heart, Briefcase, Bell } from "lucide-react";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

interface SidebarProps {
    isAdmin?: boolean;
}

export function Sidebar({ isAdmin }: SidebarProps) {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    // Simplified links for now, removing translation dependency to fix build quickly
    const links = [
        { href: "/", label: "Home", icon: Home },
        { href: "/family", label: "Family", icon: Users },
        { href: "/groups", label: "Groups", icon: Tent },
        { href: "/pages", label: "Pages", icon: Briefcase }, // Added Pages link
        { href: "/messages", label: "Messages", icon: MessageSquare },
        { href: "/notifications", label: "Notifications", icon: Bell },
        { href: "/events", label: "Events", icon: Ticket },
        { href: "/gallery", label: "Gallery", icon: ImageIcon },
        { href: "/settings", label: "Settings", icon: Settings },
    ];

    if (isAdmin) {
        links.push({ href: "/admin", label: "Admin", icon: Shield });
    }

    return (
        <div className="flex flex-col h-full py-4 bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-white/10 fixed left-0 top-0 bottom-0 w-64 z-50 shadow-sm">
            <div className="px-6 py-4">
                <Link href="/" className="flex items-center gap-2">
                    <Heart className="w-8 h-8 fill-blue-600 text-blue-600 dark:fill-blue-500 dark:text-blue-500" />
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-500 tracking-tight">WeAreFamily</span>
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
                                    "w-full justify-start gap-4 text-base font-medium transition-colors h-12 rounded-lg px-4 relative", // Added 'relative' for badge positioning
                                    isActive
                                        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                                )}>
                                <link.icon className={cn("w-6 h-6", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-300")} />
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
                    <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => signOut()}>
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );
}

