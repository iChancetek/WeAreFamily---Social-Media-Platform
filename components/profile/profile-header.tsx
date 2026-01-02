'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Mail } from "lucide-react";
import Link from "next/link";

import { FamilyRequestButton } from "@/components/family/family-request-button";
import { FamilyStatus } from "@/app/actions/family";

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
                            <FamilyRequestButton
                                targetUserId={user.id}
                                initialStatus={familyStatus.status}
                                initialRequestId={familyStatus.requestId}
                                className="h-9"
                            />
                        )}
                        {isOwnProfile ? (
                            <Link href="/settings">
                                <Button variant="outline" size="sm" className="gap-2 h-9">
                                    <Edit className="w-4 h-4" /> Edit Profile
                                </Button>
                            </Link>
                        ) : (
                            <Button className="bg-rose-500 hover:bg-rose-600 text-white gap-2 h-9">
                                <Mail className="w-4 h-4" /> Message
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
