import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';

export type ChatSession = {
    id: string;
    participants: string[];
    lastMessage?: string;
    lastMessageAt?: Date;
    // Data from other users needs to be fetched separately or enriched server-side?
    // Client-side, we might need to fetch user details if not present.
    // For now, let's assume we fetch basic data real-time.
};

export function useRealtimeChats() {
    const { user } = useAuth();
    const [chats, setChats] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        // Note: Firestore requires an index for array-contains + orderBy
        // If index is missing, this might fail. We should handle that or create the index.
        // Assuming index exists as per previous server action logic.
        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", user.uid),
            orderBy("lastMessageAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sessions = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    lastMessageAt: data.lastMessageAt instanceof Timestamp ? data.lastMessageAt.toDate() : null,
                } as ChatSession;
            });
            setChats(sessions);
            setLoading(false);
        }, (error) => {
            console.error("Error listening to chats:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { chats, loading };
}
