'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Heart, Shield, Zap, Globe } from "lucide-react"

export function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-rose-500 selection:text-white overflow-hidden">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-rose-600/20 blur-[120px] animate-pulse delay-1000" />
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
                <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
                    <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
                    <span>WeAreFamily</span>
                </div>
                <div className="flex gap-4">
                    <Link href="/sign-in">
                        <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full px-6">
                            Sign In
                        </Button>
                    </Link>
                    <Link href="/sign-up">
                        <Button className="bg-rose-600 hover:bg-rose-700 text-white rounded-full px-6 font-semibold shadow-[0_0_20px_rgba(225,29,72,0.5)] transition-all hover:shadow-[0_0_40px_rgba(225,29,72,0.7)] hover:scale-105">
                            Join Now
                        </Button>
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 flex flex-col justify-center min-h-[80vh] px-6 text-center md:px-12">
                <div className="space-y-8 animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-rose-400 mb-4 animate-bounce delay-300">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                        The Selected Family Network
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
                        YOUR FAMILY.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500">REIMAGINED.</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-xl md:text-2xl text-gray-400 font-light leading-relaxed">
                        A private, secure, and beautiful space to share moments, plan events, and stay connected with the people who matter most.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
                        <Link href="/sign-up">
                            <Button size="lg" className="h-14 px-8 text-lg bg-white text-black hover:bg-gray-200 rounded-full font-bold transition-transform hover:scale-105">
                                Get Started
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Link href="/sign-in">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/20 bg-transparent text-white hover:bg-white/10 rounded-full">
                                View Demo
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 max-w-6xl mx-auto text-left">
                    <FeatureCard
                        icon={<Shield className="w-8 h-8 text-blue-500" />}
                        title="Private & Secure"
                        description="Your data stays in the family. No ads, no tracking, just genuine connection."
                    />
                    <FeatureCard
                        icon={<Zap className="w-8 h-8 text-purple-500" />}
                        title="Real-time Magic"
                        description="Instant messaging, live event updates, and seamless photo sharing."
                    />
                    <FeatureCard
                        icon={<Heart className="w-8 h-8 text-rose-500" />}
                        title="Made with Love"
                        description="Designed to bring you closer together with a beautiful, modern experience."
                    />
                </div>
            </main>

            <footer className="relative z-10 py-12 text-center text-gray-600 text-sm">
                <p>&copy; 2024 WeAreFamily. Built for connection.</p>
            </footer>
        </div>
    )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm group">
            <div className="mb-6 p-4 rounded-2xl bg-white/5 w-fit group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{description}</p>
        </div>
    )
}
