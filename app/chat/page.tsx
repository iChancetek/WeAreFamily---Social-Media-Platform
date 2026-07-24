import { MainLayout } from "@/components/layout/main-layout";
import { FullScreenChat } from "@/components/ai/full-screen-chat";

export const dynamic = 'force-dynamic';

interface ChatPageProps {
    searchParams?: Promise<{ id?: string }>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
    const resolvedParams = searchParams ? await searchParams : undefined;
    return (
        <MainLayout>
            <FullScreenChat initialChatId={resolvedParams?.id} />
        </MainLayout>
    );
}
