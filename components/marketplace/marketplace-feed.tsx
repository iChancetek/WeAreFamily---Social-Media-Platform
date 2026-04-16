'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Tag, RefreshCw, Flag } from "lucide-react";
import { toast } from "sonner";
import { CreateListingDialog } from "@/components/marketplace/create-listing-dialog";
import { getListings, incrementRepostCount, incrementReportCount } from "@/app/actions/marketplace";
import { useEffect, useState } from "react";
import { MarketplaceListing } from "@/types/marketplace";
import { ReportDialog } from "@/components/reporting/report-dialog";

export function MarketplaceFeed() {
    const [listings, setListings] = useState<MarketplaceListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("all");
    const [reportTarget, setReportTarget] = useState<MarketplaceListing | null>(null);

    const fetchListings = async () => {
        setLoading(true);
        try {
            const data = await getListings(category);
            setListings(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRepost = async (listing: MarketplaceListing) => {
        try {
            await incrementRepostCount(listing.id);
            setListings(prev => prev.map(l => l.id === listing.id ? { ...l, repostCount: (l.repostCount || 0) + 1 } : l));
            toast.success("Listing reposted to your feed!");
        } catch (error: any) {
            toast.error(error.message || "Failed to repost");
        }
    };

    const handleReportSuccess = (listingId: string) => {
        setListings(prev => prev.map(l => l.id === listingId ? { ...l, reportCount: (l.reportCount || 0) + 1 } : l));
        setReportTarget(null);
    };

    useEffect(() => {
        fetchListings();
    }, [category]);

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">Marketplace</h1>
                    <p className="text-muted-foreground">Buy, sell, and share with your companions.</p>
                </div>
                <CreateListingDialog onListingCreated={(newListing: MarketplaceListing) => {
                    setListings(prev => [newListing, ...prev]);
                }}>
                    <Button className="bg-primary hover:bg-primary/90 text-white rounded-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Listing
                    </Button>
                </CreateListingDialog>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search marketplace..." className="pl-10 rounded-full bg-muted/50 border-none" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['all', 'vehicles', 'property', 'electronics', 'clothing', 'hobbies'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${category === cat
                                    ? "bg-primary text-white"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    // Skeletons
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="aspect-[3/4] bg-muted/30 rounded-xl animate-pulse" />
                    ))
                ) : listings.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-muted-foreground">
                        No listings found. Be the first to post!
                    </div>
                ) : (
                    listings.map(item => (
                        <div key={item.id} className="group cursor-pointer bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-border/50">
                            <div className="aspect-square bg-muted relative overflow-hidden">
                                {item.images?.[0] ? (
                                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        <Tag className="w-10 h-10 opacity-20" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-md">
                                    {item.category}
                                </div>
                            </div>
                            <div className="p-3">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold line-clamp-1">{item.title}</h3>
                                    <span className="font-bold text-primary">${item.price}</span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1 h-10">{item.description}</p>
                                <div className="mt-3 pt-3 border-t border-dashed flex justify-between items-center text-xs text-muted-foreground mb-3">
                                    <span>{(item as any).sellerName || 'Unknown Seller'}</span>
                                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={(e) => { e.stopPropagation(); handleRepost(item); }}
                                        className="h-8 px-2 gap-1.5 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        <span>{item.repostCount || 0}</span>
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={(e) => { e.stopPropagation(); setReportTarget(item); }}
                                        className="h-8 px-2 gap-1.5 rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 transition-colors"
                                    >
                                        <Flag className="w-4 h-4" />
                                        <span>{item.reportCount || 0}</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Reporting Dialog */}
            {reportTarget && (
                <ReportDialog
                    isOpen={!!reportTarget}
                    onClose={() => setReportTarget(null)}
                    onSuccess={() => handleReportSuccess(reportTarget.id)}
                    targetId={reportTarget.id}
                    targetType="marketplace_listing"
                />
            )}
        </div>
    );
}
