'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/language-context";

interface LiveViewProps {
    broadcasts: any[];
    error: string | null;
}

export function LiveView({ broadcasts, error }: LiveViewProps) {
    const { t } = useLanguage();

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{t('live.title')}</h1>
                        <p className="text-muted-foreground mt-1">{t('live.desc')}</p>
                    </div>
                </div>
                <Link href="/live/broadcast">
                    <Button size="lg" className="gap-2">
                        <Video className="h-5 w-5" />
                        {t('live.go_live')}
                    </Button>
                </Link>
            </div>

            {error ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <p className="text-destructive mb-4">{t('live.error')}</p>
                        <p className="text-sm text-muted-foreground">{error}</p>
                    </CardContent>
                </Card>
            ) : broadcasts.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Video className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">{t('live.empty.title')}</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            {t('live.empty.desc')}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {broadcasts.map((broadcast) => (
                        <Link key={broadcast.id} href={`/live/${broadcast.id}`}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                                <CardHeader className="p-0">
                                    <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                        <Video className="h-16 w-16 text-primary/40" />
                                        <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                            Live
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={broadcast.hostImage} />
                                            <AvatarFallback>{broadcast.hostName?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold truncate">{broadcast.hostName}</h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {t('live.watching')}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
