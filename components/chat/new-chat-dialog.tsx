"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { checkOrCreateChat } from "@/app/actions/chat";

import { useLanguage } from "@/components/language-context";

interface FamilyMember {
    id: string;
    displayName: string | null;
    imageUrl: string | null;
    email: string | null;
}

interface NewChatDialogProps {
    familyMembers: FamilyMember[];
}

export function NewChatDialog({ familyMembers }: NewChatDialogProps) {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const router = useRouter();

    const filteredFamily = familyMembers.filter(member =>
        (member.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
        (member.email || "").toLowerCase().includes(search.toLowerCase())
    );

    const handleStartChat = async (targetId: string) => {
        try {
            setLoadingId(targetId);
            const chatId = await checkOrCreateChat(targetId);
            setOpen(false);
            router.push(`/messages?chatId=${chatId}`);
            router.refresh();
        } catch (error) {
            console.error("Failed to start chat:", error);
            toast.error(t('messages.create.error'));
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t('messages.new')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('messages.new')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('messages.search_family')}
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                        {filteredFamily.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-8">
                                {t('messages.new_chat.empty')}
                            </p>
                        ) : (
                            filteredFamily.map((member) => (
                                <button
                                    key={member.id}
                                    onClick={() => handleStartChat(member.id)}
                                    disabled={!!loadingId}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
                                    <Avatar>
                                        <AvatarImage src={member.imageUrl || undefined} />
                                        <AvatarFallback>{member.displayName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{member.displayName}</p>
                                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                    </div>
                                    {loadingId === member.id && <Loader2 className="w-4 h-4 animate-spin" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
