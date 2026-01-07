"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Image as ImageIcon, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateBrandingDetails, softDeleteBranding } from "@/app/actions/branding";
import { CoverUploadDialog } from "@/components/shared/cover-upload-dialog";

interface BrandingManagementDialogProps {
    branding: {
        id: string;
        name: string;
        description: string;
        coverUrl?: string;
        founderId: string;
    };
    currentUser: {
        id: string;
    };
    isAdmin: boolean;
}

export function BrandingManagementDialog({ branding, currentUser, isAdmin }: BrandingManagementDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [name, setName] = useState(branding.name);
    const [description, setDescription] = useState(branding.description);

    // Cover Upload State
    const [coverDialogOpen, setCoverDialogOpen] = useState(false);

    const handleUpdate = async () => {
        setIsLoading(true);
        try {
            await updateBrandingDetails(branding.id, { name, description });
            toast.success("Page details updated successfully");
            setOpen(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to update page");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            await softDeleteBranding(branding.id);
            toast.success("Page deleted. It will be permanently removed in 30 days.");
            setOpen(false);
            router.push('/branding');
        } catch (error: any) {
            toast.error(error.message || "Failed to delete page");
            setIsLoading(false);
        }
    };

    const isFounder = branding.founderId === currentUser.id;

    // Only admins/founder can see this
    if (!isAdmin && !isFounder) return null;

    return (
        <>
            <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title="Page Settings">
                <Settings className="h-5 w-5" />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Manage Page</DialogTitle>
                        <DialogDescription>
                            Update page details or manage settings.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Page Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Page Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your page..."
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="pt-4 border-t">
                                <Label className="mb-2 block">Cover Photo/Video</Label>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-32 h-20 bg-muted rounded overflow-hidden">
                                        {branding.coverUrl ? (
                                            <img src={branding.coverUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                                                <ImageIcon className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <Button variant="outline" onClick={() => setCoverDialogOpen(true)}>
                                        Change Cover
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={handleUpdate} disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="danger" className="space-y-4 py-4">
                            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
                                <div className="flex items-start gap-4">
                                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-destructive">Delete Page</h4>
                                        <p className="text-sm text-destructive/90 mt-1">
                                            This action will hide the page immediately. You will have 30 days to restore it before it is permanently deleted along with all posts and followers.
                                        </p>
                                    </div>
                                </div>

                                {isFounder ? (
                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            variant="destructive"
                                            onClick={handleDelete}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? "Deleting..." : "Delete Page"}
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground mt-4 italic">
                                        Only the page founder can delete this page.
                                    </p>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            <CoverUploadDialog
                open={coverDialogOpen}
                onOpenChange={setCoverDialogOpen}
                type="branding"
                id={branding.id}
                currentCoverUrl={branding.coverUrl}
                userId={currentUser.id}
            />
        </>
    );
}
