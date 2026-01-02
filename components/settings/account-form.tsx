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
import { useEffect } from "react"
import { useAuth } from "@/components/auth-provider"

const accountFormSchema = z.object({
    language: z.string().optional(),
    theme: z.string().optional(),
})

type AccountFormValues = z.infer<typeof accountFormSchema>

// ...

export function AccountForm({ user }: { user: any }) {
    const router = useRouter()
    const { setTheme } = useTheme()
    const { user: authUser } = useAuth() // No openUserProfile in firebase
    const { setLanguage, t } = useLanguage()

    const form = useForm<AccountFormValues>({
        resolver: zodResolver(accountFormSchema),
        defaultValues: {
            language: user.language || "en",
            theme: user.theme || "system",
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
                        />

                        {/* Security Section Removed - Managed via Firebase Auth directly */}

                        <Button type="submit">{t("settings.updateAccount")}</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
