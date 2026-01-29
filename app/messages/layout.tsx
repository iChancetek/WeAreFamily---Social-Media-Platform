import { MainLayout } from "@/components/layout/main-layout";
import { ConversationList } from "@/components/chat/conversation-list";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
    return (
        <MainLayout>
            <div className="flex h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden bg-background border rounded-lg shadow-sm">

                {/* Sidebar: Conversation List */}
                {/* Hidden on mobile if viewing a chat (children is present?) - Handling this via page structure is better for Next.js */}
                {/* Actually, Next.js Layouts wrap pages. On mobile:
                    - /messages: Show List
                    - /messages/[id]: Show Chat (hide list)
                    This requires generic CSS hiding or checking pathname in Client Component.
                */}
                <MessagesSidebar />

                {/* Main Content: Chat Window */}
                <div className="flex-1 flex flex-col min-w-0 bg-muted/20">
                    {children}
                </div>
            </div>
        </MainLayout>
    );
}

// Client component for responsive behavior
'use client';
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function MessagesSidebar() {
    const pathname = usePathname();
    const isChatOpen = pathname !== '/messages';

    return (
        <div className={cn(
            "w-full md:w-80 border-r bg-card flex flex-col",
            isChatOpen ? "hidden md:flex" : "flex"
        )}>
            <div className="p-4 border-b font-semibold text-lg flex justify-between items-center">
                Messages
                {/* New Message Button could go here */}
            </div>
            <ConversationList className="flex-1" />
        </div>
    );
}
