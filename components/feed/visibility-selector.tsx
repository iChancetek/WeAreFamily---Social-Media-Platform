'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Globe, Users, Lock, ChevronDown, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCompanions } from "@/app/actions/companions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type PrivacyType = 'public' | 'companions' | 'specific' | 'private';

interface VisibilitySelectorProps {
    value: PrivacyType;
    onChange: (value: PrivacyType) => void;
    onAllowedViewersChange: (ids: string[]) => void;
    allowedViewerIds: string[];
}

export function VisibilitySelector({ value, onChange, onAllowedViewersChange, allowedViewerIds }: VisibilitySelectorProps) {
    const [viewerDialogOpen, setViewerDialogOpen] = useState(false);
    const [companions, setCompanions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    // Temp state for dialog
    const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(new Set(allowedViewerIds));

    useEffect(() => {
        // Pre-fetch companions if not already done, or fetch on dialog open
    }, []);

    const handleSelect = (val: string) => {
        if (val === 'specific') {
            setViewerDialogOpen(true);
            loadCompanions();
        } else {
            onChange(val as PrivacyType);
        }
    };

    const loadCompanions = async () => {
        if (companions.length > 0) return;
        setIsLoading(true);
        try {
            const data = await getCompanions();
            setCompanions(data);
        } catch (e) {
            toast.error("Failed to load companions");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(tempSelectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setTempSelectedIds(newSet);
    };

    const saveSpecific = () => {
        if (tempSelectedIds.size === 0) {
            toast.error("Please select at least one person");
            return;
        }
        onAllowedViewersChange(Array.from(tempSelectedIds));
        onChange('specific');
        setViewerDialogOpen(false);
    };

    const getIcon = () => {
        switch (value) {
            case 'public': return <Globe className="w-4 h-4" />;
            case 'companions': return <Users className="w-4 h-4" />;
            case 'specific': return <Users className="w-4 h-4" />; // Or a specific icon
            case 'private': return <Lock className="w-4 h-4" />;
            default: return <Globe className="w-4 h-4" />;
        }
    };

    const getLabel = () => {
        switch (value) {
            case 'public': return "Public";
            case 'companions': return "Companions";
            case 'specific': return "Specific Companions";
            case 'private': return "Only Me";
            default: return "Public";
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-8 px-3 rounded-full bg-background/50 backdrop-blur-sm border-white/20 hover:bg-white/10 dark:hover:bg-black/20 text-xs font-medium">
                        {getIcon()}
                        <span>{getLabel()}</span>
                        <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Who can see this?</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={value} onValueChange={handleSelect}>
                        <DropdownMenuRadioItem value="public" className="cursor-pointer">
                            <Globe className="w-4 h-4 mr-2" />
                            <div className="flex flex-col">
                                <span>Public</span>
                                <span className="text-[10px] text-muted-foreground">Anyone on Famio</span>
                            </div>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="companions" className="cursor-pointer">
                            <Users className="w-4 h-4 mr-2" />
                            <div className="flex flex-col">
                                <span>Companions</span>
                                <span className="text-[10px] text-muted-foreground">Your connections</span>
                            </div>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="specific" className="cursor-pointer">
                            <UserGroupIcon className="w-4 h-4 mr-2" />
                            <div className="flex flex-col">
                                <span>Specific Companions</span>
                                <span className="text-[10px] text-muted-foreground">Select people...</span>
                            </div>
                        </DropdownMenuRadioItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioItem value="private" className="cursor-pointer">
                            <Lock className="w-4 h-4 mr-2" />
                            <div className="flex flex-col">
                                <span>Only Me</span>
                                <span className="text-[10px] text-muted-foreground">Visible to you only</span>
                            </div>
                        </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={viewerDialogOpen} onOpenChange={setViewerDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select Audience</DialogTitle>
                        <DialogDescription>Only the people you select will be able to see this post.</DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[300px] pr-4">
                        {isLoading ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">Loading connections...</div>
                        ) : companions.length === 0 ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">No companions found.</div>
                        ) : (
                            <div className="space-y-2">
                                {companions.map((person) => {
                                    const isSelected = tempSelectedIds.has(person.id);
                                    return (
                                        <div
                                            key={person.id}
                                            onClick={() => toggleSelection(person.id)}
                                            className={cn(
                                                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border",
                                                isSelected ? "bg-primary/10 border-primary/50" : "hover:bg-muted border-transparent"
                                            )}
                                        >
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={person.imageUrl} />
                                                <AvatarFallback>{person.displayName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{person.displayName}</p>
                                                <p className="text-xs text-muted-foreground truncate">{person.email}</p>
                                            </div>
                                            {isSelected && <Check className="w-4 h-4 text-primary" />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewerDialogOpen(false)}>Cancel</Button>
                        <Button onClick={saveSpecific} disabled={tempSelectedIds.size === 0}>
                            Done ({tempSelectedIds.size})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function UserGroupIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
