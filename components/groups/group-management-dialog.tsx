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
import { updateGroupDetails, softDeleteGroup } from "@/app/actions/groups";
import { CoverUploadDialog } from "@/components/shared/cover-upload-dialog";

interface GroupManagementDialogProps {
    group: {
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

export function GroupManagementDialog({ group, currentUser, isAdmin }: GroupManagementDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.description);

    // Cover Upload State
    const [coverDialogOpen, setCoverDialogOpen] = useState(false);

    const handleUpdate = async () => {
        setIsLoading(true);
        try {
            await updateGroupDetails(group.id, { name, description });
            toast.success("Group updated successfully");
            setOpen(false);
            router.refresh(); // Refresh to show new details
        } catch (error: any) {
            toast.error(error.message || "Failed to update group");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            await softDeleteGroup(group.id);
            toast.success("Group deleted. It will be permanently removed in 30 days.");
            setOpen(false);
            router.push('/groups'); // Redirect to groups list
        } catch (error: any) {
            toast.error(error.message || "Failed to delete group");
            setIsLoading(false);
        }
    };

    const isFounder = group.founderId === currentUser.id;

    // Only admins/founder can see this
    if (!isAdmin && !isFounder) return null;

    return (
        <>
            <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title="Group Settings">
                <Settings className="h-5 w-5" />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Manage Group</DialogTitle>
                        <DialogDescription>
                            Update group details or manage settings.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Group Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Group Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your group..."
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="pt-4 border-t">
                                <Label className="mb-2 block">Cover Photo/Video</Label>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-32 h-20 bg-muted rounded overflow-hidden">
                                        {group.coverUrl ? (
                                            <img src={group.coverUrl} className="w-full h-full object-cover" />
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
                                        <h4 className="font-semibold text-destructive">Delete Group</h4>
                                        <p className="text-sm text-destructive/90 mt-1">
                                            This action will hide the group immediately. You will have 30 days to restore it before it is permanently deleted along with all posts and members.
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
                                            {isLoading ? "Deleting..." : "Delete Group"}
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground mt-4 italic">
                                        Only the group founder can delete this group.
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
                type="group"
                id={group.id}
                currentCoverUrl={group.coverUrl}
                userId={currentUser.id}
            />
        </>
    );
}
