'use client';

import { useLanguage } from "@/components/language-context";
import { MainLayout } from "@/components/layout/main-layout";
import { GalleryGrid } from "@/components/gallery/gallery-grid";

interface GalleryViewProps {
    mediaItems: any[];
    currentUserId: string;
}

export function GalleryView({ mediaItems, currentUserId }: GalleryViewProps) {
    const { t } = useLanguage();

    return (
        <MainLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">{t('gallery.title')}</h1>
                <p className="text-muted-foreground">{t('gallery.desc')}</p>
            </div>

            <GalleryGrid
                items={mediaItems}
                currentUserId={currentUserId}
            />
        </MainLayout>
    );
}
