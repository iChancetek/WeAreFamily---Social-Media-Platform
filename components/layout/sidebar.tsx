'use client'

import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, User, Calendar, MessageCircle, Settings, LogOut, Heart, ImageIcon, Shield } from "lucide-react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useLanguage } from "@/components/language-context";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    isAdmin?: boolean;
}

export function Sidebar({ className, isAdmin }: SidebarProps) {
    const pathname = usePathname();
    const { user } = useUser();
    const { t } = useLanguage();

    const links = [
        { href: "/", label: t("nav.home"), icon: Home },
        ...(isAdmin ? [{ href: "/admin", label: t("nav.admin"), icon: Shield }] : []),
        { href: "/messages", label: t("nav.messages"), icon: MessageCircle },
        { href: "/gallery", label: t("nav.gallery"), icon: ImageIcon },
        { href: "/events", label: t("nav.events"), icon: Calendar },
        { href: "/family", label: t("nav.family"), icon: Heart }, // Using Heart as placeholder, could be Users
        { href: user ? `/u/${user.id}` : "#", label: t("nav.profile"), icon: User },
        { href: "/settings", label: t("nav.settings"), icon: Settings },
    ];

    return (
        <div className={cn("flex flex-col h-full py-4 bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-white/10 fixed left-0 top-0 bottom-0 w-64 z-50 shadow-sm", className)}>
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
                                    "w-full justify-start gap-4 text-base font-medium transition-colors h-12 rounded-lg px-4",
                                    isActive
                                        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                                )}>
                                <link.icon className={cn("w-6 h-6", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-300")} />
                                {link.label}
                            </Button>
                        </Link>
                    )
                })}
            </nav>
            <div className="px-2 mt-auto mb-4 space-y-2">
                <div className="px-4">
                    <ModeToggle />
                </div>
                <SignOutButton>
                    <Button variant="ghost" className="w-full justify-start gap-4 text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 h-12">
                        <LogOut className="w-6 h-6" />
                        {t("nav.signout")}
                    </Button>
                </SignOutButton>
            </div>
        </div>
    );
}
