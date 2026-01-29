import { MainLayout } from "@/components/layout/main-layout";
import { MessagesSidebar } from "@/components/chat/messages-sidebar";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
    return (
        <MainLayout>
            <div className="flex h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden bg-background border rounded-lg shadow-sm">

                {/* Sidebar: Conversation List */}
                <MessagesSidebar />

                {/* Main Content: Chat Window */}
                <div className="flex-1 flex flex-col min-w-0 bg-muted/20">
                    {children}
                </div>
            </div>
        </MainLayout>
    );
}
