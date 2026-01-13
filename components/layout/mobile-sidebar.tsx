"use client";

import { useAuth } from "@/components/auth-provider";
import { LogOut, Home, Users, MessageSquare, Ticket, Image as ImageIcon, Settings, Shield, Tent, Heart, Briefcase, Bell, User, Video, Bot, Newspaper } from "lucide-react";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { useLanguage } from "@/components/language-context";

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
            title: "Main",
            items: [
                { href: "/", label: "Home", icon: Home },
                { href: "/profile", label: profile?.displayName || "Profile", icon: User },
                { href: "/family", label: "Companions", icon: Users },
                { href: "/groups", label: "Groups", icon: Tent },
                { href: "/chat", label: "AI Research Assistant", icon: Bot },
            ]
        },
        {
            title: "Social",
            items: [
                { href: "/messages", label: "Messages", icon: MessageSquare },
                { href: "/news", label: "News Feed", icon: Newspaper },
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
        <div className={cn("flex flex-col h-full py-4 bg-white dark:bg-card overflow-y-auto", className)}>
            <div className="px-6 py-4 flex-shrink-0">
                <button
                    className="flex items-center gap-2 cursor-pointer border-none bg-transparent p-0"
                    onClick={() => handleNavigation("/", "Logo")}
                    type="button"
                    onTouchStart={() => console.log('🔵 Logo touched')}
                >
                    <Heart className="w-8 h-8 fill-primary text-primary" />
                    <span className="text-2xl font-bold text-primary tracking-tight">Famio</span>
                </button>
            </div>

            <nav className="flex-1 px-4 mt-2 space-y-6">
                {groups.map((group) => (
                    <div key={group.title} className="space-y-1">
                        {group.title !== "Main" && (
                            <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
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
                                    onTouchStart={() => console.log('🔵 Touch start:', link.label)}
                                    className={cn(
                                        "flex items-center gap-3 w-full text-base font-medium transition-all h-11 rounded-xl px-3 relative my-1",
                                        "border-none bg-transparent text-left cursor-pointer",
                                        isActive
                                            ? "bg-primary/10 text-primary font-bold"
                                            : "text-foreground hover:bg-muted active:bg-muted"
                                    )}
                                    type="button"
                                >
                                    <link.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                                    <span className="truncate">{link.label}</span>
                                    {link.href === '/notifications' && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                            <NotificationBadge />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="px-4 mt-6 pt-4 border-t border-border flex-shrink-0 space-y-2">
                <div className="px-2">
                    <ModeToggle />
                </div>
                <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl px-3" onClick={() => signOut()}>
                    <LogOut className="h-5 w-5" />
                    {t("nav.signout")}
                </Button>
            </div>
        </div>
    );
}
