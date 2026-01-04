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
import { useAuth } from "@/components/auth-provider"
// import { useClerk } from "@clerk/nextjs" // Removed
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
    birthday: z.string().optional(),
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
        birthday?: string | null;
        isInvisible?: boolean;
        isPublicProfile?: boolean;
        email?: string | null;
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
    const { signOut } = useAuth()
    // const { openUserProfile } = useClerk() // Removed Clerk
    const [showExitDialog, setShowExitDialog] = useState(false)

    console.log("[SettingsContent] user prop:", user);
    console.log("[SettingsContent] blockedUsers prop:", blockedUsers);
    console.log("[SettingsContent] isInvisible initial state:", user.isInvisible);

    // --- Profile Form State ---
    const [imageUrl, setImageUrl] = useState<string | undefined>(user.imageUrl || undefined)
    const [coverUrl, setCoverUrl] = useState<string | undefined>(user.coverUrl || undefined)
    const [coverType, setCoverType] = useState<'image' | 'video' | undefined>(user.coverType as 'image' | 'video' || undefined)
    const [isInvisible, setIsInvisible] = useState(user.isInvisible || false);
    const [isPublicProfile, setIsPublicProfile] = useState(user.isPublicProfile || false);
    const [blockedList, setBlockedList] = useState(blockedUsers);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const profileForm = useForm<ProfileFormValues>({
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

    // --- Account Form State ---
    const accountForm = useForm<AccountFormValues>({
        resolver: zodResolver(accountFormSchema),
        defaultValues: {
            language: user.language || "en",
            theme: user.theme || "system",
        },
    })

    // Listen to theme changes - Only apply if user interacts (form is dirty) to avoid overriding local preference on mount
    const themeValue = accountForm.watch("theme")
    const { isDirty: isAccountDirty } = accountForm.formState
    useEffect(() => {
        if (themeValue && isAccountDirty) {
            setTheme(themeValue)
        }
    }, [themeValue, setTheme, isAccountDirty])

    // --- Submit Handlers ---
    async function onProfileSubmit(data: ProfileFormValues) {
        try {
            await updateProfile({
                ...data,
                imageUrl: imageUrl,
                coverUrl: coverUrl,
                coverType: coverType,
                birthday: data.birthday
            })
            profileForm.reset({ ...data, imageUrl, coverUrl, coverType, birthday: data.birthday })
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
            toast.success(checked ? "Invisible mode enabled" : "Invisible mode disabled");
        } catch {
            setIsInvisible(!checked); // Revert on error
            toast.error("Failed to update visibility");
        }
    };

    const handleTogglePublicProfile = async (checked: boolean) => {
        setIsPublicProfile(checked);
        try {
            await updateAccountSettings({ isPublicProfile: checked });
            toast.success(checked ? "Profile is now PUBLIC" : "Profile is now PRIVATE");
        } catch {
            setIsPublicProfile(!checked); // Revert on error
            toast.error("Failed to update profile visibility");
        }
    };

    const handleUnblock = async (userId: string) => {
        try {
            await unblockUser(userId);
            setBlockedList(prev => prev.filter(u => u.id !== userId));
            toast.success("Family Member unblocked");
        } catch {
            toast.error("Failed to unblock family member");
        }
    };

    const handlePasswordReset = async () => {
        if (!user.email) {
            toast.error("User email not found");
            return;
        }
        try {
            const { getAuth, sendPasswordResetEmail } = await import("firebase/auth");
            const auth = getAuth();
            await sendPasswordResetEmail(auth, user.email);
            toast.success("Password reset email sent!", { description: "Please check your inbox and Junk/Spam folder." });
        } catch (error: any) {
            console.error("Password reset error:", error);
            toast.error(error.message || "Failed to send reset email");
        }
    };

    // --- Unified Exit Logic ---
    const isDirty = accountForm.formState.isDirty

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

                    {/* Profile Section Moved to /profile */}

                    {/* Security Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Privacy & Security</CardTitle>
                            <CardDescription>
                                Manage your visibility and blocked users.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* 1. Block Search (Moved to Top) */}
                            <div className="space-y-4">
                                <Label className="text-base">Block a Person</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Search by name..."
                                        onChange={async (e) => {
                                            const q = e.target.value;
                                            if (q.length >= 2) {
                                                const { searchUsers } = await import("@/app/actions/user"); // Keep dynamic or move to top? Let's keep for now but simplify structure
                                                const results = await searchUsers(q);
                                                const unblockedResults = results.filter((r: any) => !blockedList.some(b => b.id === r.id));
                                                setSearchResults(unblockedResults);
                                            } else {
                                                setSearchResults([]);
                                            }
                                        }}
                                    />
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                                        {searchResults.map(u => (
                                            <div key={u.id} className="p-2 flex justify-between items-center bg-card hover:bg-muted/50">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarImage src={u.imageUrl} />
                                                        <AvatarFallback>{u.displayName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium">{u.displayName}</span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={async () => {
                                                        const { blockUser } = await import("@/app/actions/security");
                                                        await blockUser(u.id);
                                                        setBlockedList(prev => [...prev, { ...u, profileData: u } as any]);
                                                        setSearchResults(prev => prev.filter(r => r.id !== u.id));
                                                        toast.error(`Blocked ${u.displayName}`);
                                                    }}
                                                >
                                                    Block
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 2. Invisible Mode */}
                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Invisible Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Hide your online status from other family members.
                                    </p>
                                </div>
                                <Switch
                                    checked={isInvisible}
                                    onCheckedChange={handleToggleInvisible}
                                />
                            </div>

                            {/* 3. Public Profile */}
                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                <div className="space-y-0.5">
                                    <Label className="text-base text-blue-600">Public Profile</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Allow anyone to view your posts and photos.
                                        <br />
                                        <span className="text-xs text-amber-600 font-medium">Note: Private messages and settings remain secure.</span>
                                    </p>
                                </div>
                                <Switch
                                    checked={isPublicProfile}
                                    onCheckedChange={handleTogglePublicProfile}
                                />
                            </div>

                            {/* 3. Blocked List */}
                            <div className="space-y-4 pt-4 border-t border-border">
                                <Label className="text-base">Blocked Family Members</Label>
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

                                    <div className="space-y-4 pt-4 border-t border-border">
                                        <Label className="text-base">Security</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Manage your password and security settings.
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            onClick={handlePasswordReset}
                                        >
                                            Change Password (Send Email)
                                        </Button>
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
