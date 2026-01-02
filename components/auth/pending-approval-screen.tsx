'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LockIcon } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export function PendingApprovalScreen() {
    const { signOut } = useAuth();

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-gray-100">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <LockIcon className="w-6 h-6 text-amber-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Access Pending</CardTitle>
                    <CardDescription className="text-base text-gray-600">
                        Welcome to WeAreFamily! Your account is currently awaiting admin approval.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                    <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                        Our platform is invite-only to ensure a safe space for our family.
                        Once an admin reviews your request, you'll receive full access.
                    </p>

                    <div className="pt-2">
                        <Button variant="outline" className="w-full" onClick={() => signOut()}>
                            Sign Out
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
