import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
    "/companions",
    "/messages",
    "/events",
    "/gallery",
    "/stories",
    "/settings",
    "/admin",
    "/u/"
];

// Routes that require VERIFIED email (stricter than just authenticated)
const verifiedOnlyRoutes = [
    "/messages",
    "/admin",
    "/events",
    "/stories",
    "/gallery",
];

export function middleware(request: NextRequest) {
    const sessionUid = request.cookies.get("session_uid")?.value;
    const isProtected = protectedRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
    );

    // Debug logging for auth issues
    if (request.nextUrl.pathname === "/login" || isProtected) {
        console.log(`[Middleware] Path: ${request.nextUrl.pathname}, Session: ${sessionUid ? "Found" : "Missing"}`);
    }

    if (isProtected && !sessionUid) {
        console.log(`[Middleware] Redirecting to login from ${request.nextUrl.pathname}`);
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Inject geo context headers for API routes (from edge/proxy headers when available)
    const response = NextResponse.next();

    // Forward geo headers from upstream (Cloudflare, Vercel, etc.) for downstream use
    const forwardedFor = request.headers.get('x-forwarded-for');
    const cfCountry = request.headers.get('cf-ipcountry');
    const vercelCountry = request.headers.get('x-vercel-ip-country');
    const vercelCity = request.headers.get('x-vercel-ip-city');
    const vercelRegion = request.headers.get('x-vercel-ip-country-region');

    if (forwardedFor) response.headers.set('x-client-ip', forwardedFor.split(',')[0].trim());
    if (cfCountry) response.headers.set('x-geo-country', cfCountry);
    if (vercelCountry) response.headers.set('x-geo-country', vercelCountry);
    if (vercelCity) response.headers.set('x-geo-city', decodeURIComponent(vercelCity));
    if (vercelRegion) response.headers.set('x-geo-region', vercelRegion);

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - icons (PWA icons)
         * - manifest.json (PWA manifest)
         * - sw.js (service worker)
         * - workbox (workbox files)
         * - offline (offline page)
         * - login
         * - signup
         */
        "/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-.*|offline|login|signup|embed|post).*)",
    ],
};
