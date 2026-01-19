'use client';

import { Branding } from "@/app/actions/branding";
import { BrandingCard } from "@/components/branding/branding-card";
import { CreateBrandingDialog } from "@/components/branding/create-branding-dialog";
import { MainLayout } from "@/components/layout/main-layout";
import { useLanguage } from "@/components/language-context";
import { Separator } from "@/components/ui/separator";
import { Briefcase } from "lucide-react";

interface BrandingViewProps {
    brandings: Branding[];
}

export function BrandingView({ brandings }: BrandingViewProps) {
    const { t } = useLanguage();

    return (
        <MainLayout>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('branding.title')}</h1>
                    <p className="text-muted-foreground">
                        {t('branding.desc')}
                    </p>
                </div>
                <CreateBrandingDialog />
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {brandings.map((branding: Branding) => (
                    <BrandingCard key={branding.id} branding={branding} />
                ))}
            </div>

            {brandings.length === 0 && (
                <div className="text-center py-12">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No brandings yet</h3>
                    <p className="text-muted-foreground mb-4">
                        {t('branding.desc')}
                    </p>
                    <CreateBrandingDialog />
                </div>
            )}
        </MainLayout>
    );
}
