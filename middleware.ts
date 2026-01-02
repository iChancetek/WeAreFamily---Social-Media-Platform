import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
    "/family",
    "/messages",
    "/events",
    "/gallery",
    "/stories",
    "/settings",
    "/admin",
    "/u/"
];

export function middleware(request: NextRequest) {
    const sessionUid = request.cookies.get("session_uid")?.value;
    const isProtected = protectedRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
    );

    if (isProtected && !sessionUid) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - login
         * - signup
         */
        "/((?!api|_next/static|_next/image|favicon.ico|login|signup).*)",
    ],
};
