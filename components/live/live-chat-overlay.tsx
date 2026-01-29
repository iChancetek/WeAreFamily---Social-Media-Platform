"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Smile } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { onSnapshot, collection, addDoc, query, orderBy, limit, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    senderImage?: string;
    createdAt: any;
}

export function LiveChatOverlay({ sessionId }: { sessionId: string }) {
    const { user, profile } = useAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [inputText, setInputText] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!sessionId) return

        const q = query(
            collection(db, `active_sessions/${sessionId}/messages`),
            orderBy("createdAt", "asc"),
            limit(100)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message))
            setMessages(msgs)

            // Auto-scroll to bottom
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight
            }
        })

        return () => unsubscribe()
    }, [sessionId])

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!inputText.trim() || !user) return

        try {
            await addDoc(collection(db, `active_sessions/${sessionId}/messages`), {
                text: inputText.trim(),
                senderId: user.uid,
                senderName: profile?.displayName || user.displayName || "Anonymous",
                senderImage: profile?.imageUrl || user.photoURL || null,
                createdAt: serverTimestamp()
            })
            setInputText("")
        } catch (err) {
            console.error("Failed to send message:", err)
        }
    }

    return (
        <div className="absolute bottom-4 left-4 w-80 max-h-[400px] flex flex-col gap-2 z-20">
            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-2 p-2 max-h-[300px] no-scrollbar mask-image-b-0"
            >
                {messages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2">
                        <Avatar className="h-6 w-6 border border-white/20">
                            <AvatarImage src={msg.senderImage || undefined} />
                            <AvatarFallback className="text-[10px]">{msg.senderName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="bg-black/40 backdrop-blur-md rounded-lg rounded-tl-none px-3 py-1.5 text-sm text-white border border-white/10">
                            <span className="font-semibold text-white/80 mr-2">{msg.senderName}</span>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10">
                <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Say something..."
                    className="bg-transparent border-none text-white placeholder:text-white/50 focus-visible:ring-0 h-8"
                />
                <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                    disabled={!inputText.trim()}
                >
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    )
}
