"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { searchUsers } from "@/app/actions/family";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDebounce } from "@/hooks/use-debounce"; // Assuming this exists, or I'll implement simple debounce

// Simple debounce hook if not present, but I'll implement inline logic to be safe or assuming the user wants me to use standard patterns
// If hooks/use-debounce doesn't exist, I'll just use a timeout.
// Let's implement a self-contained one to avoid dependency issues.

export function UserSearch({ onSelect }: { onSelect: (userId: string) => void }) {
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState("");
    const [query, setQuery] = React.useState("");
    const [users, setUsers] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState<any>(null);

    // simple debounce
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 1) {
                handleSearch(query);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async (term: string) => {
        setLoading(true);
        try {
            const results = await searchUsers(term);
            setUsers(results);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedUser ? (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={selectedUser.imageUrl || undefined} className="object-cover" />
                                <AvatarFallback>{selectedUser.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{selectedUser.displayName}</span>
                        </div>
                    ) : (
                        "Select user..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search user..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {loading && <div className="p-4 text-sm text-muted-foreground text-center">Searching...</div>}
                        {!loading && users.length === 0 && <CommandEmpty>No users found.</CommandEmpty>}
                        <CommandGroup>
                            {users.map((user) => (
                                <CommandItem
                                    key={user.id}
                                    value={user.id}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue === value ? "" : currentValue);
                                        setSelectedUser(user);
                                        onSelect(user.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === user.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <Avatar className="h-6 w-6 mr-2">
                                        <AvatarImage src={user.imageUrl || undefined} className="object-cover" />
                                        <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.displayName}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
