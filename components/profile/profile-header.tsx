'use client'

import { BlockButton } from "@/components/profile/block-button";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Mail } from "lucide-react";
import Link from "next/link";

import { FamilyRequestButton } from "@/components/family/family-request-button";
import { FamilyStatus } from "@/app/actions/family";
import { checkOrCreateChat } from "@/app/actions/chat";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

type User = {
    id: string;
    email: string;
    profileData: unknown;
    displayName?: string | null;
    bio?: string | null;
    coverUrl?: string | null;
    coverType?: string | null;
}

interface ProfileHeaderProps {
    user: User;
    isOwnProfile: boolean;
    familyStatus: {
        status: FamilyStatus;
        requestId?: number;
    }
}

export function ProfileHeader({ user, isOwnProfile, familyStatus }: ProfileHeaderProps) {
    const router = useRouter();
    const [isMessaging, setIsMessaging] = useState(false);

    const handleMessage = async () => {
        setIsMessaging(true);
        try {
            const chatId = await checkOrCreateChat(user.id);
            router.push(`/messages?chatId=${chatId}`);
        } catch (error) {
            console.error("Failed to start chat", error);
            setIsMessaging(false);
        }
    };

    // Merge user table fields with profileData for backward compatibility or direct access
    const profile = {
        ...(user.profileData as { firstName?: string, lastName?: string, imageUrl?: string } | null),
        bio: user.bio,
        displayName: user.displayName,
        coverUrl: user.coverUrl,
        coverType: user.coverType
    };

    // Prioritize displayName, then profileData names, then email
    const name = user.displayName || (profile?.firstName ? `${profile.firstName} ${profile.lastName}` : (user.email ? user.email : "User"));
    const initials = name.slice(0, 2).toUpperCase();

    return (
        <Card className="border-rose-100 shadow-sm relative overflow-hidden">
            <div className="h-32 bg-gray-100 relative">
                {profile?.coverUrl ? (
                    profile.coverType === 'video' ? (
                        <video src={profile.coverUrl} className="w-full h-full object-cover" autoPlay loop muted />
                    ) : (
                        <img src={profile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    )
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-rose-100 to-rose-200" />
                )}
            </div>
            <CardContent className="pt-0 relative">
                <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-12 px-2">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-sm ring-2 ring-rose-50">
                        <AvatarImage src={profile?.imageUrl} />
                        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                        <p className="text-gray-500 text-sm">{profile.bio || "No bio yet"}</p>
                    </div>
                    <div className="flex gap-2 mb-4 md:mb-2 items-center">
                        {!isOwnProfile && (
                            <>
                                <FamilyRequestButton
                                    targetUserId={user.id}
                                    initialStatus={familyStatus.status}
                                    initialRequestId={familyStatus.requestId}
                                    className="h-9"
                                />
                                <Button
                                    variant="outline"
                                    className="h-9"
                                    disabled={isMessaging}
                                    onClick={handleMessage}
                                >
                                    {isMessaging ? <Loader2 className="w-4 h-4 animate-spin" /> : "Message"}
                                </Button>
                                <BlockButton targetUserId={user.id} />
                            </>
                        )}
                        {isOwnProfile && (
                            <Link href="/settings">
                                <Button variant="outline" className="gap-2 h-9">
                                    <Edit className="w-4 h-4" />
                                    Edit Profile
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
