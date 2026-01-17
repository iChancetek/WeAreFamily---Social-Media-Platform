"use client";

import { Branding } from "@/app/actions/branding";
import { BrandingCoverButton } from "@/components/branding/branding-cover-button";
import { BrandingManagementDialog } from "@/components/branding/branding-management-dialog";
import { FollowBrandingButton } from "@/components/branding/follow-branding-button";
import { ShareButton } from "@/components/shared/share-button";
import { Briefcase } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface BrandingHeaderProps {
    branding: Branding;
    currentUser: any;
    isBrandingAdmin: boolean;
    isFollowing: boolean;
    isFollowing: boolean;
    followStatusRole?: "admin" | "follower" | null;
}

export function BrandingHeader({
    branding,
    currentUser,
    isBrandingAdmin,
    isFollowing,
    followStatusRole
}: BrandingHeaderProps) {
    const [imageError, setImageError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Robust Image Error Handling (Same as BrandingCard)
    useEffect(() => {
        const img = imgRef.current;
        if (img && img.complete && (img.naturalWidth === 0)) {
            // Move state update to next tick to avoid "setState in useEffect" warning
            const timer = setTimeout(() => setImageError(true), 0);
            return () => clearTimeout(timer);
        }
    }, [branding.coverUrl]);

    const hasCover = !!branding.coverUrl && !imageError;
    const isVideo = hasCover && (branding.coverUrl!.includes('mp4') || branding.coverUrl!.includes('webm'));

    return (
        <div className="w-full bg-background border rounded-xl overflow-hidden shadow-sm mb-6">
            {/* Cover Area */}
            <div className="relative h-48 md:h-64 bg-muted w-full group">
                {hasCover ? (
                    isVideo ? (
                        <video
                            src={branding.coverUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                    ) : (
                        <img
                            ref={imgRef}
                            src={branding.coverUrl}
                            alt="Cover"
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                        />
                    )
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-600/20 to-green-600/10 flex items-center justify-center">
                        <Briefcase className="w-12 h-12 text-green-600/40" />
                    </div>
                )}

                {/* Edit Cover Button (Visible to Admin) */}
                {isBrandingAdmin && currentUser && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <BrandingCoverButton
                            brandingId={branding.id}
                            currentCoverUrl={branding.coverUrl}
                            userId={currentUser.id}
                        />
                    </div>
                )}
            </div>

            {/* Info Bar */}
            <div className="px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 -mt-12 md:-mt-16">
                    {/* Logo */}
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background bg-background shadow-md overflow-hidden relative z-10 shrink-0">
                        {branding.imageUrl ? (
                            <img
                                src={branding.imageUrl}
                                alt={branding.name}
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Briefcase className="w-8 h-8 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    {/* Accessibly Hidden / Mobile visual fix could go here if needed */}
                </div>

                {/* Details & Actions */}
                <div className="flex-1 min-w-0 mt-2 md:mt-0 md:ml-2">
                    <h1 className="text-2xl font-bold truncate">{branding.name}</h1>
                    <p className="text-muted-foreground text-sm capitalize">{branding.category.replace('_', ' ')} • {branding.followerCount || 0} followers</p>

                    {/* Description preview? (Optional, maybe keep it in the About card) */}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                    {isBrandingAdmin && currentUser && (
                        <BrandingManagementDialog
                            branding={branding}
                            currentUser={currentUser}
                            isAdmin={true}
                        />
                    )}
                    <FollowBrandingButton
                        brandingId={branding.id}
                        isFollowing={isFollowing}
                        role={followStatusRole}
                    />
                    <ShareButton
                        title={branding.name}
                        text={`Check out this page: ${branding.name}`}
                        variant="ghost"
                        className="h-9 w-9 p-0"
                    />
                </div>
            </div>
        </div>
    );
}
