'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, User, Calendar, MessageCircle, Settings, LogOut, Heart, ImageIcon } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    isAdmin?: boolean;
}

export function Sidebar({ className, isAdmin }: SidebarProps) {
    const pathname = usePathname();

    const links = [
        { href: "/", label: "Home", icon: Home },
        ...(isAdmin ? [{ href: "/admin", label: "Admin Console", icon: Settings }] : []),
        { href: "/messages", label: "Messages", icon: MessageCircle },
        { href: "/gallery", label: "Gallery", icon: ImageIcon },
        { href: "/events", label: "Events", icon: Calendar },
        { href: "/profile", label: "Profile", icon: User },
    ];

    return (
        <div className={cn("flex flex-col h-full py-4", className)}>
            <div className="px-6 py-2">
                <h2 className="text-xl font-bold flex items-center gap-2 text-rose-500">
                    <Heart className="w-6 h-6 fill-current" />
                    WeAreFamily
                </h2>
            </div>
            <nav className="flex-1 px-4 mt-6 space-y-1">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link key={link.href} href={link.href}>
                            <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn("w-full justify-start gap-3", isActive && "bg-rose-50 text-rose-600 hover:bg-rose-100")}
                            >
                                <link.icon className="w-5 h-5" />
                                {link.label}
                            </Button>
                        </Link>
                    )
                })}
            </nav>
            <div className="px-4 mt-auto">
                <SignOutButton>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-gray-500 hover:text-red-600">
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </Button>
                </SignOutButton>
            </div>
        </div>
    );
}
