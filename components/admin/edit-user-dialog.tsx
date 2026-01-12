"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { updateUserProfile } from "@/app/actions/admin"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const formSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    displayName: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
})

interface EditUserDialogProps {
    user: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
    const [isSaving, setIsSaving] = useState(false);

    const profileData = user.profileData || {};

    const formatDuration = (ms: number) => {
        if (!ms) return "0m";
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        return `${minutes}m`;
    };

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: profileData.firstName || "",
            lastName: profileData.lastName || "",
            displayName: user.displayName || "",
            email: user.email || "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsSaving(true);
            await updateUserProfile(user.id, values);
            toast.success("User profile updated");
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit User Profile</DialogTitle>
                    <DialogDescription>
                        Make changes to the user's profile and account details.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>First Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="First Name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lastName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Last Name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="displayName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Display Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Display Name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Email Address" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </TabsContent>

                    <TabsContent value="activity">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg border bg-card">
                                    <div className="text-sm font-medium text-muted-foreground">Account Created</div>
                                    <div className="text-lg font-bold mt-1">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(user.createdAt).toLocaleTimeString()}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg border bg-card">
                                    <div className="text-sm font-medium text-muted-foreground">Total Time Spent</div>
                                    <div className="text-lg font-bold mt-1">{formatDuration(user.totalTimeSpent || 0)}</div>
                                    <div className="text-xs text-muted-foreground">Lifetime usage</div>
                                </div>
                                <div className="p-4 rounded-lg border bg-card">
                                    <div className="text-sm font-medium text-muted-foreground">Last Sign In</div>
                                    <div className="text-lg font-bold mt-1">
                                        {user.lastSignInAt ? new Date(user.lastSignInAt.toDate ? user.lastSignInAt.toDate() : user.lastSignInAt).toLocaleString() : "Never"}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg border bg-card">
                                    <div className="text-sm font-medium text-muted-foreground">Current Status</div>
                                    <div className={`text-lg font-bold mt-1 ${user.isOnline ? "text-green-600" : "text-muted-foreground"}`}>
                                        {user.isOnline ? "Online" : "Offline"}
                                    </div>
                                    {user.lastSignOffAt && !user.isOnline && (
                                        <div className="text-xs text-muted-foreground">
                                            Left at {new Date(user.lastSignOffAt.toDate ? user.lastSignOffAt.toDate() : user.lastSignOffAt).toLocaleTimeString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
