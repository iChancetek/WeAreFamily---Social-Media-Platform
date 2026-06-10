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
    color?: string; // e.g., "emerald", "indigo", "rose", "orange"
    onClick?: () => void;
}

export function SidebarItem({
    icon: Icon,
    label,
    href,
    isActive,
    isExpanded,
    hasNotification,
    color = "indigo",
    onClick
}: SidebarItemProps) {
    // Semantic color mappings for "Real" look - More Vibrant Blues, Reds, Yellows, Oranges
    const colorClasses: Record<string, string> = {
        emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/50 group-hover:bg-emerald-200 group-hover:shadow-[0_0_20px_-3px_rgba(16,185,129,0.5)]",
        indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/50 group-hover:bg-indigo-200 group-hover:shadow-[0_0_20px_-3px_rgba(79,70,229,0.5)]",
        rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/50 group-hover:bg-rose-200 group-hover:shadow-[0_0_20px_-3px_rgba(244,63,94,0.5)]",
        orange: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200/50 group-hover:bg-orange-200 group-hover:shadow-[0_0_20px_-3px_rgba(249,115,22,0.5)]",
        blue: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/50 group-hover:bg-blue-200 group-hover:shadow-[0_0_20px_-3px_rgba(59,130,246,0.5)]",
        violet: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200/50 group-hover:bg-violet-200 group-hover:shadow-[0_0_20px_-3px_rgba(139,92,246,0.5)]",
        amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/50 group-hover:bg-amber-200 group-hover:shadow-[0_0_20px_-3px_rgba(245,158,11,0.5)]",
        slate: "bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400 border-slate-200/50 group-hover:bg-slate-200 group-hover:shadow-[0_0_20px_-3px_rgba(71,85,105,0.5)]",
        red: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200/50 group-hover:bg-red-200 group-hover:shadow-[0_0_20px_-3px_rgba(239,68,68,0.5)]",
        yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-200/50 group-hover:bg-yellow-200 group-hover:shadow-[0_0_20px_-3px_rgba(234,179,8,0.5)]",
    };

    const activeColorClasses: Record<string, string> = {
        emerald: "bg-emerald-600 text-white shadow-glow shadow-emerald-600/50",
        indigo: "bg-indigo-600 text-white shadow-glow shadow-indigo-600/50",
        rose: "bg-rose-600 text-white shadow-glow shadow-rose-600/50",
        orange: "bg-orange-600 text-white shadow-glow shadow-orange-600/50",
        blue: "bg-blue-600 text-white shadow-glow shadow-blue-600/50",
        violet: "bg-violet-600 text-white shadow-glow shadow-violet-600/50",
        amber: "bg-amber-600 text-white shadow-glow shadow-amber-600/50",
        slate: "bg-slate-600 text-white shadow-glow shadow-slate-600/50",
        red: "bg-red-600 text-white shadow-glow shadow-red-600/50",
        yellow: "bg-yellow-600 text-white shadow-glow shadow-yellow-600/50",
    };

    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "relative flex items-center h-14 px-3 rounded-xl transition-all duration-300 group overflow-hidden mb-1",
                isActive
                    ? "bg-muted/30 dark:bg-white/5"
                    : "hover:bg-muted/20 dark:hover:bg-white/5"
            )}
        >
            {/* Active Indicator Bar (Animated Bubble) */}
            {isActive && (
                <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}

            {/* Icon "Glass Orb" Container */}
            <div className={cn(
                "relative z-10 flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-500",
                isActive ? activeColorClasses[color] : colorClasses[color],
                "group-hover:scale-105 group-hover:-translate-y-0.5"
            )}>
                <Icon className={cn(
                    "w-5 h-5 transition-transform duration-500",
                    isActive ? "stroke-[2.5px] scale-110" : "stroke-[2px] group-hover:rotate-6"
                )} />

                {/* Notification Dot */}
                {hasNotification && !isExpanded && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-background shadow-sm" />
                )}
            </div>

            {/* Label */}
            <div className={cn(
                "flex-1 ml-4 whitespace-nowrap overflow-hidden transition-all duration-300",
                isExpanded ? "opacity-100 w-auto translate-x-0" : "opacity-0 w-0 -translate-x-4"
            )}>
                <span className={cn(
                    "text-[15px] font-black tracking-tighter uppercase",
                    isActive ? "text-primary" : "text-blue-600 group-hover:text-primary dark:text-blue-400"
                )}>
                    {label}
                </span>
            </div>

            {/* Notification Badge (Expanded) */}
            {hasNotification && isExpanded && (
                <span className="ml-auto px-2 py-0.5 bg-rose-500 text-[10px] font-black text-white rounded-full shadow-glow shadow-rose-500/40">
                    NEW
                </span>
            )}

        </Link>
    );
}
