import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Radio, Youtube, Disc, Headphones, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MusicPage() {
    const services = [
        {
            name: "Pandora",
            desc: "Personalized internet radio and music streaming.",
            url: "https://www.pandora.com/",
            icon: <Radio className="w-10 h-10 text-blue-500" />,
            color: "bg-blue-50 border-blue-100 hover:bg-blue-100"
        },
        {
            name: "iHeartRadio",
            desc: "Live radio, podcasts, and streaming music.",
            url: "https://www.iheart.com/",
            icon: <HeartIcon className="w-10 h-10 text-red-500" />,
            color: "bg-red-50 border-red-100 hover:bg-red-100"
        },
        {
            name: "Spotify",
            desc: "Millions of songs and podcasts.",
            url: "https://open.spotify.com/",
            icon: <Disc className="w-10 h-10 text-green-500" />,
            color: "bg-green-50 border-green-100 hover:bg-green-100"
        },
        {
            name: "SoundCloud",
            desc: "Discover new music and independent artists.",
            url: "https://soundcloud.com/",
            icon: <Headphones className="w-10 h-10 text-orange-500" />,
            color: "bg-orange-50 border-orange-100 hover:bg-orange-100"
        },
        {
            name: "Apple Music",
            desc: "Stream over 100 million songs ad-free.",
            url: "https://music.apple.com/",
            icon: <Music className="w-10 h-10 text-pink-500" />,
            color: "bg-pink-50 border-pink-100 hover:bg-pink-100"
        },
        {
            name: "YouTube Music",
            desc: "Music videos and official albums.",
            url: "https://music.youtube.com/",
            icon: <Youtube className="w-10 h-10 text-red-600" />,
            color: "bg-neutral-50 border-neutral-200 hover:bg-neutral-100"
        }
    ];

    return (
        <MainLayout className="max-w-5xl">
            <div className="py-8 space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">Music Lounge</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Your gateway to the world's best music services. Launch your favorite player in a new window and keep the vibe going.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <a
                            key={service.name}
                            href={service.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group"
                        >
                            <Card className={`h-full transition-all duration-300 transform group-hover:-translate-y-1 group-hover:shadow-lg border-2 ${service.color.replace('bg-', 'border-opacity-50 ')}`}>
                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <div className={`p-3 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 ${service.color}`}>
                                        {service.icon}
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-xl flex items-center justify-between">
                                            {service.name}
                                            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base">
                                        {service.desc}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </a>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}

function HeartIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
    )
}
