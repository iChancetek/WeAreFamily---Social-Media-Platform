'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Mail } from "lucide-react";

type User = {
    id: string;
    email: string;
    profileData: unknown;
}

export function ProfileHeader({ user, isOwnProfile }: { user: User, isOwnProfile: boolean }) {
    const profile = user.profileData as { firstName?: string, lastName?: string, imageUrl?: string, bio?: string } | null;
    const name = profile?.firstName ? `${profile.firstName} ${profile.lastName}` : user.email;
    const initials = name.slice(0, 2).toUpperCase();

    return (
        <Card className="border-rose-100 shadow-sm relative overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-rose-100 to-rose-200"></div>
            <CardContent className="pt-0 relative">
                <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-12 px-2">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-sm ring-2 ring-rose-50">
                        <AvatarImage src={profile?.imageUrl} />
                        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                        <p className="text-gray-500 text-sm">{profile?.bio || "No bio yet"}</p>
                    </div>
                    <div className="flex gap-2 mb-4 md:mb-2">
                        {isOwnProfile ? (
                            <Button variant="outline" size="sm" className="gap-2">
                                <Edit className="w-4 h-4" /> Edit Profile
                            </Button>
                        ) : (
                            <Button className="bg-rose-500 hover:bg-rose-600 text-white gap-2">
                                <Mail className="w-4 h-4" /> Message
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
