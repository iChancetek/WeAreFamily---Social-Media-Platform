'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, User, Calendar, MessageCircle, Settings, LogOut, Heart, ImageIcon } from "lucide-react";
import { SignOutButton, useUser } from "@clerk/nextjs";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    isAdmin?: boolean;
}

export function Sidebar({ className, isAdmin }: SidebarProps) {
    const pathname = usePathname();
    const { user } = useUser();

    const links = [
        { href: "/", label: "Home", icon: Home },
        ...(isAdmin ? [{ href: "/admin", label: "Admin Console", icon: Settings }] : []),
        { href: "/messages", label: "Messages", icon: MessageCircle },
        { href: "/gallery", label: "Gallery", icon: ImageIcon },
        { href: "/events", label: "Events", icon: Calendar },
        { href: user ? `/u/${user.id}` : "#", label: "Profile", icon: User },
    ];

    return (
        <div className={cn("flex flex-col h-full py-4 glass fixed left-0 top-0 bottom-0 w-64 z-50", className)}>
            <div className="px-6 py-4">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-primary">
                    <Heart className="w-8 h-8 fill-primary text-primary" />
                    WeAreFamily
                </h2>
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
                                        ? "bg-primary/20 text-primary border border-primary/20"
                                        : "hover:bg-white/10 text-gray-400 hover:text-white"
                                )}
                            >
                                <link.icon className={cn("w-6 h-6", isActive ? "text-primary" : "text-gray-400")} />
                                {link.label}
                            </Button>
                        </Link>
                    )
                })}
            </nav>
            <div className="px-2 mt-auto mb-4">
                <SignOutButton>
                    <Button variant="ghost" className="w-full justify-start gap-4 text-gray-400 hover:text-white hover:bg-white/10 px-4 h-12">
                        <LogOut className="w-6 h-6" />
                        Sign Out
                    </Button>
                </SignOutButton>
            </div>
        </div>
    );
}
