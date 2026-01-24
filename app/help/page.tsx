import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Monitor, Apple, Chrome, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Help - PWA Installation Guide | Famio",
    description: "Learn how to install Famio as a Progressive Web App on iPhone, Android, and Desktop",
};

export default function HelpPage() {
    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <img src="/icons/icon-96x96.png" alt="Famio" className="w-16 h-16 rounded-2xl shadow-lg" />
                        <div className="text-left">
                            <h1 className="text-3xl font-bold tracking-tight">Famio.us Help Center</h1>
                            <p className="text-muted-foreground">Progressive Web App Installation Guide</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-600 text-white rounded-full p-3 flex-shrink-0">
                                🚀
                            </div>
                            <div className="text-left">
                                <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                                    Famio.us Is Now a Progressive Web App (PWA)!
                                </h2>
                                <p className="text-blue-800 dark:text-blue-200">
                                    We're excited to share that <strong>Famio.us</strong> has officially been converted into a Progressive Web App 🎉
                                </p>
                                <p className="text-blue-700 dark:text-blue-300 mt-2">
                                    This means you can now enjoy a faster, smoother, and app-like experience on your mobile device or desktop—without downloading anything from an app store.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* New PWA Features */}
                <Card className="border-purple-200 dark:border-purple-800">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                        <CardTitle className="flex items-center gap-2">
                            ✨ New PWA Features
                        </CardTitle>
                        <CardDescription>Even more powerful app-like capabilities</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                                        🔔
                                    </div>
                                    <h4 className="font-semibold">Push Notifications</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Get real-time alerts for messages, mentions, and events—even when the app is closed!
                                </p>
                            </div>

                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                                        📤
                                    </div>
                                    <h4 className="font-semibold">Share to Famio</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Share photos, links, and text directly to Famio from any app on your device.
                                </p>
                            </div>

                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-full">
                                        📶
                                    </div>
                                    <h4 className="font-semibold">Offline Sync</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Send messages and create posts offline—they'll sync automatically when you're back online.
                                </p>
                            </div>

                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
                                        ⚡
                                    </div>
                                    <h4 className="font-semibold">Quick Shortcuts</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Right-click the app icon for instant access to Messages, AI Chat, Events, and more!
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Benefits */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-600" />
                            What does this mean for you?
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">✓</span>
                                <span>App-like experience directly from your browser</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">✓</span>
                                <span>Faster load times & improved performance</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">✓</span>
                                <span>Works on iPhone, Android, and Desktop</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">✓</span>
                                <span>One-tap access from your home screen or desktop</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">✓</span>
                                <span>Always up to date—no manual updates needed</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Installation Instructions */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-center">📱 How to Add Famio.us to Your Device</h2>

                    {/* iPhone */}
                    <Card className="border-blue-200 dark:border-blue-800">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                            <CardTitle className="flex items-center gap-2">
                                <Apple className="w-6 h-6" />
                                On iPhone (Safari)
                            </CardTitle>
                            <CardDescription>Install Famio on your iOS device</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ol className="space-y-3 list-decimal list-inside">
                                <li className="pl-2">
                                    Open Safari and go to 👉 <Link href="https://Famio.us" className="text-blue-600 hover:underline font-semibold">https://Famio.us</Link>
                                </li>
                                <li className="pl-2">
                                    Tap the <strong>Share</strong> icon (square with an arrow ↑) at the bottom of the screen
                                </li>
                                <li className="pl-2">
                                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                                </li>
                                <li className="pl-2">
                                    Name it <strong>Famio</strong> (or keep the default)
                                </li>
                                <li className="pl-2">
                                    Tap <strong>Add</strong>
                                </li>
                            </ol>
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-green-800 dark:text-green-200 font-medium">
                                    ✅ Famio.us will now appear on your home screen like a native app.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Android */}
                    <Card className="border-green-200 dark:border-green-800">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                            <CardTitle className="flex items-center gap-2">
                                <Chrome className="w-6 h-6" />
                                On Android (Chrome)
                            </CardTitle>
                            <CardDescription>Install Famio on your Android device</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ol className="space-y-3 list-decimal list-inside">
                                <li className="pl-2">
                                    Open Chrome and visit 👉 <Link href="https://Famio.us" className="text-blue-600 hover:underline font-semibold">https://Famio.us</Link>
                                </li>
                                <li className="pl-2">
                                    Tap the <strong>three-dot menu (⋮)</strong> in the top-right corner
                                </li>
                                <li className="pl-2">
                                    Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>
                                </li>
                                <li className="pl-2">
                                    Confirm by tapping <strong>Add / Install</strong>
                                </li>
                            </ol>
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-green-800 dark:text-green-200 font-medium">
                                    ✅ Famio.us is now installed and ready to use like a mobile app.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Desktop */}
                    <Card className="border-purple-200 dark:border-purple-800">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                            <CardTitle className="flex items-center gap-2">
                                <Monitor className="w-6 h-6" />
                                On Desktop (Chrome, Edge, or Safari)
                            </CardTitle>
                            <CardDescription>Install Famio on your computer</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="mb-2">
                                        Visit 👉 <Link href="https://Famio.us" className="text-blue-600 hover:underline font-semibold">https://Famio.us</Link>
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">In Chrome or Edge:</h4>
                                    <ul className="space-y-2 ml-4">
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-600 mt-1">•</span>
                                            <span>Click the <strong>Install (➕ or computer icon)</strong> in the address bar</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-600 mt-1">•</span>
                                            <span>Or go to the <strong>three-dot menu → Install Famio</strong></span>
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">In Safari (Mac):</h4>
                                    <ul className="space-y-2 ml-4">
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-600 mt-1">•</span>
                                            <span>Drag the site to your Dock</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-600 mt-1">•</span>
                                            <span>Or use <strong>File → Add to Dock</strong> (if available)</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-green-800 dark:text-green-200 font-medium">
                                    ✅ Famio.us will launch in its own window for a clean, app-style experience.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer */}
                <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                            <p className="text-muted-foreground">Warm regards,</p>
                            <p className="font-semibold text-lg">Chancellor Minus</p>
                            <p className="text-sm text-muted-foreground">Founder/CEO @ ChanceTEK</p>
                            <div className="flex items-center justify-center gap-4 mt-4">
                                <Link href="https://iChanceTEK.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                    iChanceTEK.com
                                </Link>
                                <span className="text-muted-foreground">•</span>
                                <Link href="https://Famio.us" className="text-blue-600 hover:underline text-sm">
                                    Famio.us
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Back Button */}
                <div className="text-center pb-8">
                    <Link href="/">
                        <Button variant="outline" size="lg">
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </MainLayout>
    );
}
