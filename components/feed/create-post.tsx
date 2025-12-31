'use client'

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "@/app/actions/posts";
import { toast } from "sonner";
import { ImageIcon, Loader2, Send } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export function CreatePost() {
    const { user } = useUser();
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            await createPost(content);
            setContent("");
            toast.success("Moment shared successfully! ❤️");
        } catch {
            toast.error("Failed to share moment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="mb-8 border-rose-100 shadow-sm">
            <CardContent className="p-4 pt-6">
                <div className="flex gap-4">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={user?.imageUrl} />
                        <AvatarFallback>{user?.firstName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                        <Textarea
                            placeholder="What's a happy memory you're thinking of?"
                            className="min-h-[100px] bg-gray-50/50 border-gray-200 focus:border-rose-300 focus:ring-rose-200 resize-none"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                        <div className="flex justify-between items-center">
                            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-rose-600 hover:bg-rose-50">
                                <ImageIcon className="w-4 h-4 mr-2" />
                                Photo/Video
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!content.trim() || isSubmitting}
                                className="bg-rose-500 hover:bg-rose-600 text-white"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                Share
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
