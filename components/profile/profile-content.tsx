"use client"

import { useRouter } from "next/navigation"
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
import { useLanguage } from "@/components/language-context"
import { ArrowLeft } from "lucide-react"

const profileFormSchema = z.object({
    displayName: z.string().min(2, {
        message: "Display name must be at least 2 characters.",
    }),
    bio: z.string().max(160).optional(),
    imageUrl: z.string().optional(),
    coverUrl: z.string().optional(),
    coverType: z.string().optional(),
    birthday: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileContentProps {
    user: {
        id: string;
        displayName?: string | null;
        imageUrl?: string | null;
        coverUrl?: string | null;
        coverType?: string | null;
        bio?: string | null;
        birthday?: string | null;
    }
}

export function ProfileContent({ user }: ProfileContentProps) {
    const router = useRouter()
    const { t } = useLanguage()

    const [imageUrl, setImageUrl] = useState<string | undefined>(user.imageUrl || undefined)
    const [coverUrl, setCoverUrl] = useState<string | undefined>(user.coverUrl || undefined)
    const [coverType, setCoverType] = useState<'image' | 'video' | undefined>(user.coverType as 'image' | 'video' || undefined)

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            displayName: user.displayName || "",
            bio: user.bio || "",
            imageUrl: user.imageUrl || "",
            coverUrl: user.coverUrl || "",
            coverType: user.coverType || "",
            birthday: user.birthday || "",
        },
    })

    async function onSubmit(data: ProfileFormValues) {
        try {
            await updateProfile({
                ...data,
                imageUrl: imageUrl,
                coverUrl: coverUrl,
                coverType: coverType,
                birthday: data.birthday
            })
            form.reset({ ...data, imageUrl, coverUrl, coverType, birthday: data.birthday })
            toast.success("Profile updated")
            router.refresh()
        } catch {
            toast.error("Failed to update profile")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t("profile.title")}</h2>
                    <p className="text-muted-foreground">
                        {t("settings.profile.desc")}
                    </p>
                </div>
                <Button variant="outline" onClick={() => router.push('/')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    {t("profile.back")}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("settings.profile.title")}</CardTitle>
                    <CardDescription>{t("settings.profile.desc")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-20 h-20">
                                    <AvatarImage src={imageUrl} />
                                    <AvatarFallback>{user.displayName?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col gap-2">
                                    <FormLabel>{t("settings.profilePic")}</FormLabel>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="file"
                                            accept="image/*"
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
                                                    form.setValue('imageUrl', url, { shouldDirty: true });
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

                            {/* Cover Upload */}
                            <div className="flex flex-col gap-2">
                                <FormLabel>{t("settings.cover")}</FormLabel>
                                {coverUrl && (
                                    <div className="relative w-full h-32 rounded-md overflow-hidden bg-muted mb-2">
                                        {coverUrl.includes("mp4") || coverUrl.includes("webm") ? (
                                            <video src={coverUrl} className="w-full h-full object-cover" autoPlay loop muted />
                                        ) : (
                                            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                )}
                                <Input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        try {
                                            toast.info("Uploading cover...");
                                            const { storage } = await import("@/lib/firebase");
                                            const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

                                            const storageRef = ref(storage, `users/${user.id}/cover/${file.name}`);
                                            await uploadBytes(storageRef, file);
                                            const url = await getDownloadURL(storageRef);

                                            setCoverUrl(url);
                                            const type = file.type.startsWith('video') ? 'video' : 'image';
                                            setCoverType(type);

                                            form.setValue('coverUrl', url, { shouldDirty: true });
                                            form.setValue('coverType', type, { shouldDirty: true });

                                            toast.success("Cover uploaded");
                                        } catch (error: any) {
                                            console.error("Upload failed", error);
                                            toast.error(`Error uploading: ${error.message || "Unknown error"}`);
                                        }
                                    }}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("settings.displayName")}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormDescription>{t("settings.displayName.desc")}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("settings.bio")}</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Tell us a little bit about yourself"
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>{t("settings.bio.desc")}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="birthday"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Birthday</FormLabel>
                                        <FormControl>
                                            <Input type="text" placeholder="MM-DD" {...field} />
                                        </FormControl>
                                        <FormDescription>MM-DD (e.g., 12-25)</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit">{t("settings.updateProfile")}</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
