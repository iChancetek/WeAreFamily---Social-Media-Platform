"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getAuth, onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth"
import { createSession, deleteSession, syncUserToDb } from "@/app/actions/auth"
import { useRouter } from "next/navigation"

import "@/lib/firebase"; // Ensure firebase is initialized

type AuthContextType = {
    user: User | null
    profile: any | null
    loading: boolean
    signOut: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshUser: async () => { },
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const auth = getAuth()
        let profileUnsubscribe: (() => void) | null = null;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser)
                try {
                    // Sync user to DB first
                    console.log("[AuthProvider] Syncing user to DB:", firebaseUser.uid);

                    const nameParts = (firebaseUser.displayName || "").split(' ');
                    const firstName = nameParts[0] || "Famio";
                    const lastName = nameParts.slice(1).join(' ') || "Member";

                    await syncUserToDb(
                        firebaseUser.uid,
                        firebaseUser.email || "",
                        firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User",
                        firstName,
                        lastName,
                        firebaseUser.emailVerified
                    );
                    console.log("[AuthProvider] User synced.");
                    // Then create session
                    await createSession(firebaseUser.uid)

                    // Listen to profile
                    const { db } = await import("@/lib/firebase");
                    const { doc, onSnapshot } = await import("firebase/firestore");
                    profileUnsubscribe = onSnapshot(doc(db, "users", firebaseUser.uid), (doc) => {
                        if (doc.exists()) {
                            setProfile({ ...doc.data(), id: doc.id });
                        }
                    });

                    // Refresh to ensure Server Components reflect the session
                    router.refresh();

                } catch (error) {
                    console.error("Auth sync failed:", error);
                }
            } else {
                setUser(null)
                setProfile(null)
                if (profileUnsubscribe) profileUnsubscribe();
                // Clear session on server
                await deleteSession()
            }
            setLoading(false)
        })

        return () => {
            unsubscribe();
            if (profileUnsubscribe) profileUnsubscribe();
        }
    }, [])

    const signOut = async () => {
        const auth = getAuth()
        await firebaseSignOut(auth)
        await deleteSession()
        router.push("/login")
    }

    const refreshUser = async () => {
        if (!user) return;
        try {
            await user.reload();
            // Re-sync to DB to update verification status there too
            const nameParts = (user.displayName || "").split(' ');
            const firstName = nameParts[0] || "Famio";
            const lastName = nameParts.slice(1).join(' ') || "Member";

            await syncUserToDb(
                user.uid,
                user.email || "",
                user.displayName || user.email?.split('@')[0] || "User",
                firstName,
                lastName,
                user.emailVerified
            );

            // Force state update
            setUser({ ...user });
            router.refresh();
        } catch (e) {
            console.error("User refresh failed", e);
        }
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}
