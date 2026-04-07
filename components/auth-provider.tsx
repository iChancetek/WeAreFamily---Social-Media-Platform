"use client"

import { useEffect, useState } from "react"
import { getAuth, onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth"
import { createSession, deleteSession, syncUserToDb } from "@/app/actions/auth"
import { useRouter } from "next/navigation"

import "@/lib/firebase"; // Ensure firebase is initialized
import { AuthContext, useAuth } from "./auth-context"

export { useAuth };

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
                // Always reload to fetch the latest emailVerified status from Firebase
                try { await firebaseUser.reload(); } catch { /* ignore */ }
                // Re-read the user after reload
                const freshUser = auth.currentUser || firebaseUser;
                setUser(freshUser);

                // Don't create a session for unverified users
                if (!freshUser.emailVerified) {
                    console.log("[AuthProvider] User is not email-verified, skipping session creation.");
                    setLoading(false);
                    return;
                }

                try {
                    const nameParts = (freshUser.displayName || "").split(' ');
                    const firstName = nameParts[0] || "Famio";
                    const lastName = nameParts.slice(1).join(' ') || "Member";

                    // Sync to DB — but don't let a DB error block session creation
                    try {
                        await syncUserToDb(
                            freshUser.uid,
                            freshUser.email || "",
                            freshUser.displayName || freshUser.email?.split('@')[0] || "User",
                            firstName,
                            lastName,
                            freshUser.emailVerified
                        );
                        console.log("[AuthProvider] User synced.");
                    } catch (syncError) {
                        console.error("[AuthProvider] DB sync failed (non-fatal):", syncError);
                        // Continue — session creation is more important
                    }

                    // Create server-side session cookie
                    await createSession(freshUser.uid);

                    // Listen to Firestore profile in realtime
                    const { db } = await import("@/lib/firebase");
                    const { doc, onSnapshot } = await import("firebase/firestore");
                    profileUnsubscribe = onSnapshot(doc(db, "users", freshUser.uid), (snap) => {
                        if (snap.exists()) {
                            setProfile({ ...snap.data(), id: snap.id });
                        }
                    });

                    router.refresh();

                } catch (error) {
                    console.error("[AuthProvider] Critical auth setup failed:", error);
                }
            } else {
                setUser(null)
                setProfile(null)
                if (profileUnsubscribe) profileUnsubscribe();
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
