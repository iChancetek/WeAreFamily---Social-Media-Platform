import { ChatWindow } from "@/components/chat/chat-window";
import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ChatPage({ params }: { params: { chatId: string } }) {
    const user = await getUserProfile();
    if (!user) redirect("/login");

    const { chatId } = params;

    // Fetch chat metadata to get other user details initially
    const chatDoc = await adminDb.collection("chats").doc(chatId).get();

    if (!chatDoc.exists) {
        return <div>Chat not found</div>;
    }

    const chatData = chatDoc.data();
    const otherId = chatData?.participants.find((id: string) => id !== user.id);

    let otherUser = null;
    if (otherId) {
        const userDoc = await adminDb.collection("users").doc(otherId).get();
        if (userDoc.exists) {
            const uData = userDoc.data();
            otherUser = {
                id: userDoc.id,
                displayName: uData?.displayName || "User",
                imageUrl: uData?.imageUrl || null,
                // etc
            };
        }
    }

    return (
        <ChatWindow
            chatId={chatId}
            otherUser={otherUser}
        />
    );
}
