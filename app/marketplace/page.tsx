import { MainLayout } from "@/components/layout/main-layout";
import { MarketplaceFeed } from "@/components/marketplace/marketplace-feed";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Marketplace | Famio",
    description: "Buy, sell, and share items with your family and companions.",
};

export default function MarketplacePage() {
    return (
        <MainLayout>
            <MarketplaceFeed />
        </MainLayout>
    );
}
