import { MainLayout } from "@/components/layout/main-layout";
import { FullScreenChat } from "@/components/ai/full-screen-chat";

export const dynamic = 'force-dynamic';

export default function ChatPage() {
    return (
        <MainLayout>
            <FullScreenChat />
        </MainLayout>
    );
}
