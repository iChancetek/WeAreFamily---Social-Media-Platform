'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { updatePostEngagementSettings } from '@/app/actions/posts';
import { Globe, Users, Lock } from 'lucide-react';

interface EngagementSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    postId: string;
    currentSettings?: {
        allowLikes?: boolean;
        allowComments?: boolean;
        privacy?: 'public' | 'friends' | 'private';
    };
    contextType?: string;
    contextId?: string;
}

export function EngagementSettingsDialog({
    open,
    onOpenChange,
    postId,
    currentSettings = {},
    contextType,
    contextId,
}: EngagementSettingsDialogProps) {
    const [allowLikes, setAllowLikes] = useState(currentSettings.allowLikes ?? true);
    const [allowComments, setAllowComments] = useState(currentSettings.allowComments ?? true);
    const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>(
        currentSettings.privacy ?? 'friends'
    );
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updatePostEngagementSettings(
                postId,
                { allowLikes, allowComments, privacy },
                contextType,
                contextId
            );
            toast.success('Settings updated');
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Post Settings</DialogTitle>
                    <DialogDescription>
                        Control who can see and engage with your post
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Privacy Setting */}
                    <div className="space-y-2">
                        <Label htmlFor="privacy">Who can see this post?</Label>
                        <Select value={privacy} onValueChange={(val: any) => setPrivacy(val)}>
                            <SelectTrigger id="privacy">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="public">
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4" />
                                        <div>
                                            <div className="font-medium">Public</div>
                                            <div className="text-xs text-muted-foreground">Anyone can view</div>
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="friends">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        <div>
                                            <div className="font-medium">Friends Only</div>
                                            <div className="text-xs text-muted-foreground">Only connected friends</div>
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="private">
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        <div>
                                            <div className="font-medium">Private</div>
                                            <div className="text-xs text-muted-foreground">Only you can see</div>
                                        </div>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Allow Likes */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="allow-likes">Allow Likes</Label>
                            <p className="text-xs text-muted-foreground">
                                Let friends react to your post
                            </p>
                        </div>
                        <Switch
                            id="allow-likes"
                            checked={allowLikes}
                            onCheckedChange={setAllowLikes}
                        />
                    </div>

                    {/* Allow Comments */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="allow-comments">Allow Comments</Label>
                            <p className="text-xs text-muted-foreground">
                                Let friends comment and reply
                            </p>
                        </div>
                        <Switch
                            id="allow-comments"
                            checked={allowComments}
                            onCheckedChange={setAllowComments}
                        />
                    </div>

                    {/* Preview */}
                    <div className="border border-border rounded-lg p-3 bg-muted/20">
                        <p className="text-xs font-medium mb-2">Who can engage:</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${privacy === 'public' ? 'bg-green-500' : privacy === 'friends' ? 'bg-blue-500' : 'bg-gray-500'}`} />
                                {privacy === 'public' ? 'Anyone can view' : privacy === 'friends' ? 'Friends can view' : 'Only you can view'}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${allowLikes && privacy !== 'private' ? 'bg-green-500' : 'bg-gray-500'}`} />
                                {allowLikes && privacy !== 'private' ? 'Friends can like' : 'Likes disabled'}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${allowComments && privacy !== 'private' ? 'bg-green-500' : 'bg-gray-500'}`} />
                                {allowComments && privacy !== 'private' ? 'Friends can comment' : 'Comments disabled'}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
