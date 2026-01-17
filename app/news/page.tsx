export const dynamic = 'force-dynamic';

import { MainLayout } from "@/components/layout/main-layout";
import { NewsFeed } from "@/components/news/news-feed";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewsPage() {
    return (
        <MainLayout>
            <div className="max-w-xl mx-auto py-6 px-4">
                <div className="flex items-center gap-2 mb-6">
                    <Link href="/" className="md:hidden">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold">News Feed</h1>
                </div>
                <NewsFeed />
            </div>
        </MainLayout>
    );
}
