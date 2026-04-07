"use client"

import { createContext, useContext } from "react"
import { User } from "firebase/auth"

export type AuthContextType = {
    user: User | null
    profile: any | null
    loading: boolean
    signOut: () => Promise<void>
    refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshUser: async () => { },
})

export const useAuth = () => useContext(AuthContext)
