import { getChats } from "@/app/actions/chat";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MessagesView } from "@/components/chat/messages-view";

export const dynamic = 'force-dynamic';

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ chatId?: string }> }) {
    const { chatId } = await searchParams;
    const user = await getUserProfile();
    if (!user) redirect("/login");

    const chats = await getChats();
    const activeChatId = chatId || null;

    const activeSession = activeChatId ? chats.find(c => c.id === activeChatId) : null;

    // Fetch members for the new chat dialog
    const { getFamilyMembers } = await import("@/app/actions/family");
    const familyMembers = await getFamilyMembers();

    return (
        <MessagesView
            chats={chats}
            activeSession={activeSession}
            user={user}
            familyMembers={familyMembers}
            activeChatId={activeChatId}
        />
    );
}
