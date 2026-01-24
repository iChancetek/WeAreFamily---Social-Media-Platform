export const dynamic = "force-dynamic";

import { MainLayout } from "@/components/layout/main-layout";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sanitizeData } from "@/lib/serialization";

export default async function MembersDirectoryPage() {
    const currentUser = await getUserProfile();
    if (!currentUser) {
        redirect("/");
    }

    // Fetch ONLY online members
    // Users are considered online if lastActiveAt is within the last 15 minutes
    // The isOnline field is already calculated server-side
    const membersSnapshot = await adminDb.collection("users")
        .where("isActive", "==", true)
        .where("isOnline", "==", true) // Only fetch online users
        .limit(50)
        .get();

    let members = membersSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return sanitizeData({
            id: doc.id,
            displayName: ((data.displayName && data.displayName !== "Family Member") ? data.displayName : null) || (data.profileData?.firstName ? `${data.profileData.firstName} ${data.profileData.lastName || ''}`.trim() : null) || data.email?.split('@')[0] || "Unknown",
            email: data.email,
            imageUrl: data.imageUrl,
            role: data.role,
            isOnline: data.isOnline,
        });
    });

    // Filter to only show members and admins
    members = members.filter((m: any) => m.role === 'member' || m.role === 'admin');

    return (
        <MainLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Online Members</h1>
                <p className="text-muted-foreground">Members currently signed in and active.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Online Now ({members.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                        {members.map((member: any) => (
                            <Link key={member.id} href={`/u/${member.id}`} className="block group">
                                <div className="flex flex-col items-center p-6 border rounded-xl bg-card hover:border-green-200 hover:bg-green-50/50 dark:hover:bg-muted/50 transition-all duration-200 shadow-sm hover:shadow-md">
                                    <div className="relative">
                                        <Avatar className="w-20 h-20 mb-4 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
                                            <AvatarImage src={member.imageUrl} />
                                            <AvatarFallback>{member.email?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        {/* Online status indicator */}
                                        <div className="absolute bottom-3 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-card animate-pulse" />
                                    </div>
                                    <h3 className="font-semibold text-center text-foreground group-hover:text-green-600 transition-colors w-full truncate px-2">
                                        {member.displayName}
                                    </h3>
                                    <p className="text-xs text-muted-foreground capitalize mt-1">
                                        {member.role === 'admin' ? 'Administrator' : 'Member'}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {members.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            <p className="text-lg mb-2">No members online right now</p>
                            <p className="text-sm">Check back later to see who's active!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </MainLayout>
    );
}
