"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateGroupCover } from "@/app/actions/groups";
import { updateBrandingCover } from "@/app/actions/branding";

interface CoverUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: "group" | "branding";
    id: string;
    currentCoverUrl?: string | null;
    userId: string;
}

export function CoverUploadDialog({ open, onOpenChange, type, id, currentCoverUrl, userId }: CoverUploadDialogProps) {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const router = useRouter();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        try {
            const storagePath = type === "group"
                ? `groups/${id}/cover/${Date.now()}-${selectedFile.name}`
                : `branding/${id}/cover/${Date.now()}-${selectedFile.name}`;

            const storageRef = ref(storage, storagePath);
            const snapshot = await uploadBytes(storageRef, selectedFile);
            const url = await getDownloadURL(snapshot.ref);

            // Update cover using appropriate action
            if (type === "group") {
                await updateGroupCover(id, url);
            } else {
                await updateBrandingCover(id, url);
            }

            toast.success("Cover updated successfully!");
            router.refresh();
            onOpenChange(false);
            setPreviewUrl(null);
            setSelectedFile(null);
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error.message || "Failed to upload cover");
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = async () => {
        setUploading(true);
        try {
            if (type === "group") {
                await updateGroupCover(id, null);
            } else {
                await updateBrandingCover(id, null);
            }

            toast.success("Cover removed successfully!");
            router.refresh();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Remove error:", error);
            toast.error(error.message || "Failed to remove cover");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Cover Photo</DialogTitle>
                    <DialogDescription>
                        Upload a photo or video to use as your {type} cover. Recommended size: 1200x400px
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Preview */}
                    {(previewUrl || currentCoverUrl) && (
                        <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
                            {previewUrl ? (
                                selectedFile?.type.startsWith('video/') ? (
                                    <video src={previewUrl} className="w-full h-full object-cover" autoPlay loop muted />
                                ) : (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                )
                            ) : currentCoverUrl ? (
                                currentCoverUrl.includes('mp4') || currentCoverUrl.includes('webm') ? (
                                    <video src={currentCoverUrl} className="w-full h-full object-cover" autoPlay loop muted />
                                ) : (
                                    <img src={currentCoverUrl} alt="Current cover" className="w-full h-full object-cover" />
                                )
                            ) : null}

                            {previewUrl && (
                                <button
                                    onClick={() => {
                                        setPreviewUrl(null);
                                        setSelectedFile(null);
                                    }}
                                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Upload Button */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="cover-upload">
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 cursor-pointer transition-colors">
                                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    Click to upload photo or video
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    JPG, PNG, MP4, or WebM
                                </p>
                            </div>
                        </label>
                        <input
                            id="cover-upload"
                            type="file"
                            accept="image/*,video/mp4,video/webm"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        {selectedFile && (
                            <Button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="flex-1"
                            >
                                {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Upload
                            </Button>
                        )}
                        {currentCoverUrl && !selectedFile && (
                            <Button
                                onClick={handleRemove}
                                disabled={uploading}
                                variant="destructive"
                                className="flex-1"
                            >
                                {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Remove Cover
                            </Button>
                        )}
                        <Button
                            onClick={() => onOpenChange(false)}
                            variant="outline"
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
