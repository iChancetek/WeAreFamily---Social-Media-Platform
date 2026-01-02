export const dynamic = "force-dynamic";

import { MainLayout } from "@/components/layout/main-layout";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPendingRequests, getFamilyMembers } from "@/app/actions/family";
import { SearchUsers } from "@/components/family/search-users";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { FamilyRequestButton } from "@/components/family/family-request-button";
import { Separator } from "@/components/ui/separator";

export default async function FamilyPage() {
    const user = await getUserProfile();

    if (!user) {
        redirect("/");
    }

    const { incoming, sent } = await getPendingRequests();
    const familyMembers = await getFamilyMembers();

    return (
        <MainLayout>
            <div className="space-y-6 pb-16">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Family & Connections</h1>
                    <p className="text-muted-foreground">Manage your family connections and requests.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Search & Requests */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Find Family</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <SearchUsers />
                            </CardContent>
                        </Card>

                        {(incoming.length > 0 || sent.length > 0) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Requests</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {incoming.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-muted-foreground">Incoming</h3>
                                            {incoming.map((req: any) => (
                                                <div key={req.id} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="w-8 h-8">
                                                            <AvatarImage src={req.sender.imageUrl} />
                                                            <AvatarFallback>{req.sender.email.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm font-medium truncate">{req.sender.displayName || req.sender.email}</span>
                                                    </div>
                                                    <FamilyRequestButton
                                                        targetUserId={req.senderId}
                                                        initialStatus={{ status: 'pending_received', requestId: req.id }}
                                                        initialRequestId={req.id}
                                                        className="w-full h-8 text-xs"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {incoming.length > 0 && sent.length > 0 && <Separator />}
                                    {sent.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-muted-foreground">Sent</h3>
                                            {sent.map((req: any) => (
                                                <div key={req.id} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="w-8 h-8">
                                                            <AvatarImage src={req.receiver.imageUrl} />
                                                            <AvatarFallback>{req.receiver.email.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm font-medium truncate">{req.receiver.displayName || req.receiver.email}</span>
                                                    </div>
                                                    <FamilyRequestButton
                                                        targetUserId={req.receiverId}
                                                        initialStatus={{ status: 'pending_sent', requestId: req.id }}
                                                        initialRequestId={req.id}
                                                        className="w-full h-8 text-xs"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: My Family Grid */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>My Family ({familyMembers.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {familyMembers.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">
                                        You haven't added any family members yet. Use the search to find them!
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {familyMembers.map((member: any) => (
                                            <Link key={member.id} href={`/u/${member.id}`} className="block group">
                                                <div className="flex flex-col items-center p-4 border rounded-lg bg-card hover:border-primary/50 transition-colors">
                                                    <Avatar className="w-20 h-20 mb-3 border-2 border-background group-hover:scale-105 transition-transform">
                                                        <AvatarImage src={member.imageUrl} />
                                                        <AvatarFallback>{member.email.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-semibold text-center truncate w-full">{member.displayName || member.email}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
