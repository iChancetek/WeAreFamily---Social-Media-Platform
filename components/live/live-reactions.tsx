"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Heart, ThumbsUp, Laugh, Zap, Hand } from "lucide-react" // Fallback icons
import { onSnapshot, collection, addDoc, query, orderBy, limit, serverTimestamp, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"

// Emoji map
const REACTION_EMOJIS = [
    { id: 'heart', emoji: '❤️', label: 'Love' },
    { id: 'fire', emoji: '🔥', label: 'Fire' },
    { id: 'laugh', emoji: '😂', label: 'Haha' },
    { id: 'wow', emoji: '😮', label: 'Wow' },
    { id: 'wave', emoji: '👋', label: 'Wave' },
]

interface Reaction {
    id: string;
    emoji: string;
    createdAt: any;
    senderId: string;
    x: number; // Random X position for variety
}

export function LiveReactions({ sessionId, showControls = true }: { sessionId: string; showControls?: boolean }) {
    const { user } = useAuth()
    const [reactions, setReactions] = useState<Reaction[]>([])
    const lastReactionTimeRef = useRef<number>(Date.now())

    useEffect(() => {
        if (!sessionId) return

        // Listen for new reactions
        // We only care about reactions created *after* we joined/loaded
        const now = Timestamp.now()

        const q = query(
            collection(db, `active_sessions/${sessionId}/reactions`),
            orderBy("createdAt", "desc"),
            limit(10)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const data = change.doc.data()
                    // Filter out old reactions (older than 5 seconds ago) to prevent flood on load
                    // or just check if it's new based on local ref
                    const reactionTime = data.createdAt?.toMillis() || Date.now()

                    if (reactionTime > lastReactionTimeRef.current) {
                        const newReaction = {
                            id: change.doc.id,
                            emoji: data.emoji,
                            createdAt: data.createdAt,
                            senderId: data.senderId,
                            x: Math.random() * 80 + 10 // 10% to 90%
                        }

                        setReactions((prev) => [...prev, newReaction])

                        // Remove from state after animation
                        setTimeout(() => {
                            setReactions((prev) => prev.filter(r => r.id !== newReaction.id))
                        }, 2500)

                        lastReactionTimeRef.current = Math.max(lastReactionTimeRef.current, reactionTime)
                    }
                }
            })
        })

        return () => unsubscribe()
    }, [sessionId])

    const sendReaction = async (emoji: string) => {
        if (!user) return

        // Optimistic update for sender? 
        // We can just rely on the listener, but it might be slower. 
        // Let's rely on listener for consistency for now, or add a distinct local one.
        // Actually, let's just add it locally immediately for feedback
        const localId = Math.random().toString(36)
        const newReaction = {
            id: localId,
            emoji: emoji,
            createdAt: Timestamp.now(),
            senderId: user.uid,
            x: Math.random() * 40 + 50 // Bias towards right side
        }

        // Don't add to state directly here if we want to dedupe with listener, 
        // simply relying on listener is safer for multiplayer feel.

        try {
            await addDoc(collection(db, `active_sessions/${sessionId}/reactions`), {
                emoji,
                senderId: user.uid,
                createdAt: serverTimestamp()
            })
        } catch (err) {
            console.error("Failed to send reaction:", err)
        }
    }

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
            {/* Reaction Buttons (Bottom Right) */}
            {showControls && (
                <div className="absolute bottom-20 right-4 pointer-events-auto flex flex-col gap-2">
                    {REACTION_EMOJIS.map((item) => (
                        <Button
                            key={item.id}
                            variant="secondary"
                            size="icon"
                            className="rounded-full h-10 w-10 bg-black/40 backdrop-blur-md hover:bg-black/60 border border-white/10 shadow-lg text-lg transition-transform hover:scale-110 active:scale-90"
                            onClick={() => sendReaction(item.emoji)}
                        >
                            {item.emoji}
                        </Button>
                    ))}
                </div>
            )}

            {/* In-flight Reactions */}
            <AnimatePresence>
                {reactions.map((reaction) => (
                    <motion.div
                        key={reaction.id}
                        className="absolute bottom-20 text-4xl"
                        initial={{
                            opacity: 0,
                            y: 0,
                            x: `${reaction.x}%`,
                            scale: 0.5
                        }}
                        animate={{
                            opacity: [0, 1, 1, 0],
                            y: -400, // Float up
                            x: `${reaction.x + (Math.random() * 20 - 10)}%`, // Wiggle
                            scale: [0.5, 1.2, 1]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                    >
                        {reaction.emoji}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
