"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLanguage } from "@/components/language-context"
import Link from "next/link"

interface Companion {
    id: string;
    displayName?: string | null;
    imageUrl?: string | null;
}

interface CompanionsCardProps {
    members: Companion[];
}

export function CompanionsCard({ members }: CompanionsCardProps) {
    const { t } = useLanguage()

    if (members.length === 0) return null;

    return (
        <Card className="glass-card border-none rounded-lg h-fit">
            <CardHeader className="p-4">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                    {t("profile.companions")}
                    <span className="text-sm font-normal text-muted-foreground">{members.length}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-3 gap-2">
                    {members.slice(0, 9).map((member) => (
                        <Link
                            key={member.id}
                            href={`/u/${member.id}`}
                            className="flex flex-col items-center gap-1 group"
                        >
                            <Avatar className="w-full aspect-square rounded-md border border-border dark:border-white/10 group-hover:opacity-80 transition-opacity">
                                <AvatarImage src={member.imageUrl || undefined} className="object-cover" />
                                <AvatarFallback>{member.displayName?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] text-center truncate w-full font-medium text-muted-foreground">
                                {member.displayName?.split(' ')[0]}
                            </span>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
