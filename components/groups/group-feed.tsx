"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { GroupPostCreator } from "@/components/groups/group-post-creator";
import { FeedList } from "@/components/feed/feed-list";
import { getGroupPosts } from "@/app/actions/groups";
import { User } from "firebase/auth";

interface GroupFeedProps {
    groupId: string;
    currentUser: any; // Using any to match existing props usage, ideally imports Profile type
}

export function GroupFeed({ groupId, currentUser }: GroupFeedProps) {
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    return (
        <>
            {/* Create Post - Smooth Expand/Collapse */}
            <AnimatePresence initial={false}>
                {isComposeOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="overflow-hidden mb-6"
                    >
                        <GroupPostCreator
                            groupId={groupId}
                            user={currentUser}
                            onClose={() => setIsComposeOpen(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <FeedList
                variant="pinterest-mobile"
                fetcher={(limit, filters) => getGroupPosts(groupId, limit, filters)}
                headerAction={
                    <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full w-8 h-8 p-0 bg-background border-dashed border-primary/50 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                        onClick={() => setIsComposeOpen(!isComposeOpen)}
                    >
                        <Plus className={`w-4 h-4 transition-transform duration-300 ${isComposeOpen ? "rotate-45" : ""}`} />
                    </Button>
                }
            />
        </>
    );
}
