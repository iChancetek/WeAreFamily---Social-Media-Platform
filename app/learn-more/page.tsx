import Link from "next/link"
import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
    Heart, 
    Shield, 
    Users, 
    Globe, 
    MessageCircle, 
    Calendar, 
    Image as ImageIcon, 
    Sparkles, 
    Mail, 
    Lock, 
    Eye, 
    Zap, 
    Award, 
    CheckCircle2, 
    Monitor,
    Mic,
    Volume2,
    Radio,
    RadioTower,
    Bot,
    Brain,
    Cpu,
    Workflow,
    HardDrive,
    Database,
    ShieldCheck,
    LockIcon,
    Flame,
    Music,
    Video,
    Share2,
    Download,
    GitBranch,
    Sliders,
    Search,
    BookOpen,
    Code2,
    Briefcase,
    Stethoscope,
    GraduationCap,
    Calculator,
    TrendingUp,
    Rocket,
    Megaphone,
    Palette,
    Terminal,
    Key,
    CheckSquare,
    RotateCcw,
    Layers,
    Binary
} from "lucide-react"

export default function LearnMorePage() {
    return (
        <div className="min-h-screen bg-white text-gray-900 selection:bg-blue-600 selection:text-white">
            {/* Navigation */}
            <nav className="border-b border-gray-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <Link href="/" className="flex items-center gap-4 group">
                            <img src="/icons/famio-logo.png" className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" alt="famio" />
                            <div>
                                <div className="font-bold text-3xl text-gray-900 tracking-tight">famio</div>
                                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">by ChanceTEK</div>
                            </div>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Link href="/">
                                <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium rounded-full px-5">
                                    Back to Home
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-full px-6 shadow-md shadow-blue-500/20">
                                    Get Started Free
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-gradient-to-b from-blue-50/60 via-indigo-50/30 to-white py-20 md:py-28 border-b border-gray-100 relative overflow-hidden">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-full mb-6 shadow-sm">
                        <Sparkles className="w-5 h-5 text-blue-700 animate-pulse" />
                        <span className="text-sm font-bold text-blue-900">Famio AI OS v2 — Autonomous Multi-Agent Intelligence Platform</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight leading-[1.1]">
                        The Ultimate Family Network & <br />
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Agentic Intelligence Ecosystem</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed font-normal">
                        famio combines a private, secure social platform with <span className="font-semibold text-gray-900">25 specialized AI agents</span> powered by <span className="font-semibold text-gray-900">GPT-5.6 Luna</span>, <span className="font-semibold text-gray-900">OpenAI Agents SDK</span>, <span className="font-semibold text-gray-900">LangGraph</span>, <span className="font-semibold text-gray-900">MCP</span>, <span className="font-semibold text-gray-900">Voice Control</span>, and <span className="font-semibold text-gray-900">PWA Native Performance</span>.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/signup">
                            <Button size="lg" className="h-14 px-8 text-base bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg shadow-blue-600/30">
                                Join famio Today <Sparkles className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Link href="/chat">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-gray-300 text-gray-800 hover:bg-gray-100 font-bold rounded-full">
                                Explore AI Assistant <Bot className="ml-2 w-5 h-5 text-blue-600" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* AUDIO & VOICE AI CO-PILOT SECTION */}
            <section className="py-20 bg-gradient-to-br from-gray-900 via-indigo-950 to-black text-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-bold uppercase tracking-wider">
                                <Mic className="w-4 h-4 text-blue-400 animate-pulse" /> Voice & Audio Intelligence
                            </div>
                            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                                Hands-Free Voice Control & Audio AI Messaging
                            </h2>
                            <p className="text-lg text-indigo-100 leading-relaxed">
                                Famio features full voice recognition and neural vocal synthesis. Speak directly to famio AI to create posts, send voice messages, generate birthday greetings, or consult specialized AI personas hands-free.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                                    <Mic className="w-6 h-6 text-blue-400 mb-2" />
                                    <h4 className="font-bold text-white mb-1">Whisper Voice Input</h4>
                                    <p className="text-xs text-indigo-200">High-accuracy speech-to-text dictation for posts, comments, and AI queries.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                                    <Volume2 className="w-6 h-6 text-purple-400 mb-2" />
                                    <h4 className="font-bold text-white mb-1">Neural Speech Feedback</h4>
                                    <p className="text-xs text-indigo-200">Natural voice synthesis answers your AI questions audibly.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                                    <Radio className="w-6 h-6 text-green-400 mb-2" />
                                    <h4 className="font-bold text-white mb-1">Voice Companion Chats</h4>
                                    <p className="text-xs text-indigo-200">Real-time voice companion conversations for family advice and learning.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                                    <Music className="w-6 h-6 text-pink-400 mb-2" />
                                    <h4 className="font-bold text-white mb-1">Audio Post & Player</h4>
                                    <p className="text-xs text-indigo-200">Share family voice notes, songs, and podcast clips seamlessly.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md space-y-6">
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <span className="font-mono text-xs text-blue-400 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping"></span> Live Audio Co-Pilot
                                </span>
                                <span className="text-xs text-gray-400 font-semibold">GPT-5.6 Luna Active</span>
                            </div>
                            <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span>User Vocal Prompt:</span>
                                    <span className="text-blue-400">0:04</span>
                                </div>
                                <p className="text-sm font-medium text-white italic">
                                    "Famio AI, draft a sweet birthday post for Grandma and schedule an event for Saturday at 3 PM."
                                </p>
                            </div>
                            <div className="p-5 rounded-2xl bg-blue-600/20 border border-blue-500/30 space-y-3">
                                <div className="flex items-center justify-between text-xs text-blue-300">
                                    <span className="font-bold flex items-center gap-1.5"><Bot className="w-4 h-4" /> Agent Response:</span>
                                    <span className="text-green-400">Verified</span>
                                </div>
                                <p className="text-sm text-indigo-100">
                                    Draft created! I've formatted the birthday message and prepared the event invitation. Would you like me to publish it to the Family Group?
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAMIO AI OS v2 — 25 SPECIALIZED AGENTS */}
            <section className="py-20 bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                            <Brain className="w-4 h-4 text-blue-600" /> Multi-Agent Persona Directory
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            25 Specialized AI Agent Personas
                        </h2>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            Every request is analyzed by the Master Planner Agent and routed to domain-expert subagents built with the OpenAI Agents SDK and LangGraph.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { title: "Master Planner Agent", role: "Orchestration & Task Decomposition", icon: Workflow, desc: "Analyzes incoming prompts, decomposes multi-step goals, and coordinates agent handoffs." },
                            { title: "Research Agent", role: "Multi-Domain Evidence Synthesis", icon: Search, desc: "Gathers evidence from web sources, PubMed, and documentation with citation scoring." },
                            { title: "Writing Agent", role: "Publication-Ready Content", icon: BookOpen, desc: "Crafts family updates, speeches, essays, group announcements, and articles." },
                            { title: "Coding Agent", role: "Production Software Development", icon: Code2, desc: "Writes clean code across TypeScript, Python, Go, Rust, SQL, and C++." },
                            { title: "Data Science Agent", role: "Analytics & ML Workflows", icon: Binary, desc: "Performs statistical analysis, Pandas data cleaning, and PyTorch model design." },
                            { title: "Finance Agent", role: "Valuation & Financial Modeling", icon: TrendingUp, desc: "Provides DCF modeling, stock analysis, budgeting, and portfolio risk evaluation." },
                            { title: "Legal Agent", role: "Compliance & Regulatory Review", icon: ShieldCheck, desc: "Breaks down contract clauses, privacy regulations, and compliance frameworks." },
                            { title: "Medical Research Agent", role: "PubMed & Clinical Literature", icon: Stethoscope, desc: "Synthesizes medical studies, clinical trials, and healthcare research papers." },
                            { title: "Education Agent", role: "Custom Tutoring & Lesson Plans", icon: GraduationCap, desc: "Generates custom flashcards, step-by-step tutoring, and homework assistance." },
                            { title: "Math Agent", role: "Calculus & Symbolic Proofs", icon: Calculator, desc: "Solves linear algebra, calculus, statistics, and symbolic mathematical proofs." },
                            { title: "Business Strategy Agent", role: "SWOT & GTM Frameworks", icon: Briefcase, desc: "Formulates competitive strategies, market positioning, and growth funnels." },
                            { title: "Startup Advisor Agent", role: "Pitch Decks & Unit Economics", icon: Rocket, desc: "Builds investor pitch decks, MVP roadmaps, and unit economic models." },
                            { title: "Marketing Agent", role: "SEO & Growth Campaign Design", icon: Megaphone, desc: "Creates SEO/SEM funnels, social media campaigns, and brand messaging." },
                            { title: "UX/UI Design Agent", role: "Design Systems & Accessibility", icon: Palette, desc: "Audits user interfaces, design systems, wireframes, and WCAG accessibility." },
                            { title: "DevOps Agent", role: "CI/CD & Cloud Infrastructure", icon: Terminal, desc: "Manages Docker containers, Kubernetes manifests, Terraform, and CI/CD pipelines." },
                            { title: "AI Engineer Agent", role: "Agents SDK & RAG Pipelines", icon: Cpu, desc: "Builds custom OpenAI Agent SDK workflows, RAG pipelines, and MCP servers." },
                            { title: "Security Agent", role: "Threat Audits & OWASP Protocols", icon: Key, desc: "Conducts OWASP vulnerability audits, encryption checks, and auth protocols." },
                            { title: "QA Agent", role: "Test Suites & Edge Validation", icon: CheckSquare, desc: "Generates automated unit/E2E test suites and edge case regression plans." },
                            { title: "Reflection Agent", role: "Hallucination & Logic Audit", icon: RotateCcw, desc: "Critiques agent outputs for reasoning flaws, hallucinations, and precision gaps." },
                            { title: "Verification Agent", role: "Multi-Source Claim Audit", icon: CheckCircle2, desc: "Cross-references claims against trusted databases to ensure factual integrity." },
                            { title: "Memory Agent", role: "Pinecone Vector Memory", icon: HardDrive, desc: "Manages L3 long-term vector embeddings in Pinecone DB (1536-dim)." },
                            { title: "Tool Selection Agent", role: "MCP Tool Parameterization", icon: Sliders, desc: "Selects optimal MCP server endpoints and formats API parameters per task." },
                            { title: "Automation Agent", role: "Multi-Step Scripting", icon: Zap, desc: "Constructs automated workflow triggers across external webhooks and services." },
                            { title: "Knowledge Graph Agent", role: "Entity Relationship Mapping", icon: GitBranch, desc: "Links relationships between family members, projects, events, and documents." },
                            { title: "Multi-Agent Debate Agent", role: "Structured Agent Debates", icon: Users, desc: "Orchestrates debates between opposing agent personas to refine conclusions." }
                        ].map((agent, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-blue-500/50 hover:shadow-lg transition-all group">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <agent.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{agent.title}</h3>
                                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">{agent.role}</p>
                                <p className="text-xs text-gray-600 leading-relaxed">{agent.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AGENT GUARDRAILS & SECURITY POLICIES */}
            <section className="py-20 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-10 md:p-14 text-white shadow-xl">
                        <div className="text-center mb-12">
                            <ShieldCheck className="w-14 h-14 text-green-400 mx-auto mb-4" />
                            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Agent Guardrails & Security Policies</h2>
                            <p className="text-indigo-200 max-w-2xl mx-auto text-sm">
                                Strict safety boundaries enforced across all 25 agent personas to protect family privacy and data integrity.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <Users className="w-8 h-8 text-blue-400 mb-3" />
                                <h4 className="font-bold text-lg mb-2">Group Posting Assistance</h4>
                                <p className="text-xs text-gray-300 leading-relaxed">Agents can read, format, and draft group content when requested by family members.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <LockIcon className="w-8 h-8 text-yellow-400 mb-3" />
                                <h4 className="font-bold text-lg mb-2">Mandatory Confirmation</h4>
                                <p className="text-xs text-gray-300 leading-relaxed">Agents MUST receive explicit user approval before publishing any post or comment.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <Shield className="w-8 h-8 text-red-400 mb-3" />
                                <h4 className="font-bold text-lg mb-2">NO Deletion Rights</h4>
                                <p className="text-xs text-gray-300 leading-relaxed">NO agent can delete posts, comments, media, or groups on famio under any circumstances.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <Database className="w-8 h-8 text-green-400 mb-3" />
                                <h4 className="font-bold text-lg mb-2">NO Database Deletion</h4>
                                <p className="text-xs text-gray-300 leading-relaxed">Agents have zero database administrative or collection wipe privileges in Firestore.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* THREE-TIER MEMORY & CORE FRAMEWORK */}
            <section className="py-20 bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200 mb-3">Core Agent Architecture</Badge>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            Three-Tier Memory Architecture
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Balancing instant session reactivity with long-term semantic retrieval across conversations.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">L1</div>
                            <h3 className="text-2xl font-bold text-gray-900">L1 Working Memory</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">Active task context managed in-memory during active OpenAI Agents SDK chat sessions for multi-turn conversational dialog.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl">L2</div>
                            <h3 className="text-2xl font-bold text-gray-900">L2 High-Speed Cache</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">Redis database caching layer for low-latency session state, prompt caching, and fast intermediate lookup performance.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">L3</div>
                            <h3 className="text-2xl font-bold text-gray-900">L3 Long-Term Memory</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">Pinecone Vector DB for dense semantic retrieval using 1536-dimensional <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">text-embedding-3-small</span> embeddings across historic chats.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* PWA ANNOUNCEMENT & INSTALLATION SECTION */}
            <section className="py-20 bg-indigo-600 text-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full mb-6">
                            <span className="animate-pulse w-2.5 h-2.5 bg-green-400 rounded-full"></span>
                            <span className="text-sm font-semibold text-white">Version 2.0 Progressive Web App</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
                            🚀 famio is Now a Progressive Web App (PWA)!
                        </h2>
                        <p className="text-xl text-indigo-100 max-w-3xl mx-auto leading-relaxed">
                            Enjoy a faster, smoother, native app-like experience on your mobile device or desktop—without downloading anything from an app store.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        <BenefitCard icon={<Zap className="w-6 h-6 text-yellow-400" />} title="Faster Performance" desc="Instant load times & smooth interactions" />
                        <BenefitCard icon={<Globe className="w-6 h-6 text-blue-400" />} title="Standalone Window" desc="Full-screen borderless app experience" />
                        <BenefitCard icon={<Monitor className="w-6 h-6 text-purple-400" />} title="Cross-Platform" desc="Runs on iPhone, Android & Desktop" />
                        <BenefitCard icon={<CheckCircle2 className="w-6 h-6 text-green-400" />} title="Offline Sync" desc="Service Worker background synchronization" />
                    </div>

                    {/* How to Install */}
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/10">
                        <h3 className="text-3xl font-bold text-center mb-12">📱 How to Add famio to Your Device</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-xl">🍎</div>
                                    <h4 className="text-xl font-bold">iPhone (Safari)</h4>
                                </div>
                                <ol className="space-y-3 text-indigo-100 list-decimal pl-5 text-sm">
                                    <li>Open Safari and go to <span className="text-white font-mono bg-white/20 px-1 rounded">https://famio.us</span></li>
                                    <li>Tap the <strong className="text-white">Share icon</strong> (square with arrow ↑)</li>
                                    <li>Tap <strong className="text-white">“Add to Home Screen”</strong></li>
                                    <li>Name it <strong>famio</strong> and tap Add</li>
                                </ol>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-xl">🤖</div>
                                    <h4 className="text-xl font-bold">Android (Chrome)</h4>
                                </div>
                                <ol className="space-y-3 text-indigo-100 list-decimal pl-5 text-sm">
                                    <li>Open Chrome and visit <span className="text-white font-mono bg-white/20 px-1 rounded">https://famio.us</span></li>
                                    <li>Tap the <strong className="text-white">three-dot menu (⋮)</strong></li>
                                    <li>Tap <strong className="text-white">“Add to Home screen”</strong> or “Install app”</li>
                                    <li>Confirm by tapping Install</li>
                                </ol>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-xl">💻</div>
                                    <h4 className="text-xl font-bold">Desktop</h4>
                                </div>
                                <ol className="space-y-3 text-indigo-100 list-decimal pl-5 text-sm">
                                    <li>Click the <strong className="text-white">Install (➕)</strong> icon in URL bar</li>
                                    <li>OR select Chrome Menu (⋮) → Install famio</li>
                                    <li>Launch directly from Desktop or Dock</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FULL SOCIAL PLATFORM SUITE */}
            <section className="py-20 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Complete Family Social Suite</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            All the private sharing, live streaming, event planning, and connection tools your family needs.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard
                            icon={<Flame className="w-8 h-8 text-orange-600" />}
                            title="Trending & Discovery"
                            description="Surfaces engaging posts using ranking metrics that weigh views, likes, comments, and shares to highlight top family moments."
                        />
                        <FeatureCard
                            icon={<MessageCircle className="w-8 h-8 text-blue-600" />}
                            title="Posts & Interactive Feed"
                            description="Share updates, photos, videos, and audio notes with intelligent sorting that prioritizes high-engagement content."
                        />
                        <FeatureCard
                            icon={<Calendar className="w-8 h-8 text-purple-600" />}
                            title="Events & RSVP Planning"
                            description="Organize family reunions, birthdays, track RSVPs, set reminders, and sync events with family calendars."
                        />
                        <FeatureCard
                            icon={<Video className="w-8 h-8 text-red-600" />}
                            title="Live Video Streaming"
                            description="Broadcast real-time video feeds for family announcements or virtual gatherings with live chat and reaction badges."
                        />
                        <FeatureCard
                            icon={<Sparkles className="w-8 h-8 text-pink-600" />}
                            title="24-Hour Ephemeral Stories"
                            description="Share quick daily highlights and photos that automatically expire after 24 hours."
                        />
                        <FeatureCard
                            icon={<Users className="w-8 h-8 text-indigo-600" />}
                            title="Sub-Groups & Branches"
                            description="Create targeted groups for different family branches, project teams, or shared hobbies."
                        />
                        <FeatureCard
                            icon={<Mail className="w-8 h-8 text-teal-600" />}
                            title="Encrypted Direct Messaging"
                            description="Private 1-on-1 and group messaging with photo/audio attachments and real-time typing indicators."
                        />
                        <FeatureCard
                            icon={<ImageIcon className="w-8 h-8 text-green-600" />}
                            title="Family Photo Gallery"
                            description="High-resolution cloud storage for organizing family albums, vacation memories, and historical photos."
                        />
                    </div>
                </div>
            </section>

            {/* LOCATION & PRIVACY GUARANTEE */}
            <section className="py-20 bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-12 items-center">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                                <Lock className="w-4 h-4 text-green-600" /> Privacy First Architecture
                            </div>
                            <h2 className="text-4xl font-extrabold text-gray-900">Location Sharing on Your Terms</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We believe location data is sensitive. On famio, <strong>Location Sharing is OFF by default.</strong>
                            </p>
                            <div className="space-y-4 text-sm text-gray-700">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                                    <span><strong>Snapshot Only:</strong> "Drop My Location" captures a single snapshot only when clicked. No background tracking.</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                                    <span><strong>Explicit Opt-In:</strong> Location features must be manually enabled in your Settings and can be turned off anytime.</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                            <h3 className="font-bold text-xl text-gray-900">Privacy & Safety Controls</h3>
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-sm">Location Snapshot Button</div>
                                    <div className="text-xs text-gray-500">Off by default</div>
                                </div>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">User Controlled</Badge>
                            </div>
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-sm">Family Only Privacy</div>
                                    <div className="text-xs text-gray-500">No public search indexing</div>
                                </div>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Encrypted</Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-center">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Ready to Connect Your Family?</h2>
                    <p className="text-xl mb-10 text-blue-100 font-normal">
                        Experience famio AI OS v2 with 25 AI subagent personas, Whisper vocal controls, and Progressive Web App performance.
                    </p>
                    <Link href="/signup">
                        <Button size="lg" className="h-16 px-12 text-lg bg-white text-blue-700 hover:bg-gray-100 font-bold rounded-full shadow-2xl">
                            Get Started Free
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <Link href="/" className="flex items-center gap-4">
                            <img src="/icons/famio-logo.png" className="w-14 h-14 rounded-2xl object-cover shadow-sm" alt="famio" />
                            <div>
                                <span className="font-bold text-2xl tracking-tight text-gray-900">famio</span>
                                <span className="text-xs text-gray-500 block font-medium">by ChanceTEK</span>
                            </div>
                        </Link>
                        <div className="text-center md:text-right space-y-1">
                            <p className="text-sm font-semibold text-gray-800">
                                Developed by Chancellor Minus @ ChanceTEK | Founder & CEO
                            </p>
                            <p className="text-xs text-gray-500">
                                © 2026 famio by ChanceTEK LLC | iChanceTEK. All Rights Reserved.
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
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="mb-4">{icon}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
        </div>
    )
}

function BenefitCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="bg-white/10 backdrop-blur-sm border border-white/10 p-6 rounded-2xl text-center hover:bg-white/20 transition-colors">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
            <p className="text-xs text-indigo-100">{desc}</p>
        </div>
    )
}
