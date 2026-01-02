'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, Shield, Users, Globe, CheckCircle } from "lucide-react"
import Image from "next/image"

export function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <Heart className="w-7 h-7 text-blue-600" fill="currentColor" />
                            <div>
                                <div className="font-bold text-2xl text-gray-900 tracking-tight">Famio</div>
                                <div className="text-xs text-gray-600 font-medium -mt-1">by WeAreFamily</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/login">
                                <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium">
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm">
                                    Create Account
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative bg-gradient-to-b from-blue-50 to-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
                    <div className="text-center">
                        <div className="mb-4 inline-flex items-center gap-2 text-blue-600">
                            <Heart className="w-8 h-8" fill="currentColor" />
                            <span className="text-sm font-semibold uppercase tracking-wider">WeAreFamily Presents</span>
                        </div>
                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-gray-900 tracking-tight mb-4">
                            Famio
                        </h1>
                        <p className="text-2xl md:text-3xl font-semibold text-blue-600 mb-6">
                            Connect with Your Family and Friends.<br />
                            We Are One Family
                        </p>
                        <p className="max-w-3xl mx-auto text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed font-normal">
                            A private, secure platform designed exclusively for families to share moments,
                            plan events, and stay connected with the people who matter most.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link href="/signup">
                                <Button size="lg" className="h-14 px-10 text-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md">
                                    Join Famio
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold">
                                    Learn More
                                </Button>
                            </Link>
                        </div>

                        {/* Trust Badge */}
                        <div className="mt-12 flex items-center justify-center gap-2 text-sm text-gray-600">
                            <Shield className="w-5 h-5 text-blue-600" />
                            <span className="font-medium">Trusted by thousands of families worldwide</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Famio?</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Everything your family needs to stay connected, secure, and organized.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <FeatureCard
                            icon={<Shield className="w-10 h-10 text-blue-600" />}
                            title="Private & Secure"
                            description="Your family's data is protected with enterprise-grade security. No ads, no tracking, no third-party access."
                        />
                        <FeatureCard
                            icon={<Users className="w-10 h-10 text-blue-600" />}
                            title="Built for Families"
                            description="Share photos, plan events, coordinate schedules, and create lasting memories together in one beautiful platform."
                        />
                        <FeatureCard
                            icon={<Globe className="w-10 h-10 text-blue-600" />}
                            title="Always Connected"
                            description="Stay in touch with real-time messaging, event notifications, and instant photo sharing from anywhere."
                        />
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 bg-gray-50 border-y border-gray-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">What You'll Get</h2>
                    </div>

                    <div className="space-y-4">
                        <BenefitItem text="Unlimited photo and video sharing" />
                        <BenefitItem text="Private family messaging and group chats" />
                        <BenefitItem text="Shared calendar and event planning" />
                        <BenefitItem text="Stories that keep everyone updated" />
                        <BenefitItem text="Secure cloud storage for family memories" />
                        <BenefitItem text="Mobile and desktop access" />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-blue-600">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Ready to bring your family closer?
                    </h2>
                    <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                        Join thousands of families who are already sharing, connecting, and creating memories together.
                    </p>
                    <Link href="/signup">
                        <Button size="lg" className="h-16 px-12 text-lg bg-white text-blue-600 hover:bg-gray-100 font-bold shadow-lg">
                            Get Started Free
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="flex items-center gap-2">
                            <Heart className="w-6 h-6 text-blue-600" fill="currentColor" />
                            <div>
                                <span className="font-bold text-gray-900 text-lg">Famio</span>
                                <span className="text-gray-500 text-sm ml-2">by WeAreFamily</span>
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-gray-600 text-sm">
                                © 2026 Famio by WeAreFamily. All Rights Reserved.
                            </p>
                            <p className="text-gray-500 text-xs">
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
        <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>
    )
}

function BenefitItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-lg border border-gray-200">
            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <span className="text-gray-900 font-medium">{text}</span>
        </div>
    )
}
