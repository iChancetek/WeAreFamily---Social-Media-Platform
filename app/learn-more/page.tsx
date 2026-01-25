import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, Shield, Users, Globe, MessageCircle, Calendar, Image as ImageIcon, Sparkles, Mail, Lock, Eye, Zap, Award, CheckCircle2, Monitor } from "lucide-react"

export default function LearnMorePage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-3">
                            <img src="/icons/icon-72x72.png" alt="Famio" className="w-7 h-7 rounded-xl" />
                            <div>
                                <div className="font-bold text-2xl text-gray-900 tracking-tight">Famio</div>
                                <div className="text-xs text-gray-600 font-medium -mt-1">by ChanceTEK</div>
                            </div>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Link href="/">
                                <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium">
                                    Back to Home
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-gradient-to-b from-blue-50 to-white py-20 border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full mb-6">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700">Powered by OpenAI, Claude & Perplexity</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
                        Everything Your Family Needs to Stay Connected
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                        Famio is a private, secure social platform built exclusively for families. Share moments, plan events, and stay connected with the people who matter most.
                    </p>
                </div>
            </section>

            {/* PWA Announcement Section */}
            <section className="py-20 bg-indigo-600 text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full mb-6">
                            <span className="animate-pulse w-2 h-2 bg-green-400 rounded-full"></span>
                            <span className="text-sm font-semibold text-white">New Update</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
                            🚀 Famio is Now a Progressive Web App (PWA)!
                        </h2>
                        <p className="text-xl text-indigo-100 max-w-3xl mx-auto leading-relaxed">
                            We’re excited to share that Famio has officially been converted into a PWA 🎉
                            <br />
                            Enjoy a faster, smoother, and app-like experience on your mobile device or desktop—without downloading anything from an app store.
                        </p>
                    </div>

                    {/* What does this mean? */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                        <BenefitCard
                            icon={<Zap className="w-6 h-6 text-yellow-400" />}
                            title="Faster Performance"
                            desc="Instant load times & smoother interactions"
                        />
                        <BenefitCard
                            icon={<Globe className="w-6 h-6 text-blue-400" />}
                            title="App-Like Experience"
                            desc="Full-screen experience directly from browser"
                        />
                        <BenefitCard
                            icon={<Monitor className="w-6 h-6 text-purple-400" />}
                            title="Cross-Platform"
                            desc="Works seamlessly on iPhone, Android & Desktop"
                        />
                        <BenefitCard
                            icon={<CheckCircle2 className="w-6 h-6 text-green-400" />}
                            title="Always Updated"
                            desc="No manual updates needed—always fresh"
                        />
                    </div>

                    {/* How to Install */}
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/10">
                        <h3 className="text-3xl font-bold text-center mb-12">📱 How to Add Famio to Your Device</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                            {/* iPhone */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-xl">
                                        🍎
                                    </div>
                                    <h4 className="text-xl font-bold">iPhone (Safari)</h4>
                                </div>
                                <ol className="space-y-3 text-indigo-100 list-decimal pl-5">
                                    <li>Open Safari and go to <span className="text-white font-mono bg-white/20 px-1 rounded">https://famio.us</span></li>
                                    <li>Tap the <strong className="text-white">Share icon</strong> (square with an arrow ↑)</li>
                                    <li>Scroll down and tap <strong className="text-white">“Add to Home Screen”</strong></li>
                                    <li>Name it <strong>Famio</strong> and tap Add</li>
                                </ol>
                                <p className="text-sm text-green-300 flex items-center gap-2 mt-4">
                                    <CheckCircle2 className="w-4 h-4" /> Appears on home screen
                                </p>
                            </div>

                            {/* Android */}
                            <div className="space-y-4 relative">
                                <div className="hidden md:block absolute left-0 top-10 bottom-10 w-px bg-white/10 -ml-6"></div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-xl">
                                        🤖
                                    </div>
                                    <h4 className="text-xl font-bold">Android (Chrome)</h4>
                                </div>
                                <ol className="space-y-3 text-indigo-100 list-decimal pl-5">
                                    <li>Open Chrome and visit <span className="text-white font-mono bg-white/20 px-1 rounded">https://famio.us</span></li>
                                    <li>Tap the <strong className="text-white">three-dot menu (⋮)</strong> in top-right</li>
                                    <li>Tap <strong className="text-white">“Add to Home screen”</strong> or “Install app”</li>
                                    <li>Confirm by tapping Install</li>
                                </ol>
                                <p className="text-sm text-green-300 flex items-center gap-2 mt-4">
                                    <CheckCircle2 className="w-4 h-4" /> Installed as mobile app
                                </p>
                            </div>

                            {/* Desktop */}
                            <div className="space-y-4 relative">
                                <div className="hidden md:block absolute left-0 top-10 bottom-10 w-px bg-white/10 -ml-6"></div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-xl">
                                        💻
                                    </div>
                                    <h4 className="text-xl font-bold">Desktop</h4>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="font-semibold text-white mb-1">Chrome / Edge:</p>
                                        <ul className="text-indigo-100 list-disc pl-5 space-y-1">
                                            <li>Click the <strong className="text-white">Install (➕)</strong> icon in address bar</li>
                                            <li>OR: Menu (⋮) → Install Famio</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white mb-1">Safari (Mac):</p>
                                        <ul className="text-indigo-100 list-disc pl-5 space-y-1">
                                            <li>Drag site to Dock</li>
                                            <li>OR: File → Add to Dock</li>
                                        </ul>
                                    </div>
                                </div>
                                <p className="text-sm text-green-300 flex items-center gap-2 mt-4">
                                    <CheckCircle2 className="w-4 h-4" /> Launches in own window
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Features */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-4">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-600">AI-Powered Features</span>
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Intelligent Assistance</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Our AI helps you create better content and stay organized effortlessly.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                            <Sparkles className="w-12 h-12 text-blue-600 mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">AI Content Generation</h3>
                            <p className="text-gray-600 mb-4">
                                Struggling with writer's block? Our AI assists you in crafting meaningful posts and comments that resonate with your family.
                            </p>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Smart suggestions for posts</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Thoughtful comment recommendations</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Birthday message generator</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
                            <Award className="w-12 h-12 text-purple-600 mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Automated Celebrations</h3>
                            <p className="text-gray-600 mb-4">
                                Never miss a special moment. Our AI automatically celebrates family birthdays and milestones.
                            </p>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Automatic birthday posts</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Personalized festive messages</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Milestone reminders</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Features */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Complete Family Platform</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            All the tools your family needs in one secure, private space.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard
                            icon={<MessageCircle className="w-8 h-8 text-blue-600" />}
                            title="Posts & Feed"
                            description="Share updates, photos, and moments with your family. Comment and react with custom family-friendly reactions."
                        />
                        <FeatureCard
                            icon={<Calendar className="w-8 h-8 text-blue-600" />}
                            title="Events & Planning"
                            description="Organize family gatherings, track RSVPs, and never miss important dates with our event management system."
                        />
                        <FeatureCard
                            icon={<Sparkles className="w-8 h-8 text-blue-600" />}
                            title="AI Research Assistant"
                            description="Familiar ChatGPT-style interface designed for everyone—from Executives and Engineers to Medical Professionals, Students, Parents, and Kids. Multi-model AI supporting OpenAI, Claude, and Gemini with voice input and file upload capabilities."
                        />
                        <FeatureCard
                            icon={<Globe className="w-8 h-8 text-blue-600" />}
                            title="Live Streaming"
                            description="Start real-time video broadcasts to share special moments, announcements, or virtual family gatherings. Viewers can chat and react in real-time."
                        />
                        <FeatureCard
                            icon={<ImageIcon className="w-8 h-8 text-blue-600" />}
                            title="Stories"
                            description="Share ephemeral moments that disappear after 24 hours. Perfect for quick updates and daily highlights."
                        />
                        <FeatureCard
                            icon={<Users className="w-8 h-8 text-blue-600" />}
                            title="Groups"
                            description="Create sub-groups for different family branches, plan activities, and organize discussions."
                        />
                        <FeatureCard
                            icon={<Mail className="w-8 h-8 text-blue-600" />}
                            title="Messaging"
                            description="Private 1-on-1 and group chats with your members. Keep conversations organized and secure."
                        />
                        <FeatureCard
                            icon={<Award className="w-8 h-8 text-blue-600" />}
                            title="Gallery"
                            description="Organize and share family photos in beautiful galleries. Create albums for special occasions."
                        />
                    </div>
                </div>
            </section>

            {/* Security & Privacy */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <Shield className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Security & Privacy First</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Your family's data is protected with enterprise-grade security.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">End-to-End Encryption</h3>
                            <p className="text-gray-600">
                                All your data is encrypted and secure. Only your family can see your content.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Eye className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Privacy Controls</h3>
                            <p className="text-gray-600">
                                Advanced privacy settings let you control who sees what. Your content, your rules.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Admin Controls</h3>
                            <p className="text-gray-600">
                                Family admins can manage members, moderate content, and monitor platform activity.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Relationships Section */}
            <section className="py-20 bg-gradient-to-br from-indigo-900 to-blue-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <Globe className="w-16 h-16 text-blue-300 mx-auto mb-6" />
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">We Are One.</h2>
                        <p className="text-xl text-indigo-100 max-w-3xl mx-auto leading-relaxed">
                            Famio is built on the belief that family extends beyond bloodlines.
                            It's a sanctuary to grow meaningful connections with your chosen family—friends, companions, colleagues, and partners.
                        </p>
                    </div>
                </div>
            </section>

            {/* Location & Privacy Education */}
            <section className="py-20 bg-white border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="flex-1 space-y-8">
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full mb-4">
                                    <Lock className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-semibold text-green-700">Privacy First Design</span>
                                </div>
                                <h2 className="text-4xl font-bold text-gray-900 mb-4">Location Sharing on Your Terms</h2>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    We believe location data is sensitive. That's why on Famio, <strong>Location Sharing is OFF by default.</strong>
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <Zap className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900">Snapshot Only</h4>
                                        <p className="text-gray-600">
                                            "Drop My Location" captures a single snapshot only when you click the button. We never track you in the background.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900">Total Control</h4>
                                        <p className="text-gray-600">
                                            You must explicitly enable location features in your Settings. You can disable them at any time.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 bg-gray-50 rounded-3xl p-8 border border-gray-100">
                            <h3 className="text-2xl font-bold mb-6">Your Privacy Settings</h3>
                            <div className="space-y-4">
                                <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between opacity-75">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                            <Globe className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">Public Profile</div>
                                            <div className="text-xs text-gray-500">Visible to everyone</div>
                                        </div>
                                    </div>
                                    <div className="w-10 h-6 bg-gray-200 rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1"></div></div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border-blue-200 border-2 shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-bl-lg font-bold">NEW</div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                                <Zap className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">Location Features</div>
                                                <div className="text-xs text-gray-500">Enable "Drop My Location"</div>
                                            </div>
                                        </div>
                                        <div className="w-10 h-6 bg-blue-600 rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div></div>
                                    </div>
                                    <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded-lg">
                                        <strong>Status:</strong> Enabled. You can now attach location snapshots to your posts.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Ready to Bring Your Family Together?
                        </h2>
                        <p className="text-xl mb-8 text-blue-100">
                            Join thousands of families already connected on Famio.
                        </p>
                        <Link href="/signup">
                            <Button size="lg" className="h-16 px-12 text-lg bg-white text-blue-600 hover:bg-gray-100 font-bold shadow-xl">
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
                                <img src="/icons/icon-72x72.png" alt="Famio" className="w-6 h-6 rounded-lg" />
                                <div>
                                    <span className="font-bold text-gray-900 text-lg">Famio</span>
                                    <span className="text-gray-500 text-sm ml-2">by ChanceTEK</span>
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-gray-600 text-sm">
                                    © 2026 Famio by ChanceTEK. All Rights Reserved.
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

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4">{icon}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    )
}

function BenefitCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="bg-white/10 backdrop-blur-sm border border-white/10 p-6 rounded-xl text-center hover:bg-white/20 transition-colors">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-indigo-100">{desc}</p>
        </div>
    )
}
