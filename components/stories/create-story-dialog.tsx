"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createStory } from "@/app/actions/stories";
import { uploadFile } from "@/app/actions/upload";
import { toast } from "sonner";
import { Loader2, Plus, Image as ImageIcon, X } from "lucide-react";

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

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const type = file.type.startsWith('video/') ? 'video' : 'image';

            setIsUploading(true);
            try {
                const formData = new FormData();
                formData.append('file', file);
                const url = await uploadFile(formData);
                setMediaUrl(url);
                setMediaType(type);
                toast.success("Media uploaded! Ready to post.");
            } catch {
                toast.error("Upload failed");
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
            toast.success("Story added to your moments!");
            setOpen(false);
            setMediaUrl(null);
            setMediaType(null);
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
                    <DialogTitle>Add to Story</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                    {!mediaUrl ? (
                        <div
                            className="w-full h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {isUploading ? (
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            ) : (
                                <>
                                    <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Click to upload photo or video</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="relative w-full h-96 bg-black rounded-xl overflow-hidden flex items-center justify-center">
                            {mediaType === 'video' ? (
                                <video src={mediaUrl} className="max-w-full max-h-full" controls />
                            ) : (
                                <img src={mediaUrl} alt="Story preview" className="max-w-full max-h-full object-contain" />
                            )}
                            <button
                                onClick={clearMedia}
                                className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-black/70"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    <input
                        type="file"
                        hidden
                        ref={fileInputRef}
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                    />

                    <div className="flex justify-end w-full gap-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!mediaUrl || isSubmitting || isUploading}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Share to Story
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
