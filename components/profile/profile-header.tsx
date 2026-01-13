"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-context"
import { Edit2, BookHeart } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ProfileContent } from "./profile-content"
import { BlockButton } from "@/components/profile/block-button"
import { toast } from "sonner"
import { ProfileShareButton } from "@/components/profile/profile-share-button"

interface ProfileHeaderProps {
    user: {
        id: string;
        displayName?: string | null;
        imageUrl?: string | null;
        coverUrl?: string | null;
        coverType?: string | null;
        bio?: string | null;
        isPublicProfile?: boolean;
    };
    isCurrentUser?: boolean;
    isBlocked?: boolean;
}

export function ProfileHeader({ user, isCurrentUser, isBlocked }: ProfileHeaderProps) {
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
                            style={{ objectPosition: 'center 10%' }}
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
                            {isCurrentUser ? (
                                <div className="flex flex-col w-full gap-3 sm:flex-row sm:w-auto sm:gap-2">
                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-auto flex-1 sm:flex-none gap-2 border-blue-500/20 hover:bg-blue-500/5 text-blue-600 dark:text-blue-400"
                                        onClick={() => {
                                            const event = new CustomEvent('famio:open-ai', {
                                                detail: {
                                                    mode: 'biographer',
                                                    context: "I want to record a memory for my legacy.",
                                                    type: 'biographer_start'
                                                }
                                            });
                                            window.dispatchEvent(event);
                                            toast.success("Biographer initialized 🖋️");
                                        }}
                                    >
                                        <BookHeart className="h-4 w-4" />
                                        Record Memory
                                    </Button>
                                    <Dialog open={isEditing} onOpenChange={setIsEditing}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full sm:w-auto gap-2">
                                                <Edit2 className="h-4 w-4" />
                                                {t("profile.edit")}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                            <ProfileContent
                                                user={user as any}
                                                onClose={() => setIsEditing(false)}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                    <div className="w-full sm:w-auto">
                                        <ProfileShareButton
                                            userId={user.id}
                                            displayName={user.displayName || "Famio Member"}
                                            isPublic={user.isPublicProfile || false}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col w-full gap-3 sm:flex-row sm:w-auto sm:gap-2">
                                    <div className="w-full sm:w-auto">
                                        <BlockButton
                                            targetUserId={user.id}
                                            isBlocked={isBlocked}
                                        />
                                    </div>
                                    <div className="w-full sm:w-auto">
                                        <ProfileShareButton
                                            userId={user.id}
                                            displayName={user.displayName || "Famio Member"}
                                            isPublic={user.isPublicProfile || false}
                                        />
                                    </div>
                                </div>
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
