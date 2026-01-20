"use client";

import { useState, useEffect } from "react";
import { getDeletedPosts, permanentDeletePost, restorePost } from "@/app/actions/posts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, RefreshCcw, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/components/language-context";
import { formatDistanceToNow } from "date-fns";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeletedFeed({ userId }: { userId: string }) {
    const { t } = useLanguage();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchDeleted = async () => {
        setLoading(true);
        try {
            const data = await getDeletedPosts(userId);
            setPosts(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load deleted posts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeleted();
    }, [userId]);

    const handleRestore = async (postId: string) => {
        setProcessingId(postId);
        try {
            await restorePost(postId);
            toast.success("Post restored to timeline");
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch {
            toast.error("Restore failed");
        } finally {
            setProcessingId(null);
        }
    };

    const handlePermanentDelete = async (postId: string) => {
        setProcessingId(postId);
        try {
            await permanentDeletePost(postId);
            toast.success("Post deleted permanently");
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch {
            toast.error("Delete failed");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <Trash2 className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Trash is empty</h3>
                <p className="text-slate-500 max-w-sm mt-2">Deleted posts stay here for 10 days before disappearing forever.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg flex gap-3 text-sm text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-900">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p>Items in the trash are permanently deleted after 10 days.</p>
            </div>

            <div className="grid gap-4">
                {posts.map((post) => (
                    <div key={post.id} className="bg-card border rounded-lg p-4 flex flex-col gap-3 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div className="text-sm text-muted-foreground">
                                Deleted {post.deletedAt ? formatDistanceToNow(new Date(post.deletedAt), { addSuffix: true }) : 'recently'}
                            </div>
                            {post.permanentDeleteAt && (
                                <div className="text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                                    Expires {formatDistanceToNow(new Date(post.permanentDeleteAt), { addSuffix: true })}
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-muted/50 rounded-md text-sm line-clamp-3">
                            {post.content || <span className="italic text-muted-foreground">No text content</span>}
                            {post.mediaUrls?.length > 0 && (
                                <div className="mt-2 text-xs text-blue-500 font-medium flex items-center gap-1">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    Contains {post.mediaUrls.length} attachment(s)
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 justify-end mt-2">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" disabled={!!processingId}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Forever
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This post will be immediately removed from our servers.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handlePermanentDelete(post.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            Delete Forever
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestore(post.id)}
                                disabled={!!processingId}
                            >
                                {processingId === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                                Restore
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
