"use client";

import { useState } from "react";
import { CreateStoryDialog } from "./create-story-dialog";
import { StoryViewer } from "./story-viewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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

import { useLanguage } from "@/components/language-context";

export function StoriesTrayClient({
    currentUserId,
    currentUserRole,
    currentUserImage,
    currentUserDisplayName,
    activeStories
}: StoriesTrayClientProps) {
    const { t } = useLanguage();
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedUserIndex, setSelectedUserIndex] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Enable for all users
    const canAddStory = true;

    const handleStoryClick = (index: number) => {
        setSelectedUserIndex(index);
        setViewerOpen(true);
    };

    return (
        <div className="relative mb-6">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-foreground/75 tracking-wide">MY LIFE</h3>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsCollapsed(!isCollapsed)} 
                    className="h-6 w-6 p-0 rounded-full hover:bg-muted/50"
                >
                    {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </Button>
            </div>

            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <motion.div
                        key="stories-tray-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.23, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
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

                    </motion.div>
                )}
            </AnimatePresence>

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
