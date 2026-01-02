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
    imageUrl?: string | null;
    coverUrl?: string | null;
    coverType?: string | null;
}

interface ProfileHeaderProps {
    user: User;
    isOwnProfile: boolean;
    familyStatus: FamilyStatus;
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
        } finally {
            setIsMessaging(false);
        }
    };

    const profile = user.profileData as { bio?: string, imageUrl?: string } | null;
    const name = user.displayName || user.email;
    const initials = name.slice(0, 2).toUpperCase();

    // Prioritize root fields, fallback to legacy profileData
    const bio = user.bio || profile?.bio || "No bio yet";
    const imageUrl = user.imageUrl || profile?.imageUrl;

    return (
        <div className="relative mb-8">
            {/* Cover Image */}
            <div className="h-48 md:h-64 bg-gradient-to-r from-blue-400 to-indigo-500 w-full object-cover">
                {user.coverUrl && (
                    <img src={user.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                )}
            </div>

            <div className="container px-4 mx-auto">
                <div className="relative -mt-12 flex flex-col md:flex-row items-end md:items-center gap-4">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-sm ring-2 ring-rose-50">
                        <AvatarImage src={imageUrl} />
                        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                        <p className="text-gray-500 text-sm">{bio}</p>
                    </div>
                    <div className="flex gap-2 mb-4 md:mb-2 items-center">
                        {!isOwnProfile && (
                            <>
                                <FamilyRequestButton
                                    targetUserId={user.id}
                                    initialStatus={familyStatus}
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
            </div>
        </div>
    )
}
