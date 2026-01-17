import { MainLayout } from "@/components/layout/main-layout";
import { FullScreenChat } from "@/components/ai/full-screen-chat";

export const dynamic = 'force-dynamic';

interface ChatPageProps {
    searchParams?: {
        id?: string;
    };
}

export default function ChatPage({ searchParams }: ChatPageProps) {
    return (
        <MainLayout>
            <FullScreenChat initialChatId={searchParams?.id} />
        </MainLayout>
    );
}
