"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useAuth } from "@/components/auth-provider"
import { usePathname } from "next/navigation"
import { listenForNewMessages, NewMessageData } from "@/lib/message-listener"
import { MessageToast } from "./message-toast"
import { QuickReplyModal } from "./quick-reply-modal"
import { toast as sonnerToast } from "sonner"

interface MessageNotificationContextType {
    // Can add methods here if needed later
}

const MessageNotificationContext = createContext<MessageNotificationContextType>({})

export function useMessageNotifications() {
    return useContext(MessageNotificationContext)
}

export function MessageNotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const pathname = usePathname()
    const [activeNotification, setActiveNotification] = useState<NewMessageData | null>(null)
    const [quickReplyOpen, setQuickReplyOpen] = useState(false)
    const [quickReplySession, setQuickReplySession] = useState<{
        sessionId: string
        senderName: string
        senderImage?: string
    } | null>(null)

    useEffect(() => {
        if (!user) return

        // Don't show notifications if user is already on messages page
        const isOnMessagesPage = pathname?.startsWith("/messages")
        if (isOnMessagesPage) return

        const unsubscribe = listenForNewMessages(user.uid, (message) => {
            // Show toast notification
            setActiveNotification(message)

            // Auto-dismiss after 10 seconds
            setTimeout(() => {
                setActiveNotification(null)
            }, 10000)
        })

        return () => unsubscribe()
    }, [user, pathname])

    const handleReadNow = () => {
        if (!activeNotification) return

        setQuickReplySession({
            sessionId: activeNotification.sessionId,
            senderName: activeNotification.senderName,
            senderImage: activeNotification.senderImage,
        })
        setQuickReplyOpen(true)
        setActiveNotification(null)
    }

    const handleIgnore = () => {
        setActiveNotification(null)
    }

    return (
        <MessageNotificationContext.Provider value={{}}>
            {children}

            {/* Toast Notification */}
            {activeNotification && (
                <div className="fixed bottom-4 right-4 z-50">
                    <MessageToast
                        message={activeNotification}
                        onReadNow={handleReadNow}
                        onIgnore={handleIgnore}
                    />
                </div>
            )}

            {/* Quick Reply Modal */}
            {quickReplySession && user && (
                <QuickReplyModal
                    open={quickReplyOpen}
                    onOpenChange={setQuickReplyOpen}
                    sessionId={quickReplySession.sessionId}
                    senderName={quickReplySession.senderName}
                    senderImage={quickReplySession.senderImage}
                    currentUserId={user.uid}
                />
            )}
        </MessageNotificationContext.Provider>
    )
}
