"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreatePost } from "./create-post";
import { FeedList } from "./feed-list";

interface HomeFeedProps {
    initialIsComposeOpen?: boolean;
}

export function HomeFeed({ initialIsComposeOpen = false }: HomeFeedProps) {
    const [isComposeOpen, setIsComposeOpen] = useState(initialIsComposeOpen);

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
                        className="overflow-hidden"
                    >
                        <CreatePost onClose={() => setIsComposeOpen(false)} />
                    </motion.div>
                )}
            </AnimatePresence>

            <FeedList
                variant="pinterest-mobile"
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
