import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-context";
import { AIAssistant } from "@/components/ai/ai-assistant";
import { CallOverlay } from "@/components/rtc/call-overlay";
import { MessageNotificationProvider } from "@/components/messages/message-notification-provider";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { PushNotificationManager } from "@/components/notifications/push-notification-manager";
import { NotificationPermissionPrompt } from "@/components/notifications/notification-permission-prompt";
import { SyncStatusIndicator } from "@/components/pwa/sync-status-indicator";
import { ActivityTracker } from "@/components/layout/activity-tracker";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Famio - Connect with Your Family and Friends",
  description: "A private, AI-powered social platform for families. Share moments, plan events, and stay connected.",

  // Open Graph for Social Sharing
  openGraph: {
    title: "Famio - Connect with Your Family and Friends",
    description: "A private, AI-powered social platform for families. Share moments, plan events, and stay connected.",
    url: "https://famio.us",
    siteName: "Famio",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://famio.us/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Famio Logo",
      }
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Famio - Connect with Your Family and Friends",
    description: "A private, AI-powered social platform for families. Share moments, plan events, and stay connected.",
    images: ["https://famio.us/icons/icon-512x512.png"],
    site: "@Famio",
  },

  // PWA Configuration
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Famio",
  },
  applicationName: "Famio",
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // iOS safe area support
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.variable} antialiased min-h-screen bg-background text-foreground font-sans`}
          suppressHydrationWarning
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <LanguageProvider>
              <MessageNotificationProvider>
                <ServiceWorkerRegister />
                <OfflineIndicator />
                <InstallPrompt />
                <PushNotificationManager />
                <NotificationPermissionPrompt />

                <SyncStatusIndicator />
                <ActivityTracker />
                {children}
                <Toaster />
                {/* <CallOverlay /> */}
                <AIAssistant />
              </MessageNotificationProvider>
            </LanguageProvider>
          </ThemeProvider>
        </body>
      </html>
    </AuthProvider>
  );
}
