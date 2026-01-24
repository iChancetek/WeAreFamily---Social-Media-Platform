import { NextRequest, NextResponse } from "next/server";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

// Handle shared content from other apps via Web Share Target API
export async function POST(request: NextRequest) {
    try {
        const user = await getUserProfile();
        if (!user) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        const formData = await request.formData();

        const title = formData.get("title") as string || "";
        const text = formData.get("text") as string || "";
        const url = formData.get("url") as string || "";
        const files = formData.getAll("media");

        // Build share data object
        const shareData = {
            title,
            text,
            url,
            files: files.filter((file): file is File => file instanceof File)
        };

        // Store in session storage to be picked up by the post composer
        // Since we can't directly pass data, we'll use URL params
        const params = new URLSearchParams();
        if (title) params.set("title", title);
        if (text) params.set("text", text);
        if (url) params.set("url", url);
        if (files.length > 0) params.set("hasMedia", "true");

        // Redirect to home feed with compose dialog open
        return NextResponse.redirect(
            new URL(`/?share=true&${params.toString()}`, request.url)
        );
    } catch (error) {
        console.error("Error handling shared content:", error);
        return NextResponse.redirect(new URL("/", request.url));
    }
}

// Handle GET requests (fallback)
export async function GET(request: NextRequest) {
    const user = await getUserProfile();
    if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.redirect(new URL("/", request.url));
}
