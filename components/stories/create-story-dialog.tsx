
"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createStory } from "@/app/actions/stories";
// import { uploadFile } from "@/app/actions/upload"; // Removed - using Firebase Storage
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Image as ImageIcon, X } from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

interface CreateStoryDialogProps {
    children?: React.ReactNode;
    onOpenChange?: (open: boolean) => void;
}

export function CreateStoryDialog({ children }: CreateStoryDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { user } = useAuth();
    const router = useRouter();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) {
            toast.error("You must be logged in to add to My Life.");
            return;
        }

        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const type = file.type.startsWith('video/') ? 'video' : 'image';

            setIsUploading(true);
            try {
                // Create a unique reference
                const timestamp = Date.now();
                const storageRef = ref(storage, `users / ${user.uid} /stories/${timestamp} -${file.name} `);

                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);

                setMediaUrl(url);
                setMediaType(type);
                toast.success("Media uploaded! Ready to post.");
            } catch (error: any) {
                console.error("Upload failed", error);
                toast.error("Upload failed: " + error.message);
            } finally {
                setIsUploading(false);
            }
        }
    }

    const handleSubmit = async () => {
        if (!mediaUrl || !mediaType) return;

        setIsSubmitting(true);
        try {
            await createStory(mediaUrl, mediaType);
            toast.success("Added to your My Life!");
            setOpen(false);
            setMediaUrl(null);
            setMediaType(null);
            router.refresh();
        } catch (err) {
            toast.error("Failed to post story");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    }

    const clearMedia = () => {
        setMediaUrl(null);
        setMediaType(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" className="relative w-full h-full p-0 overflow-hidden rounded-xl">
                        <div className="absolute inset-0 bg-black/20 hover:bg-black/30 transition-colors flex items-center justify-center">
                            <Plus className="w-8 h-8 text-white" />
                        </div>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle>Add to My Life</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">

                    <div className="grid gap-4 py-4">
                        {/* Preview Area */}
                        <div className="w-full h-64 bg-black rounded-lg overflow-hidden relative flex items-center justify-center border border-border">
                            {!mediaUrl ? (
                                <div className="text-center p-4">
                                    <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Select an image or video</p>
                                </div>
                            ) : (
                                mediaType === 'video' ? (
                                    <video src={mediaUrl} className="max-w-full max-h-full" controls />
                                ) : (
                                    <img src={mediaUrl} alt="My Life preview" className="max-w-full max-h-full object-contain" />
                                )
                            )}

                            {isUploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="story-file" className="text-right">
                                Media
                            </Label>
                            <Input
                                id="story-file"
                                type="file"
                                accept="image/*,video/*"
                                className="col-span-3"
                                onChange={handleFileSelect}
                                disabled={isUploading}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleSubmit} disabled={!mediaUrl || isUploading}>
                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Share to My Life
                        </Button>
                    </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

