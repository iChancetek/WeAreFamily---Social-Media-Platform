import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-context";
import { AIAssistant } from "@/components/ai/ai-assistant";
import { CallOverlay } from "@/components/rtc/call-overlay";
import { MessageNotificationProvider } from "@/components/messages/message-notification-provider";

const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Famio - Connect with Your Family and Friends",
  description: "A private, AI-powered social platform for families. Share moments, plan events, and stay connected.",
};

function DebugClicker() {
  const { toast } = require("sonner");
  const { useEffect } = require("react");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      console.log("GLOBAL CLICK:", target.tagName, target.className);
      // toast.info(`Clicked: ${target.tagName} (See Console)`); 
    };
    window.addEventListener("click", handler, { capture: true }); // Capture phase to catch blocked clicks
    return () => window.removeEventListener("click", handler, { capture: true });
  }, []);

  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${roboto.variable} antialiased min-h-screen bg-background text-foreground font-sans`}
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
                <DebugClicker />
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
