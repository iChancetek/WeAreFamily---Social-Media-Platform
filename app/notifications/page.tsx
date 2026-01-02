import { MainLayout } from "@/components/layout/main-layout";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { Card } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function NotificationsPage() {
    // Standard layout
    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto">
                <Card className="min-h-[600px] p-2">
                    <NotificationsList />
                </Card>
            </div>
        </MainLayout>
    );
}
