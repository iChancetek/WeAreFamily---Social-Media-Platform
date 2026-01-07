"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createGroupPost } from "@/app/actions/groups"
import { toast } from "sonner"
import { Image as ImageIcon, Send, Loader2, X, Video, Mic, MicOff, Sparkles } from "lucide-react"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { chatWithAgent } from "@/app/actions/ai-agents"

interface GroupPostCreatorProps {
    groupId: string;
    user: { displayName?: string | null; imageUrl?: string | null };
}

export function GroupPostCreator({ groupId, user }: GroupPostCreatorProps) {
    const router = useRouter();
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { isListening, startListening, stopListening, isSupported: isSpeechSupported } = useSpeechRecognition({
        onResult: (result) => setContent(prev => prev ? prev + " " + result : result)
    });

    const handleMagic = async () => {
        if (!content.trim()) {
            toast.error("Please type a topic first!");
            return;
        }

        setIsGenerating(true);
        try {
            const magicText = await chatWithAgent(
                `Write a warm, engaging group post about: "${content}". Use emojis. Keep it under 280 chars.`,
                'general'
            );
            setContent(magicText || content);
            toast.success("Magic applied! ✨");
        } catch {
            toast.error("Magic failed. Try again!");
        } finally {
            setIsGenerating(false);
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                // Determine path based on file type or context
                // For simplified group uploads: groups/{groupId}/posts/{timestamp}-{filename}
                const timestamp = Date.now();
                const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

                // IMPORTANT: Ensure this path is writable by the user in Storage Rules
                // Usually rules allow write if request.auth != null
                const storageRef = ref(storage, `groups/${groupId}/posts/${filename}`);

                // Direct upload
                const snapshot = await uploadBytes(storageRef, file);
                const url = await getDownloadURL(snapshot.ref);

                setMediaUrls(prev => [...prev, url]);
                toast.success("File uploaded");
            } catch (error: any) {
                console.error("Error uploading file:", error);
                toast.error(`Failed to upload: ${error.message}`);
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
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
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to post");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="mb-6 border-none glass-card rounded-lg">
            <CardContent className="p-4">
                <div className="flex gap-3">
                    <Avatar className="w-10 h-10 border border-gray-200">
                        <AvatarImage src={user.imageUrl || ""} />
                        <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                        <div className="relative">
                            <Textarea
                                placeholder={isListening ? "Listening..." : "Write something to the group..."}
                                className="min-h-[80px] bg-muted/50 border-0 focus-visible:ring-1 rounded-xl resize-none text-[15px] pr-12"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePost()}
                            />
                            {isSpeechSupported && (
                                <div className="absolute right-3 top-3">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={isListening ? stopListening : startListening}
                                        className={isListening ? "text-red-500 hover:bg-red-50 animate-pulse" : "text-gray-400 hover:text-gray-600"}
                                    >
                                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Media Previews */}
                        {mediaUrls.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto py-2">
                                {mediaUrls.map((url, index) => (
                                    <div key={index} className="relative group flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-border">
                                        {url.includes('.mp4') || url.includes('.webm') ? (
                                            <div className="w-full h-full bg-black flex items-center justify-center">
                                                <Video className="w-8 h-8 text-white/70" />
                                            </div>
                                        ) : (
                                            <img
                                                src={url}
                                                alt="Uploaded content"
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        <button
                                            onClick={() => removeMedia(index)}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-border">
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
                                    className="text-muted-foreground hover:text-primary gap-2"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ImageIcon className="w-5 h-5" />
                                    )}
                                    <span className="hidden sm:inline">Photo/Video</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleMagic}
                                    disabled={isGenerating}
                                    className="text-indigo-600 hover:bg-indigo-50 gap-2 border border-indigo-200 bg-indigo-50/50"
                                >
                                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <Sparkles className="w-4 h-4 text-indigo-600" />}
                                    <span className="hidden sm:inline font-medium">Magic AI</span>
                                </Button>
                            </div>
                            <Button
                                size="sm"
                                onClick={handlePost}
                                disabled={(!content.trim() && mediaUrls.length === 0) || isSubmitting || isUploading}
                                className="bg-primary text-primary-foreground font-semibold px-6"
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
