"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Eye } from "lucide-react";
import { toast } from "sonner";
import { deletePost } from "@/app/actions/posts";
import Link from "next/link";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface GalleryItemType {
    url: string;
    postId: string;
    authorId: string;
}

interface GalleryGridProps {
    items: GalleryItemType[];
    currentUserId: string;
}

export function GalleryGrid({ items, currentUserId }: GalleryGridProps) {
    const [itemList, setItemList] = useState(items);
    const [isDeleting, setIsDeleting] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const handleDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            await deletePost(itemToDelete);
            setItemList(prev => prev.filter(i => i.postId !== itemToDelete));
            toast.success("Photo deleted (Post removed)");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete photo");
        } finally {
            setIsDeleting(false);
            setItemToDelete(null);
        }
    };

    if (itemList.length === 0) {
        return <p className="text-center text-gray-500 py-10">No photos shared yet.</p>;
    }

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {itemList.map((item, idx) => {
                    const isOwner = item.authorId === currentUserId;

                    return (
                        <div key={`${item.postId}-${idx}`} className="aspect-square rounded-lg overflow-hidden relative group bg-gray-100 dark:bg-muted">
                            <img
                                src={item.url}
                                alt="Gallery item"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />

                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                {/* View Link */}
                                <Link href={`/u/${item.authorId}#post-${item.postId}`}>
                                    <Button size="icon" variant="secondary" className="rounded-full w-10 h-10 bg-white/90 hover:bg-white text-black">
                                        <Eye className="w-5 h-5" />
                                    </Button>
                                </Link>

                                {/* Delete Button (Owner Only) */}
                                {isOwner && (
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="rounded-full w-10 h-10 shadow-lg"
                                        onClick={() => setItemToDelete(item.postId)}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <span className="text-sm font-medium">Warning: This will delete the entire post associated with this photo.</span>
                            </div>
                            <p>This action cannot be undone.</p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDelete(); }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete Photo & Post"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
