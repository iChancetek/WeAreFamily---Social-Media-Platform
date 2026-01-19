"use client";

import { useLanguage } from "@/components/language-context";
import { Group } from "@/app/actions/groups";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { GroupCard } from "@/components/groups/group-card";
import { Separator } from "@/components/ui/separator";
import { Users } from "lucide-react";

interface GroupsViewProps {
    groups: Group[];
}

export function GroupsView({ groups }: GroupsViewProps) {
    const { t } = useLanguage();

    return (
        <div className="animate-in fade-in duration-500">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("groups.title")}</h1>
                    <p className="text-muted-foreground">
                        {t("groups.desc")}
                    </p>
                </div>
                <CreateGroupDialog />
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group: Group) => (
                    <GroupCard key={group.id} group={group} />
                ))}
            </div>

            {groups.length === 0 && (
                <div className="text-center py-12">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">{t("groups.empty.title")}</h3>
                    <p className="text-muted-foreground mb-4">
                        {t("groups.empty.desc")}
                    </p>
                    <CreateGroupDialog />
                </div>
            )}
        </div>
    );
}
