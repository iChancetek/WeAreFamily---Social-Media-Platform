import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
    let user;
    let error: any = null;
    try {
        user = await getUserProfile();
    } catch (e: any) {
        if (e.message === "NEXT_REDIRECT") throw e;
        error = e;
    }
    
    if (error) {
        console.error("AdminLayout Error:", error);
        return (
            <div className="p-8 text-center text-red-600">
                <h2 className="text-xl font-bold">Admin Section Error</h2>
                <p>Failed to load admin profile. Please check logs.</p>
                <p className="text-sm mt-2 text-gray-500">{error.message}</p>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-muted/40">
            {children}
        </div>
    );
}
