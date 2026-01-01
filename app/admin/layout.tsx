import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const user = await getUserProfile();

    if (!user || user.role !== 'admin') {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-muted/40">
            {children}
        </div>
    );
}
