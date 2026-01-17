'use client';

import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarItemProps {
    icon: LucideIcon;
    label: string;
    href: string;
    isActive?: boolean;
    isExpanded?: boolean;
    hasNotification?: boolean;
    onClick?: () => void;
}

export function SidebarItem({
    icon: Icon,
    label,
    href,
    isActive,
    isExpanded,
    hasNotification,
    onClick
}: SidebarItemProps) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "relative flex items-center h-12 px-3 rounded-xl transition-all duration-200 group overflow-hidden",
                isActive
                    ? "bg-primary/10 text-primary dark:bg-gradient-to-r dark:from-primary/20 dark:to-transparent dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5"
            )}
        >
            {/* Active Indicator Bar (Neon Glow) */}
            {isActive && (
                <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)] dark:shadow-[0_0_12px_rgba(var(--primary-rgb),0.8)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />
            )}

            {/* Icon Container */}
            <div className={cn(
                "relative z-10 flex items-center justify-center w-8 h-8 transition-transform duration-300",
                "group-hover:scale-110 group-hover:-translate-y-0.5", // "Lift" effect
                isActive && "text-primary drop-shadow-[0_0_8px_rgba(111,76,255,0.5)]"
            )}>
                <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />

                {/* Notification Dot on Icon (Collpased state) */}
                {hasNotification && !isExpanded && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0B0F14]" />
                )}
            </div>

            {/* Label (Slide In/Out) */}
            <div className={cn(
                "flex-1 ml-3 whitespace-nowrap overflow-hidden transition-all duration-300",
                isExpanded ? "opacity-100 w-auto translate-x-0" : "opacity-0 w-0 -translate-x-2"
            )}>
                <span className={cn(
                    "text-sm font-medium tracking-wide",
                    isActive ? "font-bold text-primary dark:text-white" : "text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100"
                )}>
                    {label}
                </span>
            </div>

            {/* Notification Badge (Expanded) */}
            {hasNotification && isExpanded && (
                <span className="ml-auto w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            )}

            {/* Hover Glow Background - Subtle Glass */}
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-100/50 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </Link>
    );
}
