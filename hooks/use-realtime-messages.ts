import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, Timestamp } from 'firebase/firestore';

export type Message = {
    id: string;
    senderId: string;
    content: string;
    type: 'text' | 'image' | 'video' | 'link';
    mediaUrl?: string;
    createdAt: Date;
    readBy?: string[];
};

export function useRealtimeMessages(chatId: string) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!chatId) return;

        setLoading(true);
        const q = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("createdAt", "asc"),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Convert Firestore Timestamp to JS Date
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
                } as Message;
            });
            setMessages(msgs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatId]);

    return { messages, loading };
}
