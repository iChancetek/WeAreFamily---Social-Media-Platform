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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Famio - Connect with Your Family and Friends",
  description: "A private, AI-powered social platform for families. Share moments, plan events, and stay connected.",
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
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <LanguageProvider>
              <MessageNotificationProvider>

                {children}
                <Toaster />
                {/* <CallOverlay /> */}
              </MessageNotificationProvider>
            </LanguageProvider>
          </ThemeProvider>
          {/* <AIAssistant /> */}
        </body>
      </html>
    </AuthProvider>
  );
}
