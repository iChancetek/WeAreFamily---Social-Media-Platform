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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect } from "react"

const accountFormSchema = z.object({
    language: z.string().optional(),
    theme: z.string().optional(),
})

type AccountFormValues = z.infer<typeof accountFormSchema>

interface AccountFormProps {
    user: {
        id: string;
        language?: string | null;
        theme?: string | null;
    }
}

export function AccountForm({ user }: AccountFormProps) {
    const { setTheme } = useTheme()

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
            toast.success("Account settings updated")
        } catch {
            toast.error("Failed to update settings")
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                    Update your account preferences.
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
                                    <FormLabel>Language</FormLabel>
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
                                        This is the language that will be used in the dashboard.
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
                                    <FormLabel>Theme</FormLabel>
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
                                        Select the theme for the dashboard.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">Update account</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
