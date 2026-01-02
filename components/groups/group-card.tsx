import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Lock, Globe } from "lucide-react";
import { Group } from "@/app/actions/groups";

export function GroupCard({ group }: { group: Group }) {
    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="h-32 w-full bg-muted relative rounded-t-lg overflow-hidden">
                {group.imageUrl ? (
                    <img
                        src={group.imageUrl}
                        alt={group.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <Users className="w-12 h-12 text-primary/40" />
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                    {group.privacy === 'private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                    {group.privacy === 'private' ? 'Private' : 'Public'}
                </div>
            </div>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg leading-tight">{group.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{group.category}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {group.description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{group.memberCount || 1} members</span>
                </div>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full">
                    <Link href={`/groups/${group.id}`}>
                        View Group
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
