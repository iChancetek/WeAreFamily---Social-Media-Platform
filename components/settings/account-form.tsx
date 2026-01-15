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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { updateAccountSettings } from "@/app/actions/settings"
import { useTheme } from "next-themes"
import { Shield } from "lucide-react"
import { useLanguage } from "@/components/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"

const accountFormSchema = z.object({
    language: z.string().optional(),
    theme: z.string().optional(),
    autoScrollEnabled: z.boolean().optional(),
    autoScrollSpeed: z.number().min(10).max(100).optional(),
})

type AccountFormValues = z.infer<typeof accountFormSchema>

// ...

export function AccountForm({ user }: { user: any }) {
    const router = useRouter()
    const { setTheme } = useTheme()
    const { user: authUser } = useAuth() // No openUserProfile in firebase
    const { setLanguage, t } = useLanguage()

    // Load auto-scroll settings from localStorage
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(() => {
        if (typeof window === 'undefined') return true;
        const saved = localStorage.getItem('famio-auto-scroll-enabled');
        return saved !== null ? saved === 'true' : true;
    });

    const [autoScrollSpeed, setAutoScrollSpeed] = useState(() => {
        if (typeof window === 'undefined') return 30;
        const saved = localStorage.getItem('famio-auto-scroll-speed');
        return saved !== null ? parseInt(saved, 10) : 30;
    });

    const form = useForm<AccountFormValues>({
        resolver: zodResolver(accountFormSchema),
        defaultValues: {
            language: user.language || "en",
            theme: user.theme || "system",
            autoScrollEnabled,
            autoScrollSpeed,
        },
    })

    // Listen to theme changes from the form to update live
    const themeValue = form.watch("theme");
    useEffect(() => {
        if (themeValue) {
            setTheme(themeValue);
        }
    }, [themeValue, setTheme]);

    async function onSubmit(data: AccountFormValues) {
        try {
            // Save auto-scroll settings to localStorage
            if (data.autoScrollEnabled !== undefined) {
                localStorage.setItem('famio-auto-scroll-enabled', String(data.autoScrollEnabled));
                setAutoScrollEnabled(data.autoScrollEnabled);
            }
            if (data.autoScrollSpeed !== undefined) {
                localStorage.setItem('famio-auto-scroll-speed', String(data.autoScrollSpeed));
                setAutoScrollSpeed(data.autoScrollSpeed);
            }

            await updateAccountSettings(data)
            // Also update client-side theme
            if (data.theme) {
                setTheme(data.theme)
            }
            if (data.language) {
                setLanguage(data.language as 'en' | 'es')
            }
            toast.success("Account settings updated")
            router.refresh()
        } catch {
            toast.error("Failed to update settings")
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("settings.account.title")}</CardTitle>
                <CardDescription>
                    {t("settings.account.desc")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
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
                                    <FormDescription>
                                        {t("settings.language.desc")}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
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
                                    <FormDescription>
                                        {t("settings.theme.desc")}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        </FormField>

                    {/* Feed Preferences Section */}
                    <div className="space-y-6 pt-6 border-t">
                        <div>
                            <h3 className="text-lg font-medium">Feed Preferences</h3>
                            <p className="text-sm text-muted-foreground">Configure your auto-scrolling experience</p>
                        </div>

                        <FormField
                            control={form.control}
                            name="autoScrollEnabled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Auto-Scroll Feeds</FormLabel>
                                        <FormDescription>
                                            Automatically scroll through your feed and profiles
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="autoScrollSpeed"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Scroll Speed</FormLabel>
                                        <span className="text-sm text-muted-foreground">{field.value} px/s</span>
                                    </div>
                                    <FormControl>
                                        <Slider
                                            min={10}
                                            max={100}
                                            step={5}
                                            value={[field.value || 30]}
                                            onValueChange={(values) => field.onChange(values[0])}
                                            className="w-full"
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Adjust how fast the feed scrolls automatically (10-100 pixels per second)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Security Section Removed - Managed via Firebase Auth directly */}

                    <Button type="submit">{t("settings.updateAccount")}</Button>
                </form>
            </Form>
        </CardContent>
        </Card >
    )
}
