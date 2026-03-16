"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Heart, Share2, MoreHorizontal, Globe, Sparkles, Play, ChevronLeft, ChevronRight, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaEmbed } from "./media-embed";
import { ReactionType } from "@/types/posts";

interface FeedVideoProps {
    src: string;
    poster?: string;
    isEnlarged: boolean;
    className?: string;
    videoRef?: React.RefObject<HTMLVideoElement | null>;
}

function FeedVideo({ src, poster, isEnlarged, className, videoRef }: FeedVideoProps) {
    const localRef = useRef<HTMLVideoElement>(null);
    const ref = videoRef || localRef;

    useEffect(() => {
        if (isEnlarged) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                const vid = ref.current;
                if (!vid) return;
                if (entry.isIntersecting) {
                    vid.play().catch(() => {});
                } else {
                    vid.pause();
                }
            },
            { threshold: 0.5 }
        );

        const currentVid = ref.current;
        if (currentVid) observer.observe(currentVid);

        return () => {
            if (currentVid) observer.unobserve(currentVid);
            observer.disconnect();
        };
    }, [isEnlarged, ref]);

    return (
        <video
            ref={ref}
            src={src}
            poster={poster}
            className={className}
            controls={isEnlarged}
            autoPlay={isEnlarged}
            muted={!isEnlarged}
            preload="metadata"
            playsInline
        />
    );
}

interface PostMediaProps {
    post: any;
    isEnlarged: boolean;
    isPinterest: boolean;
    hasMedia: boolean;
    mainMedia: string | null;
    isEmbeddable: boolean;
    isVideoFile: boolean;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    mediaUrl: string | null;
    pinterestPreview: any;
    isPinterestLinkPreview: boolean;
    currentReaction?: ReactionType;
    isAuthor: boolean;
    t: (key: any) => string;
    translatedContent: string | null;
    onEnlarge: () => void;
    onReaction: (type: ReactionType) => void;
    onShare: (mode: 'native') => void;
    onTranslate: (lang: 'es' | 'en' | 'fr' | 'zh' | 'hi' | 'ar') => void;
    onClearTranslation: () => void;
    onAskAI: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onReport: () => void;
}

export function PostMedia({
    post,
    isEnlarged,
    isPinterest,
    hasMedia,
    mainMedia,
    isEmbeddable,
    isVideoFile,
    videoRef,
    mediaUrl,
    pinterestPreview,
    isPinterestLinkPreview,
    currentReaction,
    isAuthor,
    t,
    translatedContent,
    onEnlarge,
    onReaction,
    onShare,
    onTranslate,
    onClearTranslation,
    onAskAI,
    onEdit,
    onDelete,
    onReport
}: PostMediaProps) {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!hasMedia) return null;

    const mediaList = post.media && post.media.length > 0 ? post.media : (
        mainMedia ? [{ type: isVideoFile ? 'video' : 'photo', url: mainMedia }] : []
    );

    const isCarousel = mediaList.length > 1;

    const scrollTo = (index: number) => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const width = container.clientWidth;
        container.scrollTo({ left: width * index, behavior: 'smooth' });
        setCurrentMediaIndex(index);
    };

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollPosition = container.scrollLeft;
        const width = container.clientWidth;
        const newIndex = Math.round(scrollPosition / width);
        if (newIndex !== currentMediaIndex) {
            setCurrentMediaIndex(newIndex);
        }
    };

    return (
        <div className="w-full relative">
            <div className="absolute top-2 left-2 z-30 pointer-events-auto" onClick={e => e.stopPropagation()}>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white border-none shadow-sm flex items-center justify-center p-0"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </Button>
            </div>

            <div className={cn("w-full relative transition-all duration-300", isCollapsed ? "max-h-[44px] overflow-hidden rounded-xl border border-border/30 shadow-none mb-1" : "")}>
                {isCollapsed && (
                    <div className="absolute inset-0 bg-muted/60 hover:bg-muted/70 backdrop-blur-md flex items-center px-3 gap-2 z-10 cursor-pointer" onClick={() => setIsCollapsed(false)}>
                        <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center">
                            <Play className="w-3 h-3 text-pink-600 fill-current" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-foreground/85">{isVideoFile ? 'Video' : 'Media'} Hidden</span>
                            <span className="text-[9px] text-muted-foreground/90 leading-none">Tap to expand</span>
                        </div>
                    </div>
                )}

                {post.audioUrl && (
                    <div className="w-full p-3 bg-muted/30 rounded-xl flex flex-col gap-1.5 border border-border/40 shadow-sm mb-2" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                            <Play className="w-3.5 h-3.5 text-pink-600 fill-current" />
                            <span className="text-xs font-bold text-foreground/80">Podcast Episode</span>
                        </div>
                        <audio src={post.audioUrl} controls className="w-full h-8" />
                    </div>
                )}

            {mainMedia && (isEmbeddable && mediaUrl ? (
                <div className="w-full">
                    <MediaEmbed
                        url={mediaUrl}
                        playInline={isEnlarged}
                        onPlayRequest={onEnlarge}
                    />
                </div>
            ) : isCarousel ? (
                <div className="relative w-full group/carousel flex items-center bg-black/5 dark:bg-black/20">
                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar w-full relative h-[60vh] md:h-[70vh] bg-black/5 dark:bg-black/20"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {mediaList.map((mediaItem: any, idx: number) => (
                            <div key={idx} className="w-full flex-none snap-center flex items-center justify-center relative h-full">
                                {mediaItem.type === 'video' ? (
                                    <div
                                        className="w-full h-full relative cursor-pointer flex items-center justify-center bg-black"
                                        onMouseEnter={(e) => {
                                            if (!isEnlarged) {
                                                const vid = e.currentTarget.querySelector('video');
                                                if (vid) vid.play().catch(() => { });
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isEnlarged) {
                                                const vid = e.currentTarget.querySelector('video');
                                                if (vid) { vid.pause(); vid.currentTime = 0; }
                                            }
                                        }}
                                        onClick={(e) => {
                                            if (!isEnlarged) { e.stopPropagation(); onEnlarge(); }
                                        }}
                                    >
                                        <FeedVideo
                                            src={`${mediaItem.url}#t=0.001`}
                                            className="w-full h-auto object-contain max-h-[60vh] md:max-h-[70vh]"
                                            isEnlarged={isEnlarged}
                                        />
                                        {!isEnlarged && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors pointer-events-none">
                                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-lg">
                                                    <Play className="w-6 h-6 text-white fill-current" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <img
                                        src={mediaItem.url}
                                        alt=""
                                        className="w-full h-auto object-contain max-h-[60vh] md:max-h-[70vh]"
                                        onClick={(e) => {
                                            if (!isEnlarged) { e.stopPropagation(); onEnlarge(); }
                                        }}
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Navigation Arrows */}
                    {isCarousel && currentMediaIndex > 0 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60 rounded-full h-8 w-8 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
                            onClick={(e) => { e.stopPropagation(); scrollTo(currentMediaIndex - 1); }}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    )}
                    {isCarousel && currentMediaIndex < mediaList.length - 1 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60 rounded-full h-8 w-8 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
                            onClick={(e) => { e.stopPropagation(); scrollTo(currentMediaIndex + 1); }}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    )}

                    {/* Dots indicator */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                        {mediaList.map((_: any, idx: number) => (
                            <div
                                key={idx}
                                className={cn("h-1.5 rounded-full transition-all", idx === currentMediaIndex ? "w-3 bg-white" : "w-1.5 bg-white/50")}
                            />
                        ))}
                    </div>
                </div>
            ) : isVideoFile ? (
                <div
                    className="w-full bg-black rounded-lg overflow-hidden relative cursor-pointer"
                    onClick={(e) => {
                        if (!isEnlarged) {
                            e.stopPropagation();
                            onEnlarge();
                        }
                    }}
                >
                    <FeedVideo
                        videoRef={videoRef}
                        src={`${mainMedia}#t=0.001`}
                        poster={post.thumbnailUrl || undefined}
                        className="w-full h-auto object-contain max-h-[60vh] md:max-h-[70vh]"
                        isEnlarged={isEnlarged}
                    />
                    {!isEnlarged && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-lg">
                                <Play className="w-6 h-6 text-white fill-current" />
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full relative overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={mainMedia!}
                        alt=""
                        className="w-full h-auto object-contain max-h-[60vh] md:max-h-[70vh] hover:scale-105 transition-transform duration-500"
                        onClick={(e) => {
                            if (!isEnlarged) { e.stopPropagation(); onEnlarge(); }
                        }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                </div>
            ))}

            {/* Pinterest Overlay Actions (Mobile Only) */}
            {isPinterest && hasMedia && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity pointer-events-none">
                    {/* Top-right: Save + Share */}
                    <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
                        <Button
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/95 hover:bg-white backdrop-blur-sm shadow-md text-foreground border-none"
                            onClick={(e) => {
                                e.stopPropagation();
                                onReaction('love');
                            }}
                        >
                            <Heart className={cn("w-4 h-4", currentReaction && "fill-current text-pink-600")} />
                        </Button>
                        <Button
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/95 hover:bg-white backdrop-blur-sm shadow-md text-foreground border-none"
                            onClick={(e) => {
                                e.stopPropagation();
                                onShare('native');
                            }}
                        >
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </div>
                    {/* Bottom-right: More menu */}
                    <div className="absolute bottom-2 right-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="icon" className="h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white border-none">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
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
            )}

            {/* Original Pinterest Link Preview Overlay */}
            {!isPinterest && isPinterestLinkPreview && pinterestPreview && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 text-white flex flex-col justify-end pt-16 pointer-events-none">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="bg-[#E60023] rounded-full p-1 shadow-sm"><span className="sr-only">Pinterest</span><svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-white"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.228.085.355-.09.376-.292 1.199-.332 1.363-.053.225-.172.271-.399.165-1.487-.695-2.42-2.875-2.42-4.646 0-3.778 2.305-7.252 7.951-7.252 4.173 0 6.949 3.018 6.949 6.169 0 3.714-2.313 6.649-5.512 6.649-1.084 0-2.092-.565-2.435-1.229l-.665 2.527c-.237.906-.883 2.052-1.314 2.749 1.002.301 2.05.461 3.137.461 6.613 0 11.979-5.368 11.979-11.987001C24 5.367 18.618 0 12.017 0z" /></svg></div>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-95 drop-shadow-md">Pinterest</span>
                    </div>
                    {pinterestPreview.title && <h3 className="text-sm font-bold line-clamp-2 leading-tight drop-shadow-md">{pinterestPreview.title}</h3>}
                </div>
            )}

            {/* Removed redundant indicator thanks to carousel dots */}

            {/* Enlarge Hint Overlay (Only in Feed) */}
            {!isEnlarged && !isEmbeddable && !isVideoFile && (
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                    <span className="text-white text-xs font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {t("post.view")}
                    </span>
                </div>
            )}
            </div> {/* End Collapse Wrapper */}
        </div>
    );
}
