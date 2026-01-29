"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { getActiveBroadcasts } from "@/app/actions/rtc"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface LivePresenceContextType {
    liveUsers: Set<string>; // Set of user IDs who are currently live
    checkIsLive: (userId: string) => boolean;
    getBroadcastId: (userId: string) => string | undefined;
}

const LivePresenceContext = createContext<LivePresenceContextType | undefined>(undefined)

export function LivePresenceProvider({ children }: { children: React.ReactNode }) {
    const [liveUsers, setLiveUsers] = useState<Set<string>>(new Set())
    const [userBroadcastMap, setUserBroadcastMap] = useState<Map<string, string>>(new Map()) // userId -> broadcastId

    useEffect(() => {
        // Poll for active broadcasts every 10 seconds (or use snapshot if feasible)
        // Using polling for "active_sessions" collection to reduce reads if frequent updates aren't needed,
        // BUT user wanted "Real-time everywhere". A snapshot on "active_sessions" where type=='broadcast' and status=='active' is best.

        const q = query(
            collection(db, "active_sessions"),
            where("type", "==", "broadcast"),
            where("status", "==", "active")
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newLiveUsers = new Set<string>()
            const newMap = new Map<string, string>()

            snapshot.docs.forEach(doc => {
                const data = doc.data()
                if (data.hostId) {
                    newLiveUsers.add(data.hostId)
                    newMap.set(data.hostId, doc.id)
                }
            })

            setLiveUsers(newLiveUsers)
            setUserBroadcastMap(newMap)
        }, (error) => {
            console.error("Error listening to live broadcast presence:", error)
        })

        return () => unsubscribe()
    }, [])

    const checkIsLive = (userId: string) => liveUsers.has(userId)
    const getBroadcastId = (userId: string) => userBroadcastMap.get(userId)

    return (
        <LivePresenceContext.Provider value={{ liveUsers, checkIsLive, getBroadcastId }}>
            {children}
        </LivePresenceContext.Provider>
    )
}

export function useLivePresence() {
    const context = useContext(LivePresenceContext)
    if (context === undefined) {
        throw new Error("useLivePresence must be used within a LivePresenceProvider")
    }
    return context
}
