import { getChats, ChatSession } from "@/app/actions/chat";
import { getUserProfile } from "@/lib/auth";
import { ChatList } from "@/components/chat/chat-list";
import { ChatWindow } from "@/components/chat/chat-window";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";

export default async function MessagesPage({ searchParams }: { searchParams: { chatId?: string } }) {
    const user = await getUserProfile();
    if (!user) redirect("/login");

    const chats = await getChats();
    const activeChatId = searchParams.chatId ? Number(searchParams.chatId) : null;

    const activeSession = activeChatId ? chats.find(c => c.id === activeChatId) : null;

    return (
        <div className="h-[calc(100vh-theme(spacing.24))] flex gap-6">
            {/* Sidebar List */}
            <div className={`w-full md:w-80 flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100 dark:border-white/5">
                    <h1 className="font-bold text-xl tracking-tight">Messages</h1>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <ChatList chats={chats} />
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 ${!activeChatId ? 'hidden md:flex' : 'flex'} flex-col`}>
                {activeSession ? (
                    <ChatWindow session={activeSession} currentUserId={user.id} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-white/50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center text-muted-foreground animate-in fade-in zoom-in-95 duration-500">
                        <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 opacity-50" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Select a Conversation</h2>
                        <p className="max-w-xs text-sm">
                            Choose a family member from the list to start chatting or checking up on them!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
