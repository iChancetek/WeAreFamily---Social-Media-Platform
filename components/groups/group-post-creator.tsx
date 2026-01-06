"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { User } from "firebase/auth" // Or your user type
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createGroupPost } from "@/app/actions/groups"
import { toast } from "sonner"
import { Image as ImageIcon, Send, Loader2, X, Video } from "lucide-react"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

interface GroupPostCreatorProps {
    groupId: string;
    user: { displayName?: string | null; imageUrl?: string | null };
}

export function GroupPostCreator({ groupId, user }: GroupPostCreatorProps) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                // Create a reference to the file in firebase storage
                const timestamp = Date.now();
                const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const storageRef = ref(storage, `groups/${groupId}/posts/${filename}`);

                // Upload the file
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);

                setMediaUrls(prev => [...prev, url]);
                toast.success("File uploaded");
            } catch (error) {
                console.error("Error uploading file:", error);
                toast.error("Failed to upload file");
            } finally {
                setIsUploading(false);
                // Reset input
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        }
    };

    const removeMedia = (index: number) => {
        setMediaUrls(prev => prev.filter((_, i) => i !== index));
    };

    async function handlePost() {
        if (!content.trim() && mediaUrls.length === 0) return;

        setIsSubmitting(true);
        try {
            await createGroupPost(groupId, content, mediaUrls);
            setContent("");
            setMediaUrls([]);
            toast.success("Posted to group!");
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
                        <AvatarImage src={user.imageUrl || ""} />
                        <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                        <div className="relative">
                            <Input
                                placeholder="Write something to the group..."
                                className="bg-muted/50 border-0 focus-visible:ring-1"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePost()}
                            />
                        </div>

                        {/* Media Previews */}
                        {mediaUrls.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto py-2">
                                {mediaUrls.map((url, index) => (
                                    <div key={index} className="relative group flex-shrink-0">
                                        {/* Simple check for video extensions */}
                                        {url.includes('.mp4') || url.includes('.webm') ? (
                                            <div className="w-24 h-24 bg-black rounded-lg flex items-center justify-center border border-border">
                                                <Video className="w-8 h-8 text-white/70" />
                                            </div>
                                        ) : (
                                            <img
                                                src={url}
                                                alt="Uploaded content"
                                                className="w-24 h-24 object-cover rounded-lg border border-border"
                                            />
                                        )}
                                        <button
                                            onClick={() => removeMedia(index)}
                                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*,video/*"
                                    onChange={handleFileSelect}
                                    disabled={isUploading}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-primary"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <ImageIcon className="w-4 h-4 mr-2" />
                                    )}
                                    {isUploading ? "Uploading..." : "Photo/Video"}
                                </Button>
                            </div>
                            <Button
                                size="sm"
                                onClick={handlePost}
                                disabled={(!content.trim() && mediaUrls.length === 0) || isSubmitting || isUploading}
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
