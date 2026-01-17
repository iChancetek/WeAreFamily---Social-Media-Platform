"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users } from "lucide-react";
import { Branding } from "@/app/actions/branding";
import { useState, useRef, useEffect } from "react";

export function BrandingCard({ branding }: { branding: Branding }) {
    const [imageError, setImageError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Check for broken image on mount/update (catches pre-hydration errors)
    useEffect(() => {
        const img = imgRef.current;
        if (img && img.complete && (img.naturalWidth === 0)) {
            // Move state update to next tick to avoid "setState in useEffect" warning
            const timer = setTimeout(() => setImageError(true), 0);
            return () => clearTimeout(timer);
        }
    }, [branding.coverUrl, branding.imageUrl]);

    // Determines what to show.
    // If we have a coverUrl and no error -> show cover
    // If coverUrl fails or is missing -> try imageUrl
    // If imageUrl fails or is missing -> show fallback

    const hasCover = !!branding.coverUrl && !imageError;
    // We treat video covers as robust for now, assuming valid URL if mp4/webm. 
    // Ideally we'd wrap video in error boundaries too, but <img> is the main culprit here.
    const isVideo = hasCover && (branding.coverUrl!.includes('mp4') || branding.coverUrl!.includes('webm'));

    // Fallback logic is tricky with dual images. 
    // Simplest robust fix: If the MAIN display image fails, revert to the "Default Gradient" state.

    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="h-32 w-full bg-muted relative rounded-t-lg overflow-hidden">
                {hasCover ? (
                    <>
                        {isVideo ? (
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
                                alt={branding.name}
                                className="w-full h-full object-cover"
                                onError={() => setImageError(true)}
                            />
                        )}
                        {/* Overlay Logo if Cover exists */}
                        {branding.imageUrl && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-white shadow-lg">
                                    <img
                                        src={branding.imageUrl}
                                        alt={branding.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                ) : branding.imageUrl && !imageError ? (
                    // Logic when NO cover but YES logo -> use logo as cover
                    <img
                        ref={imgRef}
                        src={branding.imageUrl}
                        alt={branding.name}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    // Fallback to Gradient
                    <div className="w-full h-full bg-gradient-to-br from-green-600/20 to-green-600/10 flex items-center justify-center">
                        <Briefcase className="w-12 h-12 text-green-600/40" />
                    </div>
                )}
            </div>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg leading-tight">{branding.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{branding.category.replace('_', ' ')}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {branding.description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{branding.followerCount || 1} followers</span>
                </div>
            </CardContent>
            <CardFooter>
                <Button asChild variant="outline" className="w-full">
                    <Link href={`/branding/${branding.slug || branding.id}`}>
                        View Branding
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
