"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Story {
    id: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    createdAt: Date;
}

interface UserStories {
    user: {
        imageUrl: string | null;
        displayName: string | null;
    };
    stories: Story[];
}

interface StoryViewerProps {
    initialStories: UserStories[]; // Array of users with their stories
    initialUserIndex: number; // Which user did we click on?
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function StoryViewer({ initialStories, initialUserIndex, open, onOpenChange }: StoryViewerProps) {
    const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const currentUser = initialStories[currentUserIndex];
    const currentStory = currentUser?.stories[currentStoryIndex];

    // Reset when user changes
    useEffect(() => {
        setCurrentUserIndex(initialUserIndex);
        setCurrentStoryIndex(0);
        setProgress(0);
    }, [initialUserIndex, open]);

    // Navigate to next story/user
    const next = useCallback(() => {
        if (!currentUser) return;
        if (currentStoryIndex < currentUser.stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
            setProgress(0);
        } else if (currentUserIndex < initialStories.length - 1) {
            setCurrentUserIndex(prev => prev + 1);
            setCurrentStoryIndex(0);
            setProgress(0);
        } else {
            onOpenChange(false);
        }
    }, [currentStoryIndex, currentUserIndex, initialStories.length, currentUser, onOpenChange]);

    // Navigate to previous story/user
    const prev = useCallback(() => {
        if (!currentUser) return;
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(prev => prev - 1);
            setProgress(0);
        } else if (currentUserIndex > 0) {
            const prevUser = initialStories[currentUserIndex - 1];
            if (prevUser) {
                setCurrentUserIndex(prev => prev - 1);
                setCurrentStoryIndex(prevUser.stories.length - 1);
                setProgress(0);
            }
        }
    }, [currentStoryIndex, currentUserIndex, initialStories, currentUser]);

    // Auto-advance logic
    useEffect(() => {
        if (!open || !currentStory) return;

        if (currentStory.mediaType === 'image') {
            const duration = 5000; // 5 seconds for images
            const interval = 100;
            const step = 100 / (duration / interval);

            const timer = setInterval(() => {
                setProgress(p => {
                    if (p >= 100) {
                        clearInterval(timer);
                        next();
                        return 0;
                    }
                    return p + step;
                });
            }, interval);

            return () => clearInterval(timer);
        }
    }, [currentStory, next, open]);

    // Video end handler
    const handleVideoEnded = () => {
        next();
    };

    if (!currentUser || !currentStory) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-full h-[85vh] p-0 bg-black border-none overflow-hidden flex items-center justify-center">

                {/* Navigation Overlays */}
                <div className="absolute inset-y-0 left-0 w-1/4 z-10 cursor-pointer" onClick={prev} />
                <div className="absolute inset-y-0 right-0 w-1/4 z-10 cursor-pointer" onClick={next} />

                {/* Close Button */}
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute top-4 right-4 z-50 text-white bg-black/20 hover:bg-black/40 rounded-full p-2 backdrop-blur-sm"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Story Content */}
                <div className="relative w-full h-full flex flex-col">
                    {/* Header / Progress Bar */}
                    <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/60 to-transparent">
                        <div className="flex gap-1 mb-2">
                            {currentUser.stories.map((story, idx) => (
                                <div key={story.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white transition-all duration-300 ease-linear"
                                        style={{
                                            width: idx < currentStoryIndex ? '100%' :
                                                idx === currentStoryIndex ? `${progress}%` : '0%'
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8 border border-white/50">
                                <AvatarImage src={currentUser.user.imageUrl || undefined} />
                                <AvatarFallback>{currentUser.user.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-white font-semibold text-sm">
                                {currentUser.user.displayName}
                            </span>
                            <span className="text-white/60 text-xs ml-auto">
                                {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>

                    {/* Media */}
                    <div className="flex-1 flex items-center justify-center bg-zinc-900">
                        {currentStory.mediaType === 'video' ? (
                            <video
                                src={currentStory.mediaUrl}
                                className="max-h-full max-w-full object-contain"
                                autoPlay
                                onEnded={handleVideoEnded}
                                onTimeUpdate={(e) => {
                                    const video = e.currentTarget;
                                    if (video.duration) {
                                        setProgress((video.currentTime / video.duration) * 100);
                                    }
                                }}
                            />
                        ) : (
                            <img
                                src={currentStory.mediaUrl}
                                className="max-h-full max-w-full object-contain animate-in fade-in zoom-in-95 duration-500"
                                alt="Story"
                            />
                        )}
                    </div>
                </div>

                {/* Side Navigation Buttons (Visible on desktop) */}
                <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-20 hidden md:block">
                    <ChevronLeft className="w-8 h-8" />
                </button>
                <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-20 hidden md:block">
                    <ChevronRight className="w-8 h-8" />
                </button>

            </DialogContent>
        </Dialog>
    );
}
