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

    // Fetch members (limit 50 for now)
    // We only want 'members' or 'admins', not pending? Or everyone?
    // Users said "view a directory of all members".
    const membersSnapshot = await adminDb.collection("users")
        .where("isActive", "==", true) // Assuming we use this flag? If not, just remove.
        .limit(50)
        .get();

    let members = membersSnapshot.docs.map(doc => {
        const data = doc.data();
        return sanitizeData({
            id: doc.id,
            displayName: data.displayName || (data.profileData?.firstName ? `${data.profileData.firstName} ${data.profileData.lastName || ''}`.trim() : null) || data.email?.split('@')[0] || "Family Member",
            email: data.email,
            imageUrl: data.imageUrl,
            role: data.role,
            // Only expose public fields
        });
    });

    // Filter out current user from display? Or keep them? Usually keep.
    // Filter out pending?
    members = members.filter(m => m.role === 'member' || m.role === 'admin');

    return (
        <MainLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Members Directory</h1>
                <p className="text-muted-foreground">Discover and connect with the Famio community.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Members ({members.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                        {members.map((member: any) => (
                            <Link key={member.id} href={`/u/${member.id}`} className="block group">
                                <div className="flex flex-col items-center p-6 border rounded-xl bg-card hover:border-blue-200 hover:bg-blue-50/50 dark:hover:bg-muted/50 transition-all duration-200 shadow-sm hover:shadow-md">
                                    <Avatar className="w-20 h-20 mb-4 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
                                        <AvatarImage src={member.imageUrl} />
                                        <AvatarFallback>{member.email?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <h3 className="font-semibold text-center text-foreground group-hover:text-blue-600 transition-colors w-full truncate px-2">
                                        {member.displayName}
                                    </h3>
                                    <p className="text-xs text-muted-foreground capitalize mt-1">
                                        {member.role === 'admin' ? 'Administrator' : 'Family Member'}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {members.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            No members found.
                        </div>
                    )}
                </CardContent>
            </Card>
        </MainLayout>
    );
}
