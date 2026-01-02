import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users } from "lucide-react";
import { Page } from "@/app/actions/pages";

export function PageCard({ page }: { page: Page }) {
    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="h-32 w-full bg-muted relative rounded-t-lg overflow-hidden">
                {page.imageUrl ? (
                    <img
                        src={page.imageUrl}
                        alt={page.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-600/20 to-green-600/10 flex items-center justify-center">
                        <Briefcase className="w-12 h-12 text-green-600/40" />
                    </div>
                )}
            </div>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg leading-tight">{page.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{page.category.replace('_', ' ')}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {page.description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{page.followerCount || 1} followers</span>
                </div>
            </CardContent>
            <CardFooter>
                <Button asChild variant="outline" className="w-full">
                    <Link href={`/pages/${page.id}`}>
                        View Page
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
