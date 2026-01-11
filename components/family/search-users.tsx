"use client"

import { Input } from "@/components/ui/input"
import { useState, useTransition } from "react"
import { searchUsers } from "@/app/actions/family"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FamilyRequestButton } from "./family-request-button"
import { Loader2, Search } from "lucide-react"
import { useDebouncedCallback } from "use-debounce"
import Link from "next/link"

export function SearchUsers() {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<any[]>([])
    const [isSearching, startTransition] = useTransition()

    const handleSearch = useDebouncedCallback((term: string) => {
        if (term.length < 2) {
            setResults([])
            return
        }
        startTransition(async () => {
            const users = await searchUsers(term)
            setResults(users)
        })
    }, 500)

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search for members..."
                    className="pl-9"
                    onChange={(e) => {
                        setQuery(e.target.value)
                        handleSearch(e.target.value)
                    }}
                />
            </div>

            {isSearching && (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {!isSearching && results.length === 0 && query.length >= 2 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                    No users found matching "{query}"
                </div>
            )}

            <div className="space-y-2">
                {results.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground shadow-sm gap-3">
                        <Link href={`/u/${user.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 min-w-0">
                            <Avatar>
                                <AvatarImage src={user.imageUrl} />
                                <AvatarFallback>{user.displayName?.slice(0, 2).toUpperCase() || user.email.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate">{user.displayName || user.email}</span>
                                {user.displayName && <span className="text-xs text-muted-foreground truncate">{user.email}</span>}
                            </div>
                        </Link>
                        <FamilyRequestButton
                            targetUserId={user.id}
                            initialStatus={user.familyStatus.status}
                            initialRequestId={user.familyStatus.requestId}
                            className="h-8 text-xs"
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
