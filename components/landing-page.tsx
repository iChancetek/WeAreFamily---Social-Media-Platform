'use client'

// Updated: 2026-01-03 19:10 - Audio toggle added
import { useState, useRef } from "react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Heart, Shield, Users, Globe, CheckCircle, Sparkles, Volume2, VolumeX, MessageCircle } from "lucide-react"
import Image from "next/image"

export function LandingPage() {
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const toggleAudio = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="absolute top-0 left-0 right-0 z-[100] bg-transparent">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-3">
                            <img src="/icons/famio-symbol.png" alt="famio" className="w-8 h-8 rounded-xl object-cover shadow-premium" />
                            <div>
                                <div className="font-bold text-2xl text-white tracking-tight">famio</div>
                                <div className="text-xs text-white/80 font-semibold -mt-1 uppercase tracking-wider">by ChanceTEK</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "text-white hover:text-white hover:bg-white/10 font-semibold px-6")}>
                                Sign In
                            </Link>
                            <Link href="/signup" className={cn(buttonVariants(), "bg-primary hover:bg-primary/90 text-white font-bold shadow-glow-sm px-6 h-11 rounded-full transition-all hover:scale-105")}>
                                Create Account
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden min-h-screen flex items-center bg-zinc-950">
                {/* Background Video */}
                <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted={isMuted} // React controls this property
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
                >
                    <source src="/famio.us2.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-zinc-950 pointer-events-none" />

                {/* Audio Control */}
                <button
                    onClick={toggleAudio}
                    className="absolute bottom-10 right-10 z-30 p-4 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-md border border-white/20 transition-all duration-300 shadow-2xl"
                    title={isMuted ? "Unmute Video" : "Mute Video"}
                >
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>

                <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 w-full">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-md border border-primary/30 rounded-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-primary uppercase tracking-wider">The AI-Native Platform for Your Inner Circle</span>
                        </div>

                        <h1 className="text-7xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter mb-6 drop-shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            famio
                        </h1>
                        <p className="text-3xl md:text-4xl font-bold text-blue-50/90 mb-8 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                            We Are One — Grow Your Relationships Through Real Connection.
                        </p>

                        <p className="max-w-2xl text-xl text-gray-300 mb-12 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                            A private, secure social experience for the people who matter most. Share moments, 
                            plan together, and let intelligent AI help you stay connected, organized, and effortlessly in sync.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-6 items-center animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "h-16 px-12 text-xl bg-primary hover:bg-primary/90 text-white font-black shadow-real rounded-full transition-all hover:scale-105 active:scale-95")}>
                                Join famio
                            </Link>
                            <Link href="/learn-more" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-16 px-12 text-xl border-2 border-white/30 bg-white/5 text-white hover:bg-white/10 backdrop-blur-md font-bold rounded-full transition-all")}>
                                Learn More
                            </Link>
                        </div>

                        {/* Trust Badge */}
                        <div className="mt-16 flex items-center gap-3 text-gray-400 animate-in fade-in duration-1000 delay-700">
                            <div className="flex -space-x-2">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-800" />
                                ))}
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                <Shield className="w-4 h-4 text-primary" />
                                Trusted by families worldwide
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-32 bg-background relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-24">
                        <h2 className="text-5xl font-black text-foreground mb-6 tracking-tighter">Why Choose famio?</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
                            Everything your family needs to stay connected, secure, and organized in one polished interface.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <FeatureCard
                            icon={<Shield className="w-8 h-8" />}
                            title="Private & Secure"
                            description="Enterprise-grade security with end-to-end encryption. No ads, no tracking, no third-party access. Your data belongs to you."
                        />
                        <FeatureCard
                            icon={<Users className="w-8 h-8" />}
                            title="Built for Families"
                            description="Share photos, plan events, coordinate schedules, and create lasting memories together in a private social feed."
                        />
                        <FeatureCard
                            icon={<Sparkles className="w-8 h-8" />}
                            title="AI Intelligence"
                            description="Advanced AI interface for everyone. Powered by OpenAI, Claude, and Gemini with voice input and multimodal capabilities."
                        />
                        <FeatureCard
                            icon={<Globe className="w-8 h-8" />}
                            title="Live Moments"
                            description="Broadcast real-time video to share celebrations, announcements, or just hang out with family members anywhere."
                        />
                        <FeatureCard
                            icon={<MessageCircle className="w-8 h-8" />}
                            title="Always Connected"
                            description="Real-time messaging, smart notifications, and instant photo sharing designed for the speed of family life."
                        />
                         <FeatureCard
                            icon={<Heart className="w-8 h-8" />}
                            title="We Are One"
                            description="Our core philosophy is connection. We build tools that bring people together, not keep them scrolling."
                        />
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-32 bg-secondary/50 border-y border-border/50 relative">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black text-foreground mb-4 tracking-tight">The famio Experience</h2>
                        <p className="text-lg text-muted-foreground font-medium">Curated features for a richer family life.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <BenefitItem text="Unlimited high-fidelity photo and video sharing" />
                        <BenefitItem text="Private family messaging and threaded group chats" />
                        <BenefitItem text="Shared calendar and collaborative event planning" />
                        <BenefitItem text="Real-time 'My Life' status updates" />
                        <BenefitItem text="Secure, encrypted cloud storage for memories" />
                        <BenefitItem text="Seamless mobile PWA and desktop experience" />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 bg-primary relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-5xl md:text-6xl font-black text-white mb-8 tracking-tighter">
                        Ready to bring your family closer?
                    </h2>
                    <p className="text-2xl text-white/80 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                        Join thousands of families who are already sharing, connecting, and creating memories together.
                    </p>
                    <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "h-20 px-16 text-2xl bg-white text-primary hover:bg-white/90 font-black shadow-real rounded-full transition-all hover:scale-105 active:scale-95")}>
                        Get Started Free
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-background border-t border-border/50 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-center space-y-10">
                        <div className="flex items-center gap-3">
                            <img src="/icons/famio-symbol.png" className="w-10 h-10 rounded-2xl object-cover shadow-premium" alt="famio" />
                            <div>
                                <span className="font-black text-foreground text-2xl tracking-tighter">famio</span>
                                <span className="text-muted-foreground text-sm ml-2 font-bold uppercase tracking-widest">by ChanceTEK</span>
                            </div>
                        </div>

                        {/* Links */}
                        <div className="flex gap-10">
                            <Link href="/privacy" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
                                Privacy Policy
                            </Link>
                            <Link href="/help" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
                                Help Center
                            </Link>
                        </div>

                        <div className="text-center space-y-4 max-w-md">
                            <p className="text-sm text-muted-foreground font-medium italic">
                                "Built with privacy and security at the core, for the people who matter most."
                            </p>
                            <div className="h-px w-20 bg-border mx-auto" />
                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-tighter">
                                © 2026 famio by ChanceTEK. All Rights Reserved.
                            </p>
                            <p className="text-muted-foreground/60 text-[10px] font-medium">
                                Developed by Chancellor Minus | ChanceTEK LLC | iChanceTEK
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="group p-10 rounded-[2.5rem] bg-card border border-border/50 shadow-premium transition-all duration-500 hover:shadow-real hover:-translate-y-2 hover:border-primary/20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/5 text-primary mb-8 transition-all duration-500 group-hover:scale-110 group-hover:bg-primary group-hover:text-white shadow-sm">
                {icon}
            </div>
            <h3 className="text-2xl font-black text-foreground mb-4 tracking-tight">{title}</h3>
            <p className="text-muted-foreground leading-relaxed font-medium">{description}</p>
        </div>
    )
}

function BenefitItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-4 bg-card px-8 py-6 rounded-3xl border border-border/30 shadow-sm hover:shadow-premium transition-all duration-300">
            <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
            <span className="text-foreground font-bold tracking-tight">{text}</span>
        </div>
    )
}
