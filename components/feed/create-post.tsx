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
import { ImageIcon, Loader2, Send, X, Mic, MicOff, MapPin, Link2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useLanguage } from "@/components/language-context";
import { VisibilitySelector, PrivacyType } from "./visibility-selector";
import { SubscriptionTierSelector, SubscriptionTier } from "./tier-selector";
import { useMagicAI } from "@/hooks/use-magic-ai";
import { MagicAIButton } from "@/components/magic-ai/magic-ai-button";
import { AIPreviewPanel } from "@/components/magic-ai/ai-preview-panel";
import { generateVideoThumbnail } from "@/lib/video-utils";



interface CreatePostProps {
    onClose?: () => void;
    contextType?: 'group' | 'branding';
    contextId?: string;
}

export function CreatePost({ onClose, contextType, contextId }: CreatePostProps) {
    const { user, profile } = useAuth();

    const { t } = useLanguage();
    // Admin or Verified
    const isVerified = profile?.role === 'admin' || profile?.emailVerified;

    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mediaData, setMediaData] = useState<{ type: 'photo' | 'video', url: string }[]>([]);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [privacy, setPrivacy] = useState<PrivacyType>('public');
    const [allowedViewers, setAllowedViewers] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [lastUploadError, setLastUploadError] = useState<string | null>(null);

    // Article/Link state
    const [articleMode, setArticleMode] = useState(false);
    const [articleUrl, setArticleUrl] = useState("");

    // Substack Model State
    const [postType, setPostType] = useState<'note' | 'article' | 'podcast'>('note');
    const [title, setTitle] = useState("");
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('public');

    // Location State
    const [location, setLocation] = useState<{ lat: number; lng: number; name?: string } | null>(null);

    const handleLocationClick = () => {
        // Check if allowed
        if (!user || !(user as any).allowLocationSharing) {
            toast.error("Location sharing is disabled. Enable it in Settings > Location & Privacy.");
            return;
        }

        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }

        toast.info("Getting location...");
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                // Reverse geocode optionally here, or just store coords
                // Simple reverse geocode mock or just generic name
                setLocation({
                    lat: latitude,
                    lng: longitude,
                    name: "Current Location"
                });
                toast.success("Location attached! 📍");
            },
            (err) => {
                console.error(err);
                if (err.code === 1) { // PERMISSION_DENIED
                    toast.error("Location permission denied.");
                } else {
                    toast.error("Failed to get location.");
                }
            }
        );
    };

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
        const finalContent = content.trim() + (articleUrl.trim() ? `\n\n${articleUrl.trim()}` : "");
        if (!finalContent && mediaData.length === 0) return;

        setIsSubmitting(true);
        try {
            // Pass thumbnailUrl (undefined for engagement settings to use default)
            await createPost(
                finalContent,
                mediaData,
                { privacy },
                thumbnailUrl,
                allowedViewers.length > 0 ? allowedViewers : undefined,
                location,
                postType,
                title.trim() ? title : undefined,
                audioUrl || undefined,
                subscriptionTier,
                contextType,
                contextId
            );
            setContent("");

            setMediaData([]);
            setThumbnailUrl(null);
            setLocation(null);
            setPrivacy('public');
            setAllowedViewers([]);
            setArticleMode(false);
            setArticleUrl("");
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

        if (e.target.files && e.target.files.length > 0) {
            setIsUploading(true);
            try {
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

                const newMedia: { type: 'photo' | 'video', url: string }[] = [];

                for (let i = 0; i < e.target.files.length; i++) {
                    const file = e.target.files[i];
                    const isVideo = file.type.startsWith('video/');
                    const isAudio = file.type.startsWith('audio/');

                    // --- THUMBNAIL GENERATION FOR VIDEOS ---
                    if (isVideo && !thumbnailUrl && i === 0) { // Only generate for first video arbitrarily to save time
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

                    if (isAudio) {
                        setAudioUrl(url);
                        toast.success("Podcast audio uploaded! 🎙️");
                    } else {
                        newMedia.push({ type: isVideo ? 'video' : 'photo', url });
                    }
                }

                if (newMedia.length > 0) {
                    setMediaData(prev => [...prev, ...newMedia]);
                    toast.success(newMedia.length > 1 ? "Media uploaded successfully! 📸🎥" : (newMedia[0].type === 'video' ? "Video uploaded! 🎥" : "Photo uploaded! 📸"));
                }
            } catch (error: any) {
                console.error("Upload failed", error);
                const debugObj = {
                    message: error.message || "Unknown error",
                    code: error.code || "No code",
                    name: error.name,
                    stack: error.stack
                };
                const fullError = JSON.stringify(debugObj, null, 2);
                window.alert("UPLOAD ERROR:\n" + fullError);
                setLastUploadError(fullError);
                toast.error(`Upload failed: ${error.message}`);
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
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
                        {/* Substack Type Selector */}
                        <div className="flex gap-2 text-xs font-medium">
                            <Button size="sm" variant={postType === 'note' ? 'outline' : 'ghost'} onClick={() => setPostType('note')} className="h-7 text-foreground/75">📝 Note</Button>
                            <Button size="sm" variant={postType === 'article' ? 'outline' : 'ghost'} onClick={() => setPostType('article')} className="h-7 text-foreground/75">📰 Article</Button>
                            <Button size="sm" variant={postType === 'podcast' ? 'outline' : 'ghost'} onClick={() => setPostType('podcast')} className="h-7 text-foreground/75">🎙️ Podcast</Button>
                        </div>

                        {/* Substack Title Input */}
                        {(postType === 'article' || postType === 'podcast') && (
                            <input
                                type="text"
                                placeholder="Add a title..."
                                className="w-full bg-gray-100 dark:bg-black p-2 rounded-xl text-sm font-bold border-none focus:ring-0"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        )}

                        <Textarea
                            disabled={!isVerified}
                            placeholder={!isVerified ? t("create.verify.required") : (isListening ? (t("feed.listening") || "Listening...") : (t("feed.placeholder") + " 🎙️"))}
                            className="min-h-[80px] bg-gray-100 dark:bg-black hover:bg-gray-200 dark:hover:bg-zinc-900 focus:bg-white dark:focus:bg-card border-none rounded-xl resize-none text-[15px] placeholder:text-gray-500 pr-10 disabled:opacity-60 disabled:cursor-not-allowed"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />

                        {!isVerified && (
                            <div className="mt-2 ml-1 text-sm text-amber-600 dark:text-amber-500 flex flex-wrap items-center gap-2">
                                <span>{t("create.verify.required")}</span>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const { getAuth, sendEmailVerification } = await import("firebase/auth");
                                            const auth = getAuth();
                                            if (auth.currentUser) {
                                                await sendEmailVerification(auth.currentUser);
                                                toast.success(t("create.verify.sent"));
                                            }
                                        } catch (e: any) {
                                            console.error("Verification send error:", e);
                                            toast.error(e.code === 'auth/too-many-requests' ? "Please wait a moment before trying again." : "Failed to send email.");
                                        }
                                    }}
                                    className="font-medium underline hover:text-amber-700 dark:hover:text-amber-400"
                                >
                                    {t("create.verify.resend")}
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

                        {mediaData.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {mediaData.map((media, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-border/50 shadow-sm">
                                        {media.type === 'video' ? (
                                            <div className="w-full h-full bg-black flex items-center justify-center relative">
                                                <video src={`${media.url}#t=0.001`} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                                                    <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                                                        <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent ml-1" />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <img src={media.url} alt="Preview" className="w-full h-full object-cover transition-transform hover:scale-105" />
                                        )}
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <button
                                            onClick={() => setMediaData(items => items.filter((_, i) => i !== idx))}
                                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {isUploading && (
                                    <div className="flex flex-col items-center justify-center p-4 aspect-square rounded-xl border-2 border-dashed border-primary/20 bg-primary/5">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                                        <span className="text-xs text-primary font-medium">Uploading...</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {articleMode && (
                            <div className="mb-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <input
                                    type="url"
                                    placeholder="Paste article or web link here..."
                                    className="w-full bg-gray-100/80 dark:bg-zinc-900/50 p-3 flex rounded-xl text-sm border border-border/50 focus:ring-1 focus:ring-primary/50 transition-all text-foreground"
                                    value={articleUrl}
                                    onChange={(e) => setArticleUrl(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="flex flex-col-reverse gap-3 pt-2 border-t border-gray-100 md:flex-row md:justify-between md:items-center">
                            <div className="flex gap-2 w-full justify-between md:justify-start md:w-auto">
                                <input
                                    type="file"
                                    hidden
                                    multiple
                                    ref={fileInputRef}
                                    accept="image/*,video/*,audio/*"
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
                                    <span className="text-[15px] font-semibold text-foreground">{t("create.photo_video")}</span>
                                </Button>
                                {/* Share Link Button */}
                                <Button
                                    variant={articleMode ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setArticleMode(!articleMode)}
                                    disabled={isUploading || !isVerified}
                                    className={articleMode ? "text-primary bg-primary/10 gap-2 flex-1 md:flex-none" : "text-muted-foreground hover:text-foreground gap-2 flex-1 md:flex-none"}
                                    type="button"
                                >
                                    <Link2 className="w-5 h-5" />
                                    <span className="text-[15px] font-semibold">Share Link</span>
                                </Button>
                                {/* Location Button */}
                                <Button
                                    variant={location ? "secondary" : "ghost"}
                                    size="icon"
                                    className={location ? "text-blue-500 bg-blue-50" : ""}
                                    onClick={handleLocationClick}
                                    title={location ? "Location attached" : "Drop location"}
                                    type="button"
                                >
                                    <MapPin className="w-5 h-5" />
                                </Button>
                                {location && (
                                    <span className="hidden md:inline-block text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full truncate max-w-[150px]">
                                        📍 {location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                                        <button onClick={() => setLocation(null)} className="ml-2 hover:text-red-500">×</button>
                                    </span>
                                )}

                                <MagicAIButton
                                    onClick={handleOpenMagicAI}
                                    disabled={!content.trim() || !isVerified}
                                    isGenerating={magicAI.isGenerating}
                                />
                            </div>

                            <div className="flex gap-2">
                                <SubscriptionTierSelector
                                    value={subscriptionTier}
                                    onChange={setSubscriptionTier}
                                />
                                <VisibilitySelector
                                    value={privacy}
                                    onChange={setPrivacy}
                                    allowedViewerIds={allowedViewers}
                                    onAllowedViewersChange={setAllowedViewers}
                                />
                            </div>
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
                                disabled={(!content.trim() && mediaData.length === 0) || isSubmitting || isUploading || !isVerified}
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


