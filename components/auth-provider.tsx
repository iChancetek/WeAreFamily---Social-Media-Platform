"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getAuth, onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth"
import { createSession, deleteSession } from "@/app/actions/auth"
import { useRouter } from "next/navigation"

import "@/lib/firebase"; // Ensure firebase is initialized

type AuthContextType = {
    user: User | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const auth = getAuth()
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser)
                // Sync session to server
                await createSession(firebaseUser.uid)
            } else {
                setUser(null)
                // Clear session on server
                await deleteSession()
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const signOut = async () => {
        const auth = getAuth()
        await firebaseSignOut(auth)
        await deleteSession()
        router.push("/login")
    }

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}
