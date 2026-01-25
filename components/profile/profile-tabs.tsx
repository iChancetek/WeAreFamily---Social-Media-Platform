"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/feed/post-card";
import { MasonryFeed } from "@/components/feed/masonry-feed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { Grid, Image, Film, Users, LayoutList, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/language-context";
import { useState } from "react";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { DeletedFeed } from "./deleted-feed";

interface ProfileTabsProps {
    posts: any[];
    companions: any[];
    isOwnProfile: boolean;
    currentUserId?: string;
}

export function ProfileTabs({ posts, companions, isOwnProfile, currentUserId }: ProfileTabsProps) {
    const { t } = useLanguage();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("timeline");

    // Auto-scroll integration (only active on Timeline tab)
    const {
        isEnabled,
        isPaused,
        containerRef,
    } = useAutoScroll({
        pauseOnHover: true,
        pauseOnInteraction: true,
    });

    const photos = posts.flatMap(post =>
        (post.mediaUrls || []).filter((url: string) => !url.match(/\.(mp4|webm)$/i)).map((url: string) => ({ url, postId: post.id }))
    );

    const videos = posts.flatMap(post =>
        (post.mediaUrls || []).filter((url: string) => url.match(/\.(mp4|webm)$/i)).map((url: string) => ({ url, postId: post.id }))
    );

    return (
        <>
            <Tabs defaultValue="timeline" className="w-full" onValueChange={setActiveTab}>
                <TabsList className={`grid w-full mb-8 ${isOwnProfile ? 'grid-cols-5' : 'grid-cols-4'}`}>
                    <TabsTrigger value="timeline" className="gap-2">
                        <LayoutList className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('profile.tabs.timeline')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="photos" className="gap-2">
                        <Image className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('profile.tabs.photos')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="videos" className="gap-2">
                        <Film className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('profile.tabs.videos')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="companions" className="gap-2">
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('profile.companions')}</span>
                    </TabsTrigger>
                    {isOwnProfile && (
                        <TabsTrigger value="trash" className="gap-2 text-red-500 data-[state=active]:text-red-600">
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Trash</span>
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="timeline" className="space-y-4">
                    {posts.length === 0 ? (
                        <div className="p-8 text-center border rounded-xl bg-slate-50 dark:bg-slate-900 text-gray-500">
                            {t('profile.empty.posts')}
                        </div>
                    ) : (
                        <div
                            ref={containerRef}
                            className="max-h-[calc(100vh-300px)] md:max-h-[calc(100vh-350px)] overflow-y-auto scroll-smooth overscroll-contain"
                            style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
                        >
                            <MasonryFeed posts={posts} currentUserId={currentUserId} />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="photos">
                    {photos.length === 0 ? (
                        <div className="p-8 text-center border rounded-xl bg-slate-50 dark:bg-slate-900 text-gray-500">
                            {t('profile.empty.photos')}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {photos.map((item, idx) => (
                                <div key={idx} className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer" onClick={() => router.push(`/post/${item.postId}`)}>
                                    <img src={item.url} alt="User photo" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="videos">
                    {videos.length === 0 ? (
                        <div className="p-8 text-center border rounded-xl bg-slate-50 dark:bg-slate-900 text-gray-500">
                            {t('profile.empty.videos')}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {videos.map((item, idx) => (
                                <div key={idx} className="aspect-square rounded-lg overflow-hidden relative group bg-black">
                                    <video src={item.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" controls />
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="companions">
                    {companions.length === 0 ? (
                        <div className="p-8 text-center border rounded-xl bg-slate-50 dark:bg-slate-900 text-gray-500">
                            {t('profile.empty.companions')}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {companions.map((member) => (
                                <div key={member.id} className="flex items-center gap-3 p-4 bg-white dark:bg-card border rounded-lg hover:border-primary transition-colors cursor-pointer" onClick={() => router.push(`/u/${member.id}`)}>
                                    <Avatar className="h-12 w-12 shrink-0">
                                        <AvatarImage src={member.imageUrl || undefined} className="object-cover" />
                                        <AvatarFallback>{member.displayName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{member.displayName}</p>
                                        <p className="text-sm text-gray-500">{t('profile.role.companion')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {isOwnProfile && (
                    <TabsContent value="trash">
                        <DeletedFeed userId={currentUserId || ""} />
                    </TabsContent>
                )}
            </Tabs>
        </>
    );
}
