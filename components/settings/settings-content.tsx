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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { updateProfile, updateAccountSettings } from "@/app/actions/settings"
import { toggleInvisibleMode, unblockUser } from "@/app/actions/security"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-context"
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
import { ArrowLeft, Shield } from "lucide-react"
import { useTheme } from "next-themes"
import { useClerk } from "@clerk/nextjs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// --- Schemas ---
const profileFormSchema = z.object({
    displayName: z.string().min(2, {
        message: "Display name must be at least 2 characters.",
    }),
    bio: z.string().max(160).optional(),
    imageUrl: z.string().optional(),
    coverUrl: z.string().optional(),
    coverType: z.string().optional(),
})

const accountFormSchema = z.object({
    language: z.string().optional(),
    theme: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>
type AccountFormValues = z.infer<typeof accountFormSchema>

interface SettingsContentProps {
    user: {
        id: string;
        displayName?: string | null;
        imageUrl?: string | null;
        coverUrl?: string | null;
        coverType?: string | null;
        bio?: string | null;
        language?: string | null;
        theme?: string | null;
        isInvisible?: boolean;
    },
    blockedUsers: {
        id: string;
        displayName?: string | null;
        email: string;
        imageUrl?: string | null;
        profileData: unknown;
    }[]
}

export function SettingsContent({ user, blockedUsers }: SettingsContentProps) {
    const router = useRouter()
    const { t, setLanguage } = useLanguage()
    const { setTheme } = useTheme()
    const { openUserProfile } = useClerk()
    const [showExitDialog, setShowExitDialog] = useState(false)

    // --- Profile Form State ---
    const [imageUrl, setImageUrl] = useState<string | undefined>(user.imageUrl || undefined)
    const [coverUrl, setCoverUrl] = useState<string | undefined>(user.coverUrl || undefined)
    const [coverType, setCoverType] = useState<'image' | 'video' | undefined>(user.coverType as 'image' | 'video' || undefined)
    const [isInvisible, setIsInvisible] = useState(user.isInvisible || false);
    const [blockedList, setBlockedList] = useState(blockedUsers);

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            displayName: user.displayName || "",
            bio: user.bio || "",
            imageUrl: user.imageUrl || "",
            coverUrl: user.coverUrl || "",
            coverType: user.coverType || "",
        },
    })

    // --- Account Form State ---
    const accountForm = useForm<AccountFormValues>({
        resolver: zodResolver(accountFormSchema),
        defaultValues: {
            language: user.language || "en",
            theme: user.theme || "system",
        },
    })

    // Listen to theme changes
    const themeValue = accountForm.watch("theme")
    useEffect(() => {
        if (themeValue) {
            setTheme(themeValue)
        }
    }, [themeValue, setTheme])

    // --- Submit Handlers ---
    async function onProfileSubmit(data: ProfileFormValues) {
        try {
            await updateProfile({
                ...data,
                imageUrl: imageUrl,
                coverUrl: coverUrl,
                coverType: coverType
            })
            profileForm.reset({ ...data, imageUrl, coverUrl, coverType })
            return true
        } catch {
            return false
        }
    }

    async function onAccountSubmit(data: AccountFormValues) {
        try {
            await updateAccountSettings(data)
            if (data.language) {
                setLanguage(data.language as 'en' | 'es')
            }
            accountForm.reset(data)
            return true
        } catch {
            return false
        }
    }

    // --- Security Handlers ---
    const handleToggleInvisible = async (checked: boolean) => {
        setIsInvisible(checked);
        try {
            await toggleInvisibleMode(checked);
            toast.success(checked ? "Invisible mode enabled" : "Invisible mode disabled");
        } catch {
            setIsInvisible(!checked); // Revert on error
            toast.error("Failed to update visibility");
        }
    };

    const handleUnblock = async (userId: string) => {
        try {
            await unblockUser(userId);
            setBlockedList(prev => prev.filter(u => u.id !== userId));
            toast.success("User unblocked");
        } catch {
            toast.error("Failed to unblock user");
        }
    };

    // --- Unified Exit Logic ---
    const isDirty = profileForm.formState.isDirty || accountForm.formState.isDirty

    const handleExit = () => {
        if (isDirty) {
            setShowExitDialog(true)
        } else {
            router.push('/')
        }
    }

    const handleDiscardAndExit = () => {
        router.push('/')
    }

    const handleSaveAndExit = async () => {
        const promises = []
        if (profileForm.formState.isDirty) {
            promises.push(profileForm.handleSubmit(onProfileSubmit)())
        }
        if (accountForm.formState.isDirty) {
            promises.push(accountForm.handleSubmit(onAccountSubmit)())
        }

        const results = await Promise.all(promises)
        const allSuccess = results.every(Boolean)

        if (allSuccess) {
            toast.success("Settings updated")
            router.refresh()
            router.push('/')
        } else {
            toast.error("Some settings failed to save")
        }
    }

    return (
        <>
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 relative">
                <div className="flex-1 lg:max-w-2xl space-y-6">
                    {/* Header with Exit Button */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                            <p className="text-muted-foreground">
                                Manage your profile and account preferences.
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleExit} className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Exit
                        </Button>
                    </div>

                    {/* Profile Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("settings.profile.title")}</CardTitle>
                            <CardDescription>{t("settings.profile.desc")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...profileForm}>
                                <form onSubmit={profileForm.handleSubmit(async (data) => {
                                    if (await onProfileSubmit(data)) {
                                        toast.success("Profile updated")
                                        router.refresh()
                                    } else {
                                        toast.error("Failed to update profile")
                                    }
                                })} className="space-y-8">
                                    {/* Profile Pic Upload */}
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
                                                            toast.info("Uploading...");
                                                            const { storage } = await import("@/lib/firebase");
                                                            const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

                                                            const storageRef = ref(storage, `users/${user.id}/profile/${file.name}`);
                                                            await uploadBytes(storageRef, file);
                                                            const url = await getDownloadURL(storageRef);

                                                            setImageUrl(url);
                                                            profileForm.setValue('imageUrl', url, { shouldDirty: true });
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

                                                    profileForm.setValue('coverUrl', url, { shouldDirty: true });
                                                    profileForm.setValue('coverType', type, { shouldDirty: true });

                                                    toast.success("Cover uploaded");
                                                } catch (error: any) {
                                                    console.error("Upload failed", error);
                                                    toast.error(`Error uploading: ${error.message || "Unknown error"}`);
                                                }
                                            }}
                                        />
                                    </div>

                                    <FormField
                                        control={profileForm.control}
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
                                        control={profileForm.control}
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
                                    <Button type="submit">{t("settings.updateProfile")}</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    {/* Security Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Privacy & Security</CardTitle>
                            <CardDescription>
                                Manage your visibility and blocked users.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Invisible Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Hide your online status from other users.
                                    </p>
                                </div>
                                <Switch
                                    checked={isInvisible}
                                    onCheckedChange={handleToggleInvisible}
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-base">Blocked Users</Label>
                                {blockedList.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">You haven't blocked anyone.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {blockedList.map((blockedUser) => {
                                            const profile = blockedUser.profileData as { firstName: string, lastName: string } | null;
                                            const name = blockedUser.displayName || (profile?.firstName ? `${profile.firstName} ${profile.lastName}` : blockedUser.email);
                                            return (
                                                <div key={blockedUser.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={blockedUser.imageUrl || undefined} />
                                                            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm font-medium">{name}</span>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => handleUnblock(blockedUser.id)}>
                                                        Unblock
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("settings.account.title")}</CardTitle>
                            <CardDescription>{t("settings.account.desc")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...accountForm}>
                                <form onSubmit={accountForm.handleSubmit(async (data) => {
                                    if (await onAccountSubmit(data)) {
                                        toast.success("Account settings updated")
                                        router.refresh()
                                    } else {
                                        toast.error("Failed to update settings")
                                    }
                                })} className="space-y-8">
                                    <FormField
                                        control={accountForm.control}
                                        name="language"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("settings.language")}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a language" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="en">English</SelectItem>
                                                        <SelectItem value="es">Español</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>{t("settings.language.desc")}</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={accountForm.control}
                                        name="theme"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("settings.theme")}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a theme" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="light">Light</SelectItem>
                                                        <SelectItem value="dark">Dark</SelectItem>
                                                        <SelectItem value="system">System</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>{t("settings.theme.desc")}</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="pt-4 border-t border-border">
                                        <FormLabel className="mb-2 block">{t("settings.security")}</FormLabel>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => openUserProfile()}
                                            className="w-full sm:w-auto gap-2"
                                        >
                                            <Shield className="w-4 h-4" />
                                            {t("settings.manageSecurity")}
                                        </Button>
                                        <FormDescription className="mt-2 text-xs">
                                            Manage MFA and password via Clerk.
                                        </FormDescription>
                                    </div>

                                    <Button type="submit">{t("settings.updateAccount")}</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>

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
        </>
    )
}
