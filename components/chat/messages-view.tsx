'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { ChatList } from "@/components/chat/chat-list";
import { ChatWindow } from "@/components/chat/chat-window";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";
import { useLanguage } from "@/components/language-context";
import { MessageSquare } from "lucide-react";

interface MessagesViewProps {
    chats: any[];
    activeSession: any;
    user: any;
    familyMembers: any[];
    activeChatId: string | null;
}

export function MessagesView({ chats, activeSession, user, familyMembers, activeChatId }: MessagesViewProps) {
    const { t } = useLanguage();

    return (
        <MainLayout className="max-w-7xl w-full h-[calc(100vh-theme(spacing.32))]">
            <div className="flex gap-6 h-full">
                {/* Sidebar List */}
                <div className={`w-full md:w-80 flex flex-col bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <h1 className="font-bold text-xl tracking-tight">{t('nav.messages')}</h1>
                        <NewChatDialog familyMembers={familyMembers} />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <ChatList chats={chats} />
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className={`flex-1 ${!activeChatId ? 'hidden md:flex' : 'flex'} flex-col h-full`}>
                    {activeSession ? (
                        <ChatWindow session={activeSession} currentUserId={user.id} />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-white/50 dark:bg-card/50 rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center text-muted-foreground animate-in fade-in zoom-in-95 duration-500 h-full">
                            <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare className="w-8 h-8 opacity-50" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2 text-foreground">{t('messages.select')}</h2>
                            <p className="max-w-xs text-sm">
                                {t('messages.placeholder.desc')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
