"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createBrandingPost } from "@/app/actions/branding"
import { toast } from "sonner"
import { Image as ImageIcon, Send, Loader2 } from "lucide-react"

interface BrandingPostCreatorProps {
    brandingId: string;
    branding: { name: string; imageUrl?: string };
}

export function BrandingPostCreator({ brandingId, branding }: BrandingPostCreatorProps) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handlePost() {
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            await createBrandingPost(brandingId, content);
            setContent("");
            toast.success("Posted to branding!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to post");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex gap-4">
                    <Avatar>
                        <AvatarImage src={branding.imageUrl || ""} />
                        <AvatarFallback>{branding.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                        <div className="relative">
                            <Input
                                placeholder={`Post as ${branding.name}...`}
                                className="bg-muted/50 border-0 focus-visible:ring-1"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePost()}
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                <ImageIcon className="w-4 h-4 mr-2" />
                                Photo (Coming Soon)
                            </Button>
                            <Button
                                size="sm"
                                onClick={handlePost}
                                disabled={!content.trim() || isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                Post
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
