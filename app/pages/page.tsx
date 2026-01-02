import { getPages } from "@/app/actions/pages";
import { CreatePageDialog } from "@/components/pages/create-page-dialog";
import { PageCard } from "@/components/pages/page-card";
import { MainLayout } from "@/components/layout/main-layout";
import { Separator } from "@/components/ui/separator";

export default async function PagesPage() {
    const pages = await getPages();

    return (
        <MainLayout>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
                    <p className="text-muted-foreground">
                        Discover and follow brands, businesses, and public figures.
                    </p>
                </div>
                <CreatePageDialog />
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pages.map(page => (
                    <PageCard key={page.id} page={page} />
                ))}
            </div>

            {pages.length === 0 && (
                <div className="text-center py-12">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No pages yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Create a page for your business or brand.
                    </p>
                    <CreatePageDialog />
                </div>
            )}
        </MainLayout>
    );
}

import { Briefcase } from "lucide-react";
