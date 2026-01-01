"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { updateProfile } from "@/app/actions/settings"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const profileFormSchema = z.object({
    displayName: z.string().min(2, {
        message: "Display name must be at least 2 characters.",
    }),
    bio: z.string().max(160).optional(),
    imageUrl: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
    user: {
        id: string;
        displayName?: string | null;
        imageUrl?: string | null;
        bio?: string | null;
    }
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [imageUrl, setImageUrl] = useState<string | undefined>(user.imageUrl || undefined);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            displayName: user.displayName || "",
            bio: user.bio || "",
            imageUrl: user.imageUrl || "",
        },
    })

    async function onSubmit(data: ProfileFormValues) {
        try {
            await updateProfile({
                ...data,
                imageUrl: imageUrl
            })
            toast.success("Profile updated")
        } catch {
            toast.error("Failed to update profile")
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                    Update your public profile information.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="flex items-center gap-4">
                            <Avatar className="w-20 h-20">
                                <AvatarImage src={imageUrl} />
                                <AvatarFallback>JD</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-2">
                                <FormLabel>Profile Picture / Video</FormLabel>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            try {
                                                toast.info("Uploading...");
                                                const { storage } = await import("@/lib/firebase");
                                                const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

                                                const storageRef = ref(storage, `users/${user.id}/profile/${file.name}`);
                                                await uploadBytes(storageRef, file);
                                                const url = await getDownloadURL(storageRef);

                                                setImageUrl(url);
                                                toast.success("Upload complete");
                                            } catch (error: any) {
                                                console.error("Upload failed", error);
                                                toast.error(`Error uploading: ${error.message || "Unknown error"}`);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Display Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        This is your public display name.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bio</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell us a little bit about yourself"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        You can @mention other users and organizations to link to them.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">Update profile</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
