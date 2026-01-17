'use client';

import { PendingApprovalScreen } from "@/components/auth/pending-approval-screen";
import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/components/auth-provider";
import { CreatePost } from "@/components/feed/create-post";
import { FeedList } from "@/components/feed/feed-list";
import { LandingPage } from "@/components/landing-page";
import { LandingChatWidget } from "@/components/landing/landing-chat-widget";
import { BirthdayModal } from "@/components/birthdays/birthday-modal";
import { WelcomeHeader } from "@/components/feed/welcome-header";
import { StoriesTray } from "@/components/stories/stories-tray";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Home() {
    const { user, profile, loading } = useAuth();
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    // If loading, show nothing or skeleton (handled by layout mostly)
    if (loading) return null;

    if (!user) {
        return (
            <>
                <LandingPage />
                <LandingChatWidget />
            </>
        );
    }

    // If user is not synced yet (webhook latency), show loading or pending
    // We can check profile role if available
    if (profile?.role === 'pending') {
        return <PendingApprovalScreen />;
    }

    const displayName = profile?.firstName || user.displayName || "Family";

    return (
        <MainLayout>
            <div className="pb-8">
                <WelcomeHeader displayName={displayName} />

                {/* Only show birthday modal if actually has birthday (handled inside component logic often, but based on prop here) */}
                {/* Note: In client component, we might rely on the modal to check dates itself if props aren't passed from server, but here we keep structure */}
                {/* <BirthdayModal />  -- Re-enabled if needed, simplified for client transition */}

                <StoriesTray />

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
            </div>
        </MainLayout>
    );
}
