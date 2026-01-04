'use client'

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "@/app/actions/posts";
import { generatePostContent } from "@/app/actions/ai";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { ImageIcon, Loader2, Send, Sparkles, X } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-context";



export function CreatePost() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [lastUploadError, setLastUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async () => {
        if (!content.trim() && mediaUrls.length === 0) return;

        setIsSubmitting(true);
        try {
            await createPost(content, mediaUrls);
            setContent("");
            setMediaUrls([]);
            toast.success("Moment shared successfully! ❤️");

            // Refresh the page to show the new post
            window.location.reload();
        } catch (err: any) {
            console.error("Post creation error:", err);
            toast.error(err.message || "Failed to share moment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleMagic = async () => {
        if (!content.trim()) {
            toast.error("Please type a topic first!");
            return;
        }

        setIsGenerating(true);
        try {
            const magicText = await generatePostContent(content);
            setContent(magicText);
            toast.success("Magic applied! ✨");
        } catch {
            toast.error("Magic failed. Try again!");
        } finally {
            setIsGenerating(false);
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setLastUploadError(null);
        // 1. Initial UI check
        if (!user) {
            toast.error("Please log in to share a moment.");
            return;
        }

        if (e.target.files && e.target.files[0]) {
            setIsUploading(true);
            try {
                const file = e.target.files[0];

                // 2. Strict SDK Auth Check (Fixes "User does not have permission")
                const { getAuth } = await import("firebase/auth");
                const auth = getAuth();
                // Ensure we have a valid firebase user token before attempting upload
                if (!auth.currentUser) {
                    const msg = "Firebase SDK not authenticated. Storage rules will reject.";
                    console.error(msg);
                    setLastUploadError(msg);
                    toast.error("Authentication broken. Refresh page.");
                    return;
                }

                const userId = user.uid || (user as any).id;
                if (!userId) {
                    throw new Error("User ID is missing. Cannot upload.");
                }
                console.log("DEBUG: Uploading as User:", userId);

                // Switch to 'users' path which we KNOW works for profile pictures
                // Path: users/{userId}/posts/{timestamp}-{filename}
                const storageRef = ref(storage, `users/${userId}/posts/${Date.now()}-${file.name}`);

                // Explicitly set content type to ensure correct playback/serving
                const metadata = {
                    contentType: file.type || 'application/octet-stream',
                    customMetadata: {
                        originalName: file.name,
                        uploadedBy: userId
                    }
                };

                const snapshot = await uploadBytes(storageRef, file, metadata);
                const url = await getDownloadURL(snapshot.ref);

                setMediaUrls(prev => [...prev, url]);
                toast.success("Photo uploaded! 📸");
            } catch (error: any) {
                console.error("Upload failed", error);

                // robust error extraction
                const debugObj = {
                    message: error.message || "Unknown error",
                    code: error.code || "No code",
                    name: error.name,
                    stack: error.stack
                };

                const fullError = JSON.stringify(debugObj, null, 2);
                window.alert("UPLOAD ERROR:\n" + fullError); // FORCE ALERT TO USER
                setLastUploadError(fullError);

                // Detailed error messaging
                if (error.code === 'storage/unauthorized') {
                    toast.error("Permission denied. rules rejected.");
                } else if (error.code === 'storage/canceled') {
                    toast.error("Upload canceled.");
                } else {
                    toast.error(`Upload failed: ${debugObj.message}`);
                }
            } finally {
                setIsUploading(false);
            }
        }
    }

    return (
        <Card className="mb-6 border-none glass-card rounded-lg">
            <CardContent className="p-4">
                <div className="flex gap-3">
                    <Avatar className="w-10 h-10 border border-gray-200">
                        <AvatarImage src={user?.photoURL || undefined} />
                        <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">

                        <Textarea
                            placeholder={t("feed.placeholder")}
                            className="min-h-[80px] bg-gray-100 dark:bg-black hover:bg-gray-200 dark:hover:bg-zinc-900 focus:bg-white dark:focus:bg-card border-none rounded-xl resize-none text-[15px] placeholder:text-gray-500"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />

                        {mediaUrls.length > 0 && (
                            <div className="flex gap-2 mb-2 overflow-x-auto">
                                {mediaUrls.map((url, idx) => (
                                    <div key={idx} className="relative w-20 h-20 rounded-md overflow-hidden group">
                                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setMediaUrls(urls => urls.filter((_, i) => i !== idx))}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    hidden
                                    ref={fileInputRef}
                                    accept="image/*,video/*"
                                    onChange={handleFileSelect}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="text-gray-600 hover:bg-gray-100 gap-2"
                                >
                                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <ImageIcon className="w-6 h-6 text-primary" />}
                                    <span className="text-[15px] font-semibold text-gray-600">Photo/Video</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleMagic}
                                    disabled={isGenerating}
                                    className="text-gray-600 hover:bg-gray-100 gap-2"
                                >
                                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Sparkles className="w-6 h-6 text-primary" />}
                                    <span className="text-[15px] font-semibold text-gray-600">Magic AI</span>
                                </Button>
                            </div>

                            {lastUploadError && (
                                <div className="text-red-500 text-xs mt-2 bg-red-50 p-2 rounded break-all whitespace-pre-wrap">
                                    <p className="font-bold">DEBUG INFO:</p>
                                    <p>Bucket: {storage.app.options.storageBucket}</p>
                                    <p>Error: {lastUploadError}</p>
                                </div>
                            )}

                            <Button
                                onClick={handleSubmit}
                                disabled={(!content.trim() && mediaUrls.length === 0) || isSubmitting || isUploading}
                                className="bg-primary hover:bg-primary/90 text-white font-semibold px-8"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                {t("btn.post")}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
