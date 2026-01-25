"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Globe, Sparkles } from "lucide-react";
import Link from "next/link";
import { SafeDate } from "@/components/shared/safe-date";
import { cn } from "@/lib/utils";

interface PostHeaderProps {
    post: any;
    isPinterest: boolean;
    name: string;
    profilePic: string | null;
    t: (key: any) => string;
    isAuthor: boolean;
    engagementSettings: any;
    privacyIcon: React.ReactNode;
    translatedContent: string | null;
    onTranslate: (lang: 'es' | 'en' | 'fr' | 'zh' | 'hi' | 'ar') => void;
    onClearTranslation: () => void;
    onAskAI: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onReport: () => void;
}

export function PostHeader({
    post,
    isPinterest,
    name,
    profilePic,
    t,
    isAuthor,
    engagementSettings,
    privacyIcon,
    translatedContent,
    onTranslate,
    onClearTranslation,
    onAskAI,
    onEdit,
    onDelete,
    onReport
}: PostHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <Link href={`/u/${post.authorId}`}>
                    <Avatar className="w-6 h-6 border border-border">
                        <AvatarImage src={profilePic || undefined} />
                        <AvatarFallback className="text-[10px]">{name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex flex-col">
                    <Link href={`/u/${post.authorId}`} className="text-xs font-semibold hover:underline line-clamp-1">{name}</Link>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <SafeDate date={post.createdAt} />
                        {post.context?.name && <span>{t("post.posted_in")} {post.context.name}</span>}
                        <span className="opacity-50 flex items-center gap-1">
                            {privacyIcon}
                            {engagementSettings.privacy === 'specific' && post.allowedViewerIds?.length > 0 && (
                                <span className="text-[9px] bg-blue-50 text-blue-600 px-1 rounded-sm">
                                    +{post.allowedViewerIds.length}
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </div>
            {/* Menu - Stop Propagation */}
            <div onClick={e => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Globe className="w-4 h-4 mr-2" />
                                <span>{t("post.translate")}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => onTranslate('en')}>English</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onTranslate('zh')}>中文 (Mandarin)</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onTranslate('hi')}>हिन्दी (Hindi)</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onTranslate('es')}>Español</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onTranslate('fr')}>Français</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onTranslate('ar')}>العربية (Arabic)</DropdownMenuItem>
                                    {translatedContent && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={onClearTranslation}>
                                                {t("post.translate.original")}
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuItem onClick={onAskAI} className="text-purple-600 dark:text-purple-400 gap-2">
                            <Sparkles className="w-4 h-4" />
                            {t("post.ask_ai")}
                        </DropdownMenuItem>
                        {isAuthor && <DropdownMenuItem onClick={onEdit}>{t("post.edit")}</DropdownMenuItem>}
                        {isAuthor && <DropdownMenuItem onClick={onDelete} className="text-red-500">{t("post.delete")}</DropdownMenuItem>}
                        {!isAuthor && <DropdownMenuItem onClick={onReport} className="text-red-500">{t("post.report")}</DropdownMenuItem>}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
