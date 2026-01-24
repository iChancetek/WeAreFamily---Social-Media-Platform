# Famio.us Progressive Web App (PWA) Conversion — Implementation Plan

## Executive Summary

This plan transforms **Famio.us** into a production-ready Progressive Web App (PWA) while maintaining:
- **Zero changes** to Firebase Authentication, Firestore, Storage, or Functions
- **100% data preservation** — no user migrations, schema changes, or re-indexing
- **Design freeze** — no layout, spacing, typography, or component modifications
- **Single codebase** — Next.js + React with PWA capabilities layered on top

The conversion will enable:
- ✅ Installation on iOS, Android, and Desktop
- ✅ Offline-first architecture with intelligent caching
- ✅ Native app-like experience without App Store dependency
- ✅ Enhanced performance and engagement metrics
- ✅ Cross-platform consistency (Chrome, Safari, Firefox, Edge)

---

## Current Architecture Analysis

### Technology Stack (Verified)
- **Framework**: Next.js 16.1.1 with App Router
- **Frontend**: React 19.2.3
- **Styling**: Tailwind CSS + Custom CSS variables
- **Backend**: Firebase full-stack environment
  - Firebase Authentication (cookie-based session)
  - Firestore Database
  - Firebase Storage
  - Firebase Admin SDK (server-side)
  - Firebase Functions (optional)
- **Hosting**: Firebase App Hosting (configured in `apphosting.yaml`)
- **Build**: Standalone output mode

### Critical Constraints Identified
1. **Auth System**: Cookie-based authentication via `session_uid` cookie
2. **Protected Routes**: Middleware enforces auth on `/family`, `/messages`, `/events`, etc.
3. **Server Components**: Heavy use of Next.js Server Actions
4. **Real-time Features**: Message notifications, live chat, AI assistant
5. **Media Handling**: Firebase Storage for uploads, next/image for optimization

---

## User Review Required

> [!WARNING]
> **Breaking Change Risk — Service Worker Scope**
> 
> Service workers can potentially intercept authentication requests. Our implementation will explicitly exclude `/api/auth/*` routes from service worker interception to prevent session token corruption. This is non-negotiable for Firebase Auth compatibility.

> [!IMPORTANT]
> **iOS Push Notification Limitation**
> 
> Safari on iOS does **not support** Web Push Notifications API. Users on iPhone/iPad will not receive push notifications unless Apple enables this in future iOS versions. Android PWA will have full push support via Firebase Cloud Messaging (FCM).

> [!IMPORTANT]
> **Gradual Rollout Strategy**
> 
> We will implement feature flags to enable PWA capabilities incrementally:
> - Phase 1: Desktop users only (Chrome, Edge, Firefox)
> - Phase 2: Android users (Chrome, Samsung Internet)
> - Phase 3: iOS users (Safari — with documented limitations)
> 
> This allows for controlled testing and immediate rollback if issues arise.

---

## Proposed Changes

### A. PWA Core Enablement

#### Dependencies to Add

**1. Install PWA Tooling**
```bash
npm install next-pwa@5.6.0 workbox-window
npm install -D @types/serviceworker
```

**Why these versions:**
- `next-pwa@5.6.0` — Latest stable version with Next.js 13+ support
- `workbox-window` — Client-side service worker registration
- Type definitions for TypeScript compatibility

---

#### [MODIFY] [next.config.ts](file:///c:/Users/chanc/Documents/WeAreFamily/next.config.ts)

**Current:**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

**Proposed:**
```typescript
import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // PWA Configuration
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  
  // Critical: Workbox configuration
  runtimeCaching: [
    {
      // Static assets (JS, CSS, fonts, images)
      urlPattern: /^https?.*\.(png|jpg|jpeg|webp|svg|gif|woff|woff2|ttf|otf|eot)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets-cache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      // Firebase Storage URLs
      urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "firebase-storage-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      // API routes (network-first for freshness)
      urlPattern: /^https?.*\/api\/(?!auth).*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
      },
    },
    {
      // CRITICAL: Never cache auth routes
      urlPattern: /^https?.*\/api\/auth\/.*/i,
      handler: "NetworkOnly",
    },
  ],
  
  // Files to exclude from service worker
  exclude: [
    /middleware-manifest\.json$/,
    /middleware-runtime\.js$/,
    /_buildManifest\.js$/,
    /_ssgManifest\.js$/,
    /\.map$/,
    /^builds-manifest\.json$/,
  ],
  
  buildExcludes: [/middleware-manifest\.json$/],
});

export default pwaConfig(nextConfig);
```

**Rationale:**
- `disable: dev` — Service workers disabled in development for faster iteration
- `NetworkOnly` for auth routes — Prevents Firebase Auth token corruption
- `CacheFirst` for static assets — Instant load times
- `NetworkFirst` for API calls — Fresh data with offline fallback

---

#### [NEW] [public/manifest.json](file:///c:/Users/chanc/Documents/WeAreFamily/public/manifest.json)

```json
{
  "name": "Famio - Family Social Network",
  "short_name": "Famio",
  "description": "A private, AI-powered social platform for families. Share moments, plan events, and stay connected.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#000000",
  "theme_color": "#3b82f6",
  "categories": ["social", "lifestyle"],
  
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  
  "screenshots": [
    {
      "src": "/screenshots/desktop-home.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile-home.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  
  "shortcuts": [
    {
      "name": "Messages",
      "short_name": "Messages",
      "description": "View your messages",
      "url": "/messages",
      "icons": [{ "src": "/icons/shortcut-messages.png", "sizes": "96x96" }]
    },
    {
      "name": "Family Feed",
      "short_name": "Feed",
      "description": "View family updates",
      "url": "/family",
      "icons": [{ "src": "/icons/shortcut-feed.png", "sizes": "96x96" }]
    }
  ],
  
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "media",
          "accept": ["image/*", "video/*"]
        }
      ]
    }
  }
}
```

**Key Features:**
- `purpose: "any maskable"` — Icons work on all platforms including Android adaptive icons
- `shortcuts` — Quick actions from home screen
- `share_target` — Enables "Share to Famio" from other apps (Android only)

---

#### [MODIFY] [app/layout.tsx](file:///c:/Users/chanc/Documents/WeAreFamily/app/layout.tsx)

**Add PWA meta tags and manifest link:**

```tsx
export const metadata: Metadata = {
  title: "Famio - Connect with Your Family and Friends",
  description: "A private, AI-powered social platform for families. Share moments, plan events, and stay connected.",
  
  // PWA Configuration
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Famio",
  },
  applicationName: "Famio",
  formatDetection: {
    telephone: false,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover", // iOS safe area support
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
```

**Rationale:**
- `viewportFit: "cover"` — Ensures content extends into iPhone notch areas
- `statusBarStyle: "black-translucent"` — iOS status bar blends with app
- `userScalable: false` — Prevents accidental zoom on mobile (app-like behavior)

---

### B. Offline & Resilience Strategy

#### [NEW] [components/pwa/offline-indicator.tsx](file:///c:/Users/chanc/Documents/WeAreFamily/components/pwa/offline-indicator.tsx)

```tsx
"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showNotification) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] 
                 px-6 py-3 rounded-full shadow-lg backdrop-blur-md
                 transition-all duration-300 animate-in slide-in-from-top"
      style={{
        backgroundColor: isOnline 
          ? "rgba(34, 197, 94, 0.9)" 
          : "rgba(239, 68, 68, 0.9)",
        color: "white",
      }}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Back online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You're offline — some features may be limited</span>
          </>
        )}
      </div>
    </div>
  );
}
```

---

#### [NEW] [app/offline/page.tsx](file:///c:/Users/chanc/Documents/WeAreFamily/app/offline/page.tsx)

```tsx
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        <WifiOff className="w-24 h-24 mx-auto text-muted-foreground mb-6" />
        
        <h1 className="text-3xl font-bold mb-4">You're Offline</h1>
        
        <p className="text-muted-foreground mb-8">
          Famio works best with an internet connection. Check your network settings and try again.
        </p>
        
        <Button
          onClick={() => window.location.reload()}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
        
        <div className="mt-12 text-sm text-muted-foreground">
          <p className="mb-2">While offline, you can still:</p>
          <ul className="space-y-1">
            <li>• View previously loaded content</li>
            <li>• Navigate between cached pages</li>
            <li>• Draft messages (they'll send when you're back online)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
```

---

#### [NEW] [lib/pwa/service-worker-manager.ts](file:///c:/Users/chanc/Documents/WeAreFamily/lib/pwa/service-worker-manager.ts)

```typescript
"use client";

import { Workbox } from "workbox-window";

let wb: Workbox | undefined;

export function registerServiceWorker() {
  if (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    process.env.NODE_ENV === "production"
  ) {
    wb = new Workbox("/sw.js");

    wb.addEventListener("installed", (event) => {
      if (event.isUpdate) {
        console.log("[PWA] New version available");
        // Show update notification
        if (confirm("A new version of Famio is available. Reload to update?")) {
          wb?.messageSkipWaiting();
          window.location.reload();
        }
      }
    });

    wb.addEventListener("activated", () => {
      console.log("[PWA] Service worker activated");
    });

    wb.register().catch((err) => {
      console.error("[PWA] Service worker registration failed:", err);
    });
  }
}

export function unregisterServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
  }
}
```

---

#### [MODIFY] [app/layout.tsx](file:///c:/Users/chanc/Documents/WeAreFamily/app/layout.tsx) — Add Service Worker Registration

**Add to the component body (client-side effect):**

```tsx
// Add this new component file first
// components/pwa/sw-register.tsx
"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa/service-worker-manager";

export function ServiceWorkerRegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
```

**Then import in layout.tsx:**
```tsx
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} antialiased min-h-screen bg-background text-foreground font-sans`}>
          <ThemeProvider ...>
            <LanguageProvider>
              <MessageNotificationProvider>
                <ServiceWorkerRegister />
                <OfflineIndicator />
                {children}
                <Toaster />
                <AIAssistant />
              </MessageNotificationProvider>
            </LanguageProvider>
          </ThemeProvider>
        </body>
      </html>
    </AuthProvider>
  );
}
```

---

### C. Mobile UX & App-Like Experience

#### [NEW] [components/pwa/install-prompt.tsx](file:///c:/Users/chanc/Documents/WeAreFamily/components/pwa/install-prompt.tsx)

```tsx
"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Listen for install prompt (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 30 seconds if user hasn't dismissed before
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 30000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  // Don't show if already installed or user dismissed
  if (isStandalone || (!showPrompt && !isIOS)) return null;

  // iOS-specific install instructions
  if (isIOS && showPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start gap-4">
            <Share className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Install Famio on iOS</h3>
              <ol className="text-sm text-muted-foreground space-y-1">
                <li>1. Tap the <Share className="inline w-4 h-4" /> Share button in Safari</li>
                <li>2. Scroll down and tap "Add to Home Screen"</li>
                <li>3. Tap "Add" in the top-right corner</li>
              </ol>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDismiss}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Android/Desktop install prompt
  if (deferredPrompt && showPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 
                      bg-card border rounded-lg shadow-xl p-4">
        <div className="flex items-start gap-4">
          <Download className="w-6 h-6 text-blue-500 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Install Famio</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Get quick access and a better experience with our app
            </p>
            <div className="flex gap-2">
              <Button onClick={handleInstall} size="sm">
                Install
              </Button>
              <Button onClick={handleDismiss} variant="ghost" size="sm">
                Not Now
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDismiss}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
```

**Add to layout.tsx:**
```tsx
import { InstallPrompt } from "@/components/pwa/install-prompt";

// Inside body
<InstallPrompt />
```

---

#### [MODIFY] [middleware.ts](file:///c:/Users/chanc/Documents/WeAreFamily/middleware.ts) — Add PWA Route Support

```typescript
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-*.js|offline|login|signup).*)",
  ],
};
```

**Rationale:** Exclude PWA assets from middleware auth checks to prevent service worker blocking.

---

### D. iOS & Android Compatibility

#### Platform-Specific Considerations

**iOS Safari Limitations (Documented):**

| Feature | Support | Mitigation |
|---------|---------|------------|
| Web Push Notifications | ❌ Not supported | Use in-app notifications only, document limitation |
| Background Sync | ❌ Not supported | Queue actions locally, sync on app open |
| Install Banner | ❌ Manual only | Show custom install instructions (Safari Share menu) |
| Service Worker Updates | ⚠️ Inconsistent | Force reload on major updates |
| Cache API | ✅ Supported | Full offline support available |
| IndexedDB | ✅ Supported | Local data persistence available |
| Add to Home Screen | ✅ Supported | Full standalone mode works |

**Android Chrome Features (Full Support):**

| Feature | Support | Implementation |
|---------|---------|----------------|
| Web Push Notifications | ✅ Full support | Firebase Cloud Messaging (FCM) |
| Background Sync | ✅ Full support | Workbox background sync module |
| Install Banner | ✅ Automatic | `beforeinstallprompt` event |
| Service Worker | ✅ Full support | All caching strategies available |
| Shortcuts | ✅ Supported | Home screen shortcuts in manifest |
| Share Target | ✅ Supported | "Share to Famio" from other apps |

---

### E. Performance Optimization

#### Baseline Targets

| Metric | Target | Current (Est.) | Strategy |
|--------|--------|----------------|----------|
| Lighthouse PWA Score | ≥ 90 | N/A | Manifest + SW + HTTPS |
| First Contentful Paint (FCP) | < 1.8s | ~2.5s | Code splitting, font optimization |
| Largest Contentful Paint (LCP) | < 2.5s | ~3.0s | Image optimization, critical CSS |
| Time to Interactive (TTI) | < 3.8s | ~4.5s | Reduce JS bundle size |
| Cumulative Layout Shift (CLS) | < 0.1 | ~0.15 | Skeleton loaders, image dimensions |

#### Optimization Techniques

**1. Code Splitting (Already Configured)**
- Next.js App Router automatically splits routes
- Use dynamic imports for heavy components:
  ```tsx
  const AIAssistant = dynamic(() => import("@/components/ai/ai-assistant"), {
    ssr: false,
  });
  ```

**2. Image Optimization**
- Already using `next/image` (verified in components)
- Add `priority` prop to hero images
- Use `loading="lazy"` for below-fold images

**3. Font Loading Strategy**
```tsx
// app/layout.tsx — Already optimized
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // Add this for FOIT prevention
});
```

**4. Bundle Size Analysis**
```bash
# Add to package.json scripts
"analyze": "ANALYZE=true next build"
```

```typescript
// next.config.ts
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(pwaConfig(nextConfig));
```

---

### F. Accessibility & Compliance

#### WCAG 2.1 AA Checklist

**Automated Testing:**
```bash
npm install -D @axe-core/cli pa11y
```

**Run audits:**
```bash
npx pa11y-ci --sitemap https://famio.us/sitemap.xml
```

**Manual Testing Requirements:**

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Test escape key closes modals

2. **Screen Reader Testing**
   - Test with NVDA (Windows) or VoiceOver (macOS/iOS)
   - Verify all images have alt text
   - Check ARIA labels on custom components

3. **Color Contrast**
   - Verify 4.5:1 ratio for normal text
   - Verify 3:1 ratio for large text and UI components
   - Test in both light and dark themes

4. **Responsive Text**
   - Test zoom up to 200% without horizontal scroll
   - Verify no text is cut off

---

### G. Security & Privacy

#### Security Audit Checklist

**1. Service Worker Security**
```typescript
// Verify in next.config.ts
runtimeCaching: [
  // ❌ NEVER cache these routes
  {
    urlPattern: /^https?.*\/api\/auth\/.*/i,
    handler: "NetworkOnly",
  },
  {
    urlPattern: /.*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
    handler: "CacheFirst",
    // ✅ No sensitive data in images
  },
],
```

**2. Cache Exclusions (Sensitive Data)**
```typescript
// Do NOT cache:
// - Authentication tokens
// - User credentials
// - Session cookies
// - Admin routes
// - Payment information
// - Personal identifiable information (PII)

// Explicitly exclude from SW
exclude: [
  /api\/auth/,
  /admin/,
  /settings\/billing/,
],
```

**3. HTTPS Enforcement**
```typescript
// middleware.ts — Add if hosting allows
if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
  return NextResponse.redirect(`https://${req.headers.host}${req.url}`, 301);
}
```

**4. Content Security Policy (CSP)**
```typescript
// next.config.ts
async headers() {
  return [
    {
      source: "/:path*",
      headers: [
        {
          key: "Content-Security-Policy",
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com;",
        },
      ],
    },
  ];
},
```

---

### H. Testing & Validation

#### Testing Matrix

| Browser | Desktop | Mobile | Offline | Install | Push |
|---------|---------|--------|---------|---------|------|
| Chrome | ✅ | ✅ | ✅ | ✅ | ✅ |
| Safari | ✅ | ✅ (iOS) | ✅ | ⚠️ Manual | ❌ |
| Firefox | ✅ | ✅ (Android) | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ (Android) | ✅ | ✅ | ✅ |

#### Test Scenarios

**1. Installation Flow**
- [ ] Chrome: Automatic install banner appears
- [ ] Safari iOS: Custom install instructions appear
- [ ] Verify app icon appears on home screen
- [ ] Verify app opens in standalone mode (no browser UI)

**2. Offline Functionality**
- [ ] Disconnect network, verify cached pages load
- [ ] Navigate between cached routes offline
- [ ] Verify offline indicator appears
- [ ] Attempt to post (should queue or show error)
- [ ] Reconnect network, verify queued actions sync

**3. Update Flow**
- [ ] Deploy new version
- [ ] Verify update notification appears
- [ ] Accept update, verify reload works
- [ ] Check old cache is cleared

**4. Authentication**
- [ ] Log in, verify session persists offline
- [ ] Log out, verify protected routes redirect
- [ ] Test Firebase Auth with service worker active

**5. Performance**
- [ ] Run Lighthouse audit (target: PWA score ≥ 90)
- [ ] Verify FCP < 1.8s, LCP < 2.5s
- [ ] Test on slow 3G network

---

### I. Deployment & Rollout

#### Rollout Strategy (Zero-Risk)

**Phase 1: Development & Testing (Week 1)**
```bash
# Local testing
npm run dev
# Service worker disabled in dev mode by default
```

**Phase 2: Staging Deployment (Week 2)**
```bash
# Deploy to staging with feature flag
NEXT_PUBLIC_PWA_ENABLED=false npm run build
firebase hosting:channel:deploy staging
```

**Test on staging:**
- Enable PWA with `NEXT_PUBLIC_PWA_ENABLED=true`
- Test all browsers
- Verify no Firebase Auth issues
- Run full QA suite

**Phase 3: Production Rollout (Week 3)**

**Option A: Gradual Rollout via Feature Flag**
```typescript
// lib/feature-flags.ts
export const isPWAEnabled = () => {
  if (typeof window === "undefined") return false;
  
  // Enable for 10% of users initially
  const userId = localStorage.getItem("user_id");
  if (!userId) return false;
  
  const hash = userId.split("").reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
  return Math.abs(hash) % 100 < 10; // 10% rollout
};
```

**Option B: Full Deployment**
```bash
npm run build
firebase deploy --only hosting
```

#### Rollback Plan

**If Issues Arise:**
1. **Disable Service Worker**
   ```typescript
   // Emergency kill switch
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(reg => reg.unregister());
   });
   ```

2. **Revert to Previous Build**
   ```bash
   git revert <pwa-commit-sha>
   npm run build
   firebase deploy --only hosting
   ```

3. **Clear User Caches**
   ```typescript
   // Force cache clear on next visit
   caches.keys().then(names => {
     names.forEach(name => caches.delete(name));
   });
   ```

---

## Verification Plan

### Automated Tests

**1. Lighthouse CI**
```bash
npm install -D @lhci/cli

# .lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:pwa": ["error", {"minScore": 0.9}],
        "categories:performance": ["warn", {"minScore": 0.8}]
      }
    }
  }
}
```

**2. E2E Testing**
```bash
npm install -D playwright

# tests/pwa/install.spec.ts
test("PWA install prompt appears", async ({ page }) => {
  await page.goto("/");
  // Wait for beforeinstallprompt event
  const installable = await page.evaluate(() => {
    return new Promise((resolve) => {
      window.addEventListener("beforeinstallprompt", () => resolve(true));
      setTimeout(() => resolve(false), 5000);
    });
  });
  expect(installable).toBe(true);
});
```

### Manual Verification

**Production Checklist:**
- [ ] Open DevTools → Application → Service Workers (should show "activated")
- [ ] Open DevTools → Application → Manifest (no errors)
- [ ] Open DevTools → Lighthouse → Run PWA audit (score ≥ 90)
- [ ] Test offline mode (DevTools → Network → Offline)
- [ ] Test install flow on Android Chrome
- [ ] Test install instructions on iOS Safari
- [ ] Verify Firebase Auth works with SW active
- [ ] Verify no console errors in production
- [ ] Test on 3G network (DevTools → Network throttling)
- [ ] Verify push notifications work (Android only)

---

## Firebase-Safe Caching Matrix

| Resource | Cache Strategy | Rationale |
|----------|----------------|-----------|
| `/api/auth/*` | ❌ Never cache | Session tokens must be fresh |
| `/api/*` (other) | Network-first | Fresh data with offline fallback |
| Static assets (JS/CSS) | Cache-first | Immutable, versioned files |
| Images (local) | Cache-first | Rarely change, save bandwidth |
| Firebase Storage URLs | Cache-first (7 day TTL) | User uploads, long-lived |
| HTML pages | Network-first | SEO, fresh content |
| Font files | Cache-first (30 day TTL) | Immutable |
| `/offline` | Precache | Always available offline |

---

## Known Limitations & Acceptance Criteria

### iOS Limitations (Accept & Document)
1. ✅ **No push notifications** — Display in-app notification banner instead
2. ✅ **Manual install only** — Show custom "Add to Home Screen" instructions
3. ✅ **Background sync unavailable** — Queue actions, sync on app open
4. ✅ **Service worker updates delayed** — May require manual reload

### Android Limitations
1. ✅ **None** — Full PWA feature support

### Acceptance Criteria
- ✅ Lighthouse PWA score ≥ 90
- ✅ Works offline (cached routes accessible)
- ✅ Installable on iOS, Android, Desktop
- ✅ Zero Firebase Auth disruptions
- ✅ No data loss or schema changes
- ✅ No design changes
- ✅ FCP < 1.8s, LCP < 2.5s
- ✅ Passes accessibility audit (WCAG 2.1 AA)

---

## Go-Live Checklist

### Pre-Launch
- [ ] All PWA icons generated (72px to 512px)
- [ ] Screenshots captured for app stores
- [ ] Manifest.json validated (https://manifest-validator.appspot.com/)
- [ ] Service worker scopes tested
- [ ] Firebase Auth integration verified
- [ ] Lighthouse audit passed (≥ 90)
- [ ] Accessibility audit passed
- [ ] Security review completed
- [ ] Staging tested on all browsers
- [ ] Rollback plan documented

### Launch Day
- [ ] Deploy to production
- [ ] Monitor error logs (Firebase Console)
- [ ] Check Analytics for install events
- [ ] Test on real devices (iOS, Android)
- [ ] Verify service worker activated
- [ ] Monitor Firebase Auth metrics (no drops)

### Post-Launch (Week 1)
- [ ] Monitor Lighthouse scores daily
- [ ] Check user feedback for issues
- [ ] Track installation rates
- [ ] Verify offline usage patterns
- [ ] Monitor cache hit rates
- [ ] Check bundle sizes

---

## Next Steps

1. **Review this plan** — Approve or request changes
2. **Generate PWA icons** — I can create all required sizes
3. **Implement Phase 1** — Install dependencies, create manifest
4. **Test on staging** — Verify Firebase Auth compatibility
5. **Production rollout** — Gradual or full deployment

**Estimated Timeline:**
- **Week 1**: Core PWA setup (manifest, SW, icons)
- **Week 2**: Offline support, testing
- **Week 3**: Staging validation, production rollout

---

## Questions for Review

1. **Rollout preference:** Gradual (10% → 50% → 100%) or full deployment?
2. **Icon design:** Use existing Famio branding or create new PWA-specific icons?
3. **Push notifications:** Should we prepare FCM integration for Android even though iOS won't support it?
4. **Analytics:** Track PWA install events in Firebase Analytics or separate tool?

Ready to proceed when you approve! 🚀
