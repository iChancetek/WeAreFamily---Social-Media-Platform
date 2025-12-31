import { MainLayout } from "@/components/layout/main-layout";
import { getChats } from "@/app/actions/chat";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChatLayout } from "@/components/chat/chat-layout";

export default async function MessagesPage({ searchParams }: { searchParams: { chatId?: string } }) {
    const user = await getUserProfile();
    if (!user || user.role === 'pending') {
        redirect("/");
    }

    const chats = await getChats();
    const selectedChatId = searchParams.chatId ? parseInt(searchParams.chatId) : undefined;

    return (
        <MainLayout>
            <div className="h-[calc(100vh-120px)] border rounded-lg overflow-hidden bg-white shadow-sm flex">
                <ChatLayout initialChats={chats} selectedChatId={selectedChatId} currentUserId={user.id} />
            </div>
        </MainLayout>
    )
}
