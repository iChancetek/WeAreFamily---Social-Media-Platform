import { getUserProfile } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { redirect } from "next/navigation";
import { UserList } from "@/components/admin/user-list";
import { MainLayout } from "@/components/layout/main-layout";
import { desc } from "drizzle-orm";

export default async function AdminDashboard() {
    const user = await getUserProfile();

    if (!user || user.role !== 'admin') {
        redirect("/");
    }

    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

    return (
        <MainLayout>
            <div className="container mx-auto py-10">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">User Management</h2>
                    <UserList users={allUsers} />
                </div>
            </div>
        </MainLayout>
    );
}
