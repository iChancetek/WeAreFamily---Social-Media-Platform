"use client";

import { useState } from "react";
import { CreateStoryDialog } from "./create-story-dialog";
import { StoryViewer } from "./story-viewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";

interface Story {
    id: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    authorId: string;
    createdAt: Date;
}

interface UserStories {
    user: {
        imageUrl: string | null;
        displayName: string | null;
    };
    stories: Story[];
}

interface StoriesTrayClientProps {
    currentUserId?: string; // Clerk ID
    currentUserRole?: string;
    currentUserImage?: string | null;
    currentUserDisplayName?: string | null;
    activeStories: UserStories[];
}

export function StoriesTrayClient({
    currentUserId,
    currentUserRole,
    currentUserImage,
    currentUserDisplayName,
    activeStories
}: StoriesTrayClientProps) {
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedUserIndex, setSelectedUserIndex] = useState(0);

    const canAddStory = currentUserRole === 'member' || currentUserRole === 'admin';

    const handleStoryClick = (index: number) => {
        setSelectedUserIndex(index);
        setViewerOpen(true);
    };

    return (
        <div className="relative mb-6">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {/* Add Story Card */}
                {canAddStory && (
                    <div className="flex-shrink-0 snap-start">
                        <CreateStoryDialog>
                            <div className="relative w-28 h-48 rounded-xl overflow-hidden cursor-pointer group shadow-sm transition-transform hover:scale-[1.02]">
                                <div className="absolute inset-0 bg-gray-100 dark:bg-muted">
                                    {currentUserImage ? (
                                        <img src={currentUserImage} alt="Me" className="w-full h-2/3 object-cover opacity-80" />
                                    ) : (
                                        <div className="w-full h-2/3 bg-gray-200 dark:bg-muted/80 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-gray-400">{currentUserDisplayName?.charAt(0)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-0 inset-x-0 h-1/3 bg-white dark:bg-card flex flex-col items-center justify-center pt-4 z-10">
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-card transition-colors group-hover:bg-accent/50">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                                            <Plus className="w-6 h-6 text-primary" />
                                        </div>
                                        <span className="text-xs font-semibold text-foreground">Add to My Life</span>
                                    </div>
                                </div>
                            </div>
                        </CreateStoryDialog>
                    </div>
                )}

                {/* Active Stories */}
                {activeStories.map((storyGroup, idx) => {
                    // Check if *this* story group belongs to the current user (if so, we could merge it with the "Add Story" card visually, but Facebook separates them: "Your Story" vs "Add". For v1 let's just list them.)
                    // Actually, standard UI is usually: My Story (Add) | Friend 1 | Friend 2. 
                    // If "My Story" exists, clicking it usually shows my story. The "Add" button is often separate or a sub-action.
                    // For simplicity: The "Create Story" card is always first. If I have stories, I appear in the list too. 

                    const isMe = false; // We can rely on ID comparison if we want to treat 'me' differently, but seeing myself in the feed is fine.

                    return (
                        <div
                            key={idx}
                            className="flex-shrink-0 snap-start cursor-pointer group relative w-28 h-48 rounded-xl overflow-hidden transition-transform hover:scale-[1.02]"
                            onClick={() => handleStoryClick(idx)}
                        >
                            {/* Background Image (Thumbnail of latest story) */}
                            {storyGroup.stories[0].mediaType === 'video' ? (
                                <video src={storyGroup.stories[0].mediaUrl} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" />
                            ) : (
                                <img src={storyGroup.stories[0].mediaUrl} alt="Story" className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" />
                            )}

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                            {/* User Avatar */}
                            <div className="absolute top-3 left-3 w-10 h-10 rounded-full border-4 border-primary overflow-hidden z-10">
                                <img src={storyGroup.user.imageUrl || '/placeholder-user.jpg'} alt={storyGroup.user.displayName || 'User'} className="w-full h-full object-cover" />
                            </div>

                            {/* User Name */}
                            <div className="absolute bottom-3 left-3 right-3 z-10">
                                <p className="text-white text-xs font-bold truncate drop-shadow-md">
                                    {storyGroup.user.displayName}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Viewer Overlay */}
            <StoryViewer
                open={viewerOpen}
                onOpenChange={setViewerOpen}
                initialStories={activeStories}
                initialUserIndex={selectedUserIndex}
            />
        </div>
    );
}
