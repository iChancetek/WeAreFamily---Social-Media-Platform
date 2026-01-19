'use client'

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "@/app/actions/posts";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { ImageIcon, Loader2, Send, X, Mic, MicOff } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useLanguage } from "@/components/language-context";
import { VisibilitySelector, PrivacyType } from "./visibility-selector";
import { useMagicAI } from "@/hooks/use-magic-ai";
import { MagicAIButton } from "@/components/magic-ai/magic-ai-button";
import { AIPreviewPanel } from "@/components/magic-ai/ai-preview-panel";



interface CreatePostProps {
    onClose?: () => void;
}

export function CreatePost({ onClose }: CreatePostProps) {
    const { user, profile } = useAuth();
    const { t } = useLanguage();
    // Admin or Verified
    const isVerified = profile?.role === 'admin' || profile?.emailVerified;

    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [privacy, setPrivacy] = useState<PrivacyType>('public');
    const [allowedViewers, setAllowedViewers] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [lastUploadError, setLastUploadError] = useState<string | null>(null);

    // Magic AI Integration
    const magicAI = useMagicAI({ context: { type: 'timeline' } });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { isListening, startListening, stopListening, isSupported: isSpeechSupported } = useSpeechRecognition({
        onResult: (result) => setContent(prev => {
            if (!prev) return result;
            return prev + " " + result;
        })
    });

    const handleSubmit = async () => {
        if (!content.trim() && mediaUrls.length === 0) return;

        setIsSubmitting(true);
        try {
            // Pass thumbnailUrl (undefined for engagement settings to use default)
            // Pass thumbnailUrl and engagement settings
            await createPost(
                content,
                mediaUrls,
                { privacy },
                thumbnailUrl,
                allowedViewers.length > 0 ? allowedViewers : undefined
            );
            setContent("");
            setMediaUrls([]);
            setThumbnailUrl(null);
            setPrivacy('public');
            setAllowedViewers([]);
            toast.success("Moment shared successfully! ❤️");

            // If we have an onClose handler (e.g. valid submission in modal mode), close it
            if (onClose) onClose();

            window.location.reload();
        } catch (err: any) {
            console.error("Post creation error:", err);
            toast.error(err.message || "Failed to share moment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    // Magic AI handlers
    const handleOpenMagicAI = () => {
        magicAI.openMagic(content);
    };

    const handleAcceptMagic = () => {
        const enhancedContent = magicAI.acceptEnhanced();
        if (enhancedContent) {
            setContent(enhancedContent);
        }
    };

    const handleRevertMagic = () => {
        const originalContent = magicAI.revertToOriginal();
        setContent(originalContent);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setLastUploadError(null);
        if (!user) {
            toast.error("Please log in to share a moment.");
            return;
        }

        if (e.target.files && e.target.files[0]) {
            setIsUploading(true);
            try {
                const file = e.target.files[0];

                const { getAuth } = await import("firebase/auth");
                const auth = getAuth();
                if (!auth.currentUser) {
                    const msg = "Firebase SDK not authenticated. Storage rules will reject.";
                    console.error(msg);
                    setLastUploadError(msg);
                    toast.error("Authentication broken. Refresh page.");
                    return;
                }

                const userId = user.uid || (user as any).id;
                if (!userId) throw new Error("User ID is missing.");

                // --- THUMBNAIL GENERATION FOR VIDEOS ---
                if (file.type.startsWith('video/')) {
                    try {
                        console.log("Generating video thumbnail...");
                        const thumbBlob = await generateVideoThumbnail(file);
                        if (thumbBlob) {
                            const thumbRef = ref(storage, `users/${userId}/thumbnails/${Date.now()}_thumb.jpg`);
                            await uploadBytes(thumbRef, thumbBlob);
                            const tUrl = await getDownloadURL(thumbRef);
                            setThumbnailUrl(tUrl);
                            console.log("Thumbnail generated & uploaded:", tUrl);
                        }
                    } catch (err) {
                        console.error("Thumbnail generation failed (non-blocking):", err);
                    }
                }
                // ---------------------------------------

                const storageRef = ref(storage, `users/${userId}/posts/${Date.now()}-${file.name}`);
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
                // ... error handling ...
                const debugObj = {
                    message: error.message || "Unknown error",
                    code: error.code || "No code",
                    name: error.name,
                    stack: error.stack
                };
                const fullError = JSON.stringify(debugObj, null, 2);
                window.alert("UPLOAD ERROR:\n" + fullError);
                setLastUploadError(fullError);
                setLastUploadError(fullError);
                toast.error(`Upload failed: ${error.message}`);
            } finally {
                setIsUploading(false);
            }
        }
    }

    return (
        <Card className="mb-6 border-none glass-card rounded-lg relative group">
            {/* Close Button for Toggle Mode */}
            {onClose && (
                <div className="absolute top-2 right-2 z-10">
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full opacity-50 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-white/10" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}
            <CardContent className="p-4">
                <div className="flex gap-3">
                    <Avatar className="w-10 h-10 border border-gray-200">
                        <AvatarImage src={user?.photoURL || undefined} />
                        <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">

                        <Textarea
                            disabled={!isVerified}
                            placeholder={!isVerified ? "Please verify your email to share a moment." : (isListening ? (t("feed.listening") || "Listening...") : (t("feed.placeholder") + " 🎙️"))}
                            className="min-h-[80px] bg-gray-100 dark:bg-black hover:bg-gray-200 dark:hover:bg-zinc-900 focus:bg-white dark:focus:bg-card border-none rounded-xl resize-none text-[15px] placeholder:text-gray-500 pr-10 disabled:opacity-60 disabled:cursor-not-allowed"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />

                        {!isVerified && (
                            <div className="mt-2 ml-1 text-sm text-amber-600 dark:text-amber-500 flex flex-wrap items-center gap-2">
                                <span>Verification required to post.</span>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const { getAuth, sendEmailVerification } = await import("firebase/auth");
                                            const auth = getAuth();
                                            if (auth.currentUser) {
                                                await sendEmailVerification(auth.currentUser);
                                                toast.success("Verification email sent! Check your inbox.");
                                            }
                                        } catch (e: any) {
                                            console.error("Verification send error:", e);
                                            toast.error(e.code === 'auth/too-many-requests' ? "Please wait a moment before trying again." : "Failed to send email.");
                                        }
                                    }}
                                    className="font-medium underline hover:text-amber-700 dark:hover:text-amber-400"
                                >
                                    Resend Verification Email
                                </button>
                            </div>
                        )}

                        {isSpeechSupported && isVerified && (
                            <div className="absolute right-6 top-6">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={isListening ? stopListening : startListening}
                                    disabled={isUploading || isSubmitting}
                                    className={isListening ? "text-red-500 hover:bg-red-50 animate-pulse" : "text-gray-400 hover:text-gray-600"}
                                >
                                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </Button>
                            </div>
                        )}

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

                        <div className="flex flex-col-reverse gap-3 pt-2 border-t border-gray-100 md:flex-row md:justify-between md:items-center">
                            <div className="flex gap-2 w-full justify-between md:justify-start md:w-auto">
                                <input
                                    type="file"
                                    hidden
                                    ref={fileInputRef}
                                    accept="image/*,video/*"
                                    onChange={handleFileSelect}
                                    disabled={!isVerified}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading || !isVerified}
                                    className="gap-2 flex-1 md:flex-none text-muted-foreground hover:text-foreground"
                                >
                                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <ImageIcon className="w-6 h-6 text-primary" />}
                                    <span className="text-[15px] font-semibold text-foreground">Photo/Video</span>
                                </Button>
                                <MagicAIButton
                                    onClick={handleOpenMagicAI}
                                    disabled={!content.trim() || !isVerified}
                                    isGenerating={magicAI.isGenerating}
                                />
                            </div>

                            <VisibilitySelector
                                value={privacy}
                                onChange={setPrivacy}
                                allowedViewerIds={allowedViewers}
                                onAllowedViewersChange={setAllowedViewers}
                            />
                        </div>

                        <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end md:items-center">
                            {lastUploadError && (
                                <div className="text-red-500 text-xs mt-2 bg-red-50 p-2 rounded break-all whitespace-pre-wrap">
                                    <p className="font-bold">DEBUG INFO:</p>
                                    <p>Bucket: {storage.app.options.storageBucket}</p>
                                    <p>Error: {lastUploadError}</p>
                                </div>
                            )}

                            <Button
                                onClick={handleSubmit}
                                disabled={(!content.trim() && mediaUrls.length === 0) || isSubmitting || isUploading || !isVerified}
                                className="bg-primary hover:bg-primary/90 text-white font-semibold w-full md:w-auto px-8"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                {t("btn.post")}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Magic AI Preview Panel */}
                <AIPreviewPanel
                    isOpen={magicAI.isPreviewOpen}
                    onClose={magicAI.closePreview}
                    originalContent={magicAI.originalContent}
                    enhancedContent={magicAI.enhancedContent}
                    selectedTone={magicAI.selectedTone}
                    isGenerating={magicAI.isGenerating}
                    onSelectTone={magicAI.generatePreview}
                    onAccept={handleAcceptMagic}
                    onRevert={handleRevertMagic}
                />
            </CardContent>
        </Card>
    );
}

// Helper: Generate video thumbnail from file
const generateVideoThumbnail = (file: File): Promise<Blob | null> => {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.playsInline = true;
        video.currentTime = 1; // Capture at 1s

        video.onloadeddata = () => {
            // 
        };

        video.onseeked = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(video, 0, 0);
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(video.src);
                    resolve(blob);
                }, 'image/jpeg', 0.8);
            } catch (e) {
                console.error("Canvas draw failed", e);
                resolve(null);
            }
        };

        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            resolve(null);
        };
    });
}
