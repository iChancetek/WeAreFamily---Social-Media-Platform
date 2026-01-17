import { MainLayout } from "@/components/layout/main-layout";
import { Separator } from "@/components/ui/separator";
import { Shield, Lock, Eye, Server, RefreshCw, FileText, Globe, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
    return (
        <MainLayout className="max-w-6xl mx-auto">
            <div className="max-w-4xl mx-auto pb-16 pt-8">

                {/* Header Section */}
                <div className="mb-8 space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Privacy & Security
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Trust is the foundation of every meaningful digital experience.
                    </p>
                </div>

                {/* Executive Trust Message - CANONICAL */}
                <div className="bg-card/50 backdrop-blur-md border border-primary/20 rounded-xl p-8 mb-12 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <div className="relative z-10">
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-primary" />
                            Executive Trust Message
                        </h2>

                        <div className="space-y-6 text-card-foreground leading-relaxed">
                            <p>
                                At <span className="font-bold text-primary">ChanceTEK</span>, we believe trust is the foundation of every meaningful digital experience.
                            </p>
                            <p>
                                <span className="font-bold">Famio.us</span> is an AI-powered social media platform built to bring people closer—securely, intelligently, and responsibly. We take the privacy, security, and protection of our users’ data extremely seriously, and we design every layer of Famio with that responsibility in mind.
                            </p>
                            <p>
                                Famio.us is built on top of <span className="font-semibold">Google’s secure cloud infrastructure</span>, leveraging enterprise-grade security, reliability, and compliance standards trusted by organizations around the world. From data encryption to access controls, our systems are engineered to safeguard your information while delivering a powerful, intelligent, and seamless social experience.
                            </p>
                            <p className="text-xl font-medium italic text-primary/90 mt-4">
                                "Your data belongs to you. Our role is to protect it, respect it, and use it only to improve your experience—never to compromise it."
                            </p>

                            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border/50">
                                <div>
                                    <p className="font-bold">Chancellor Minus</p>
                                    <p className="text-sm text-muted-foreground">Founder & CEO @ ChanceTEK</p>
                                    <Link href="https://iChanceTEK.com" className="text-xs text-primary hover:underline" target="_blank">
                                        iChanceTEK.com
                                    </Link>
                                </div>
                                <div className="text-right">
                                    <Link href="https://Famio.us" className="text-sm font-semibold hover:text-primary transition-colors">
                                        Famio.us
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="my-12" />

                {/* Core Privacy Sections */}
                <div className="space-y-16">

                    {/* 1. Privacy Commitment */}
                    <section>
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <Lock className="w-6 h-6 text-blue-500" />
                            1. Privacy Commitment
                        </h3>
                        <ul className="grid gap-4 md:grid-cols-2">
                            {[
                                "Privacy-first by design",
                                "Data is never sold",
                                "Transparency is a core value",
                                "Users retain ownership of their data"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* 2. Infrastructure & Security */}
                    <section>
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <Server className="w-6 h-6 text-purple-500" />
                            2. Infrastructure & Security
                        </h3>
                        <div className="bg-slate-950 text-slate-100 p-6 rounded-xl border border-slate-800">
                            <p className="mb-4">
                                Famio.us is essentially built on <span className="text-blue-400 font-semibold">Google Cloud Platform (GCP)</span>.
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    "Enterprise-grade protections",
                                    "Encryption in transit (TLS / HTTPS)",
                                    "Encryption at rest",
                                    "Secure authentication",
                                    "Role-based access controls",
                                    "Continuous monitoring",
                                    "High availability and redundancy"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <span className="text-sm text-slate-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* 3. Data Collection */}
                    <section>
                        <h3 className="text-2xl font-bold mb-4">3. Data Collection Philosophy</h3>
                        <p className="text-muted-foreground mb-4">
                            We adhere to a strict philosophy of minimal data collection. We only collect what is necessary to operate effectively and improve your experience.
                        </p>
                        <div className="pl-4 border-l-2 border-primary/30 space-y-2 text-sm">
                            <p>• <strong>Minimal Collection:</strong> We do not hoard data.</p>
                            <p>• <strong>Purpose-Limited:</strong> Data is used strictly for its intended purpose.</p>
                            <p>• <strong>Retention:</strong> We minimize retention periods wherever possible.</p>
                        </div>
                    </section>

                    {/* 4. AI & Responsible Data */}
                    <section>
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <RefreshCw className="w-6 h-6 text-teal-500" />
                            4. AI & Responsible Data Use
                        </h3>
                        <div className="bg-teal-500/10 border border-teal-500/20 p-6 rounded-xl">
                            <p className="mb-4 font-medium text-teal-700 dark:text-teal-300">
                                All AI systems on Famio are Privacy-aware, Secure-by-design, and Purpose-driven.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex gap-3">
                                    <Shield className="w-5 h-5 text-teal-500" />
                                    <span>No sensitive user data is used to train public models.</span>
                                </li>
                                <li className="flex gap-3">
                                    <Eye className="w-5 h-5 text-teal-500" />
                                    <span>AI operates only within authorized scopes.</span>
                                </li>
                                <li className="flex gap-3">
                                    <UsersIcon className="w-5 h-5 text-teal-500" />
                                    <span>AI enhances human connection—never exploitation.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* 5. User Control */}
                    <section>
                        <h3 className="text-2xl font-bold mb-4">5. User Control & Transparency</h3>
                        <p className="mb-4">You have full control over your digital footprint on Famio.</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {["Control what you share", "Edit or delete content", "Manage privacy settings", "Request account deletion", "Request data access", "Request data removal"].map((action, i) => (
                                <div key={i} className="p-3 bg-secondary/30 rounded text-center text-sm font-medium hover:bg-secondary/50 transition-colors cursor-default">
                                    {action}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 6. GDPR */}
                    <section>
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <Globe className="w-6 h-6 text-indigo-500" />
                            6. GDPR Compliance (EU / EEA)
                        </h3>
                        <p className="mb-4">Famio.us explicitly complies with the General Data Protection Regulation (GDPR).</p>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p><strong>Lawful Basis:</strong> We process data based on consent, contract necessity, and legitimate interests.</p>
                            <p><strong>Your Rights:</strong> Access, Rectification, Erasure (&quot;Right to be Forgotten&quot;), Portability, Restriction, and Objection.</p>
                            <p className="mt-2 text-primary">To exercise these rights, please contact us via the platform settings.</p>
                        </div>
                    </section>

                    {/* 7. CCPA */}
                    <section>
                        <h3 className="text-2xl font-bold mb-4">7. CCPA / CPRA Compliance (California)</h3>
                        <p className="mb-2">We respect the rights of California residents.</p>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
                            <li>Right to know what data is collected.</li>
                            <li>Right to access your data.</li>
                            <li>Right to delete your data.</li>
                            <li>Right to non-discrimination.</li>
                            <li className="font-bold text-foreground mt-2">We do not sell your personal data.</li>
                        </ul>
                    </section>

                    {/* 8. Third Party */}
                    <section>
                        <h3 className="text-2xl font-bold mb-4">8. Third-Party Services</h3>
                        <p className="text-muted-foreground">
                            We partner only with vetted, trusted providers who agree to our contractual security obligations. Data sharing is minimal and authorized only when necessary for service delivery.
                        </p>
                    </section>

                    {/* 9. Childrens Privacy */}
                    <section>
                        <h3 className="text-2xl font-bold mb-4">9. Children’s Privacy</h3>
                        <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/10">
                            <p className="font-medium">
                                Famio.us is not intended for children under 13.
                            </p>
                            <p className="text-sm mt-1 text-muted-foreground">
                                We do not intentionally collect data from children. If discovered, such data will be promptly removed.
                            </p>
                        </div>
                    </section>

                    {/* 10. Continuous Security */}
                    <section>
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <RefreshCw className="w-6 h-6 text-green-500" />
                            10. Continuous Security Commitment
                        </h3>
                        <p className="text-muted-foreground">
                            Security is not a destination, but a journey. We are committed to ongoing monitoring, regular reviews, proactive threat mitigation, and a continuous improvement mindset.
                        </p>
                    </section>

                </div>

                <footer className="mt-20 pt-10 border-t text-center space-y-4">
                    <div className="flex justify-center gap-6 text-sm font-medium">
                        <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-primary transition-colors text-muted-foreground">Terms of Service</Link>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Built with privacy and security at the core.</p>
                        <p className="text-xs text-muted-foreground mt-1">© ChanceTEK. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </MainLayout>
    );
}

// User Icon helper
function UsersIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
