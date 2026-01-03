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
import { useLanguage } from "@/components/language-context";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft } from "lucide-react"
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const profileFormSchema = z.object({
    displayName: z.string().min(2, {
        message: "Display name must be at least 2 characters.",
    }),
    bio: z.string().max(160).optional(),
    imageUrl: z.string().optional(),
    coverUrl: z.string().optional(),
    coverType: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
    user: {
        id: string;
        displayName?: string | null;
        imageUrl?: string | null;
        coverUrl?: string | null;
        coverType?: string | null;
        bio?: string | null;
    }
}

export function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter()
    const [imageUrl, setImageUrl] = useState<string | undefined>(user.imageUrl || undefined);
    const [coverUrl, setCoverUrl] = useState<string | undefined>(user.coverUrl || undefined);
    const [coverType, setCoverType] = useState<'image' | 'video' | undefined>(user.coverType as 'image' | 'video' || undefined);
    const [showExitDialog, setShowExitDialog] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            displayName: user.displayName || "",
            bio: user.bio || "",
            imageUrl: user.imageUrl || "",
            coverUrl: user.coverUrl || "",
            coverType: user.coverType || "",
        },
    })

    async function onSubmit(data: ProfileFormValues) {
        try {
            await updateProfile({
                ...data,
                imageUrl: imageUrl,
                coverUrl: coverUrl,
                coverType: coverType
            })
            toast.success("Profile updated")

            // Re-sync form state so it's not dirty anymore
            form.reset({ ...data, imageUrl: imageUrl });
            router.refresh()
        } catch {
            toast.error("Failed to update profile")
        }
    }

    const { isDirty } = form.formState;

    const handleExit = () => {
        if (isDirty) {
            setShowExitDialog(true);
        } else {
            router.push('/');
        }
    };

    const handleDiscardAndExit = () => {
        router.push('/');
    };

    const handleSaveAndExit = async () => {
        await form.handleSubmit(async (data) => {
            await onSubmit(data);
            router.push('/');
        })();
    };

    const { t } = useLanguage();

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{t("settings.profile.title")}</CardTitle>
                    <CardDescription>
                        {t("settings.profile.desc")}
                    </CardDescription>
                </div>
                <Button variant="outline" onClick={handleExit} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Exit
                </Button>
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
                                <FormLabel>{t("settings.profilePic")}</FormLabel>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            try {
                                                const { getAuth } = await import("firebase/auth");
                                                const auth = getAuth();
                                                const currentUser = auth.currentUser;

                                                if (!currentUser) {
                                                    toast.error("Authentication error: You appear to be logged out on the client. Please refresh page or re-login.");
                                                    return;
                                                }

                                                if (currentUser.uid !== user.id) {
                                                    console.error(`Auth Mismatch: Client(${currentUser.uid}) vs Prop(${user.id})`);
                                                    toast.error("Security mismatch. Please refresh the page.");
                                                    return;
                                                }

                                                toast.info("Uploading...");

                                                const storageRef = ref(storage, `users/${user.id}/profile/${file.name}`);
                                                await uploadBytes(storageRef, file);
                                                const url = await getDownloadURL(storageRef);

                                                setImageUrl(url);

                                                // Mark form as dirty manually since we're managing image state outside hook form for now
                                                // Ideally should integrate fully, but for dirty check:
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
                                    <FormDescription>
                                        {t("settings.displayName.desc")}
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
                                    <FormLabel>{t("settings.bio")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell us a little bit about yourself"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {t("settings.bio.desc")}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">{t("settings.updateProfile")}</Button>
                    </form>
                </Form>

                <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                            <AlertDialogDescription>
                                You have unsaved changes. Do you want to save them before exiting?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setShowExitDialog(false)}>Cancel</AlertDialogCancel>
                            <Button variant="outline" onClick={handleDiscardAndExit}>Discard</Button>
                            <Button onClick={handleSaveAndExit}>Save & Exit</Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card >
    )
}
