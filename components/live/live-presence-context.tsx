"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { getActiveBroadcasts } from "@/app/actions/rtc"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth-context"

interface BroadcastData {
    id: string;
    hostId: string;
    hostName?: string;
    hostPhotoURL?: string;
    title?: string;
    // add other fields as needed
}

interface LivePresenceContextType {
    liveUsers: Set<string>; // Set of user IDs who are currently live
    activeBroadcasts: BroadcastData[]; // List of active broadcast objects
    checkIsLive: (userId: string) => boolean;
    getBroadcastId: (userId: string) => string | undefined;
}

const LivePresenceContext = createContext<LivePresenceContextType | undefined>(undefined)

export function LivePresenceProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const [liveUsers, setLiveUsers] = useState<Set<string>>(new Set())
    const [activeBroadcasts, setActiveBroadcasts] = useState<BroadcastData[]>([])
    const [userBroadcastMap, setUserBroadcastMap] = useState<Map<string, string>>(new Map()) // userId -> broadcastId

    useEffect(() => {
        if (!user) {
            setLiveUsers(new Set())
            setActiveBroadcasts([])
            setUserBroadcastMap(new Map())
            return
        }

        const q = query(
            collection(db, "active_sessions"),
            where("type", "==", "broadcast"),
            where("status", "==", "active")
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newLiveUsers = new Set<string>()
            const newMap = new Map<string, string>()
            const newBroadcasts: BroadcastData[] = []

            snapshot.docs.forEach(doc => {
                const data = doc.data()
                if (data.hostId) {
                    newLiveUsers.add(data.hostId)
                    newMap.set(data.hostId, doc.id)
                    newBroadcasts.push({
                        id: doc.id,
                        hostId: data.hostId,
                        hostName: data.hostName,
                        hostPhotoURL: data.hostPhotoURL,
                        title: data.title
                    })
                }
            })

            setLiveUsers(newLiveUsers)
            setUserBroadcastMap(newMap)
            setActiveBroadcasts(newBroadcasts)
        }, (error) => {
            console.error("Error listening to live broadcast presence:", error)
        })

        return () => unsubscribe()
    }, [user])

    const checkIsLive = (userId: string) => liveUsers.has(userId)
    const getBroadcastId = (userId: string) => userBroadcastMap.get(userId)

    return (
        <LivePresenceContext.Provider value={{ liveUsers, activeBroadcasts, checkIsLive, getBroadcastId }}>
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
