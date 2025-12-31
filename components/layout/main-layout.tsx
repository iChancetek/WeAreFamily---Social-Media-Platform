import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";

import { getUserProfile } from "@/lib/auth";

export async function MainLayout({ children }: { children: React.ReactNode }) {
    const user = await getUserProfile();
    const isAdmin = user?.role === 'admin';

    return (
        <div className="flex h-screen bg-gray-50/50">
            <Sidebar className="hidden md:flex w-64 border-r bg-white" isAdmin={isAdmin} />
            <div className="flex-1 flex flex-col min-w-0">
                <TopNav className="md:hidden border-b bg-white" />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="mx-auto max-w-2xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
