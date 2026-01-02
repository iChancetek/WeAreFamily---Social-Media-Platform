"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-context"
import { Edit2 } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ProfileContent } from "./profile-content"

interface ProfileHeaderProps {
    user: {
        id: string;
        displayName?: string | null;
        imageUrl?: string | null;
        coverUrl?: string | null;
        coverType?: string | null;
        bio?: string | null;
    };
    isCurrentUser?: boolean;
}

export function ProfileHeader({ user, isCurrentUser }: ProfileHeaderProps) {
    const { t } = useLanguage()
    const [isEditing, setIsEditing] = useState(false)

    const initials = user.displayName?.slice(0, 2).toUpperCase() || "U"

    return (
        <div className="relative mb-8">
            {/* Cover Photo/Video */}
            <div className="relative h-48 md:h-64 rounded-xl overflow-hidden bg-muted group">
                {user.coverUrl ? (
                    user.coverType === 'video' ? (
                        <video
                            src={user.coverUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                    ) : (
                        <img
                            src={user.coverUrl}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                    )
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-500/20 to-purple-500/20" />
                )}
            </div>

            {/* Avatar & Profile Info */}
            <div className="px-4 -mt-12 sm:-mt-16 sm:px-6 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between sm:space-x-5">
                    <div className="flex">
                        <Avatar className="h-24 w-24 sm:h-32 sm:w-32 rounded-full ring-4 ring-white dark:ring-slate-950 bg-white">
                            <AvatarImage src={user.imageUrl || undefined} className="object-cover" />
                            <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="mt-6 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
                        <div className="sm:hidden 2xl:block mt-6 min-w-0 flex-1">
                            <h1 className="text-2xl font-bold text-foreground truncate">
                                {user.displayName}
                            </h1>
                        </div>
                        <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                            {isCurrentUser && (
                                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="gap-2">
                                            <Edit2 className="h-4 w-4" />
                                            {t("profile.edit")}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <ProfileContent user={user as any} />
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </div>
                </div>
                <div className="hidden sm:block 2xl:hidden mt-6 min-w-0 flex-1">
                    <h1 className="text-2xl font-bold text-foreground truncate">
                        {user.displayName}
                    </h1>
                </div>

                {user.bio && (
                    <p className="mt-4 text-muted-foreground max-w-2xl">
                        {user.bio}
                    </p>
                )}
            </div>
        </div>
    )
}
