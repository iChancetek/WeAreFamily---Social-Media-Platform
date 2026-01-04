import { getBrandings, Branding } from "@/app/actions/branding";
import { CreateBrandingDialog } from "@/components/branding/create-branding-dialog";
import { BrandingCard } from "@/components/branding/branding-card";
import { MainLayout } from "@/components/layout/main-layout";
import { getUserProfile } from "@/lib/auth";
import { Separator } from "@/components/ui/separator";
import { Briefcase } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BrandingPage() {
    const brandings = await getBrandings();

    return (
        <MainLayout>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Branding</h1>
                    <p className="text-muted-foreground">
                        Discover and follow brands, businesses, and public figures.
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
                        Create a branding for your business or brand.
                    </p>
                    <CreateBrandingDialog />
                </div>
            )}
        </MainLayout>
    );
}
