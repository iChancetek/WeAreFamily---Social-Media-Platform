'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConversationList } from "@/components/chat/conversation-list";

export function MessagesSidebar() {
    const pathname = usePathname();
    // Hide sidebar on mobile if we are in a specific chat (pathname isn't just /messages)
    // On desktop, it's always flex.
    const isChatOpen = pathname !== '/messages';

    return (
        <div className={cn(
            "w-full md:w-80 border-r bg-card flex flex-col",
            isChatOpen ? "hidden md:flex" : "flex"
        )}>
            <div className="p-4 border-b font-semibold text-lg flex justify-between items-center bg-card/50 backdrop-blur-sm">
                Messages
                {/* Add a button or link to start new chat if desired, e.g. to contacts */}
                <Link href="/companions" className="text-primary text-sm font-normal">
                    + New
                </Link>
            </div>
            <ConversationList className="flex-1" />
        </div>
    );
}
