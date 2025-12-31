'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Define the Post type based on the schema and query result
type Post = {
    id: number;
    content: string;
    mediaUrls: string[] | null;
    createdAt: Date;
    author: {
        id: string;
        email: string;
        profileData: unknown;
    };
    likes: string[] | null;
}

export function PostCard({ post }: { post: Post }) {
    const profile = post.author.profileData as { firstName?: string, lastName?: string, imageUrl?: string } | null;
    const name = profile?.firstName ? `${profile.firstName} ${profile.lastName}` : post.author.email;
    const initials = name.slice(0, 2).toUpperCase();

    return (
        <Card className="mb-6 overflow-hidden border-rose-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center gap-4 p-4 pb-0">
                <Avatar>
                    <AvatarImage src={profile?.imageUrl} />
                    <AvatarFallback className="bg-rose-100 text-rose-600 font-medium">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{name}</span>
                    <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <p className="whitespace-pre-wrap text-gray-800 text-base leading-relaxed">{post.content}</p>
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="mt-4 rounded-lg overflow-hidden border border-gray-100">
                        {/* Simple image grid or carousel placeholder since we don't have storage working fully yet, just URLs */}
                        {post.mediaUrls.map((url, idx) => (
                            <img key={idx} src={url} alt="Post media" className="w-full h-auto object-cover max-h-96" />
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter className="px-4 py-3 bg-gray-50/50 flex justify-between items-center text-gray-500">
                <Button variant="ghost" size="sm" className="gap-2 hover:text-rose-600 hover:bg-rose-50">
                    <Heart className="w-4 h-4" />
                    <span className="text-xs">{post.likes?.length || 0} Likes</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 hover:text-blue-600 hover:bg-blue-50">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs">Comment</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 hover:text-gray-900">
                    <Share2 className="w-4 h-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
