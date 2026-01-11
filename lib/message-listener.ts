import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore"

export interface NewMessageData {
    id: string
    sessionId: string
    senderId: string
    senderName: string
    senderImage?: string
    content: string
    createdAt: Date
}

export function listenForNewMessages(
    userId: string,
    onNewMessage: (message: NewMessageData) => void
): () => void {
    // Track the last checked timestamp to avoid showing old messages
    let lastCheckedAt = Timestamp.now()

    // Listen to all chat sessions where user is a participant
    const sessionsQuery = query(
        collection(db, "chatSessions"),
        where("participants", "array-contains", userId)
    )

    const unsubscribe = onSnapshot(sessionsQuery, async (sessionsSnapshot) => {
        for (const sessionDoc of sessionsSnapshot.docs) {
            const sessionData = sessionDoc.data()

            // Listen to messages in this session
            const messagesQuery = query(
                collection(db, `chatSessions/${sessionDoc.id}/messages`),
                where("createdAt", ">", lastCheckedAt),
                orderBy("createdAt", "desc")
            )

            onSnapshot(messagesQuery, (messagesSnapshot) => {
                messagesSnapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const messageData = change.doc.data()

                        // Only notify if message is from someone else
                        if (messageData.senderId !== userId) {
                            // Get sender info from session participants
                            const otherParticipant = sessionData.participants.find(
                                (p: string) => p !== userId
                            )

                            onNewMessage({
                                id: change.doc.id,
                                sessionId: sessionDoc.id,
                                senderId: messageData.senderId,
                                senderName: sessionData.otherUserName || "Unknown",
                                senderImage: sessionData.otherUserImage,
                                content: messageData.content,
                                createdAt: messageData.createdAt?.toDate() || new Date(),
                            })
                        }
                    }
                })
            })
        }

        // Update last checked timestamp
        lastCheckedAt = Timestamp.now()
    })

    return unsubscribe
}
