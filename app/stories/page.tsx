import { MainLayout } from "@/components/layout/main-layout";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StoriesTray } from "@/components/stories/stories-tray";

export default async function StoriesPage() {
    const user = await getUserProfile();
    if (!user) redirect("/login");

    return (
        <MainLayout className="max-w-5xl">
            <div className="pb-8 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Stories</h1>
                    <p className="text-muted-foreground">Share your moments with family. They disappear after 24 hours.</p>
                </div>

                <StoriesTray />
            </div>
        </MainLayout>
    );
}
