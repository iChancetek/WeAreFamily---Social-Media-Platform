"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/feed/post-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { Grid, Image, Film, Users, LayoutList } from "lucide-react";
import { useLanguage } from "@/components/language-context";

interface ProfileTabsProps {
    posts: any[];
    familyMembers: any[];
    isOwnProfile: boolean;
    currentUserId?: string;
}

export function ProfileTabs({ posts, familyMembers, isOwnProfile, currentUserId }: ProfileTabsProps) {
    const { t } = useLanguage();
    const router = useRouter();

    const photos = posts.flatMap(post =>
        (post.mediaUrls || []).filter((url: string) => !url.match(/\.(mp4|webm)$/i)).map((url: string) => ({ url, postId: post.id }))
    );

    const videos = posts.flatMap(post =>
        (post.mediaUrls || []).filter((url: string) => url.match(/\.(mp4|webm)$/i)).map((url: string) => ({ url, postId: post.id }))
    );

    return (
        <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="timeline" className="gap-2">
                    <LayoutList className="w-4 h-4" />
                    <span className="hidden sm:inline">Timeline</span>
                </TabsTrigger>
                <TabsTrigger value="photos" className="gap-2">
                    <Image className="w-4 h-4" />
                    <span className="hidden sm:inline">Photos</span>
                </TabsTrigger>
                <TabsTrigger value="videos" className="gap-2">
                    <Film className="w-4 h-4" />
                    <span className="hidden sm:inline">Videos</span>
                </TabsTrigger>
                <TabsTrigger value="family" className="gap-2">
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Family</span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-4">
                {posts.length === 0 ? (
                    <div className="p-8 text-center border rounded-xl bg-slate-50 dark:bg-slate-900 text-gray-500">
                        No posts yet.
                    </div>
                ) : (
                    posts.map(post => (
                        <PostCard key={post.id} post={post} currentUserId={currentUserId} />
                    ))
                )}
            </TabsContent>

            <TabsContent value="photos">
                {photos.length === 0 ? (
                    <div className="p-8 text-center border rounded-xl bg-slate-50 dark:bg-slate-900 text-gray-500">
                        No photos shared yet.
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
                        No videos shared yet.
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

            <TabsContent value="family">
                {familyMembers.length === 0 ? (
                    <div className="p-8 text-center border rounded-xl bg-slate-50 dark:bg-slate-900 text-gray-500">
                        No family connections yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {familyMembers.map((member) => (
                            <div key={member.id} className="flex items-center gap-3 p-4 bg-white dark:bg-card border rounded-lg hover:border-primary transition-colors cursor-pointer" onClick={() => router.push(`/u/${member.id}`)}>
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={member.imageUrl} />
                                    <AvatarFallback>{member.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{member.displayName}</p>
                                    <p className="text-sm text-gray-500">Family Member</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
}
