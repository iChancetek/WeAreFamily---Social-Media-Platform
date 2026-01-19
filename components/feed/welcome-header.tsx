"use client"

import { useLanguage } from "@/components/language-context"

interface WelcomeHeaderProps {
    displayName: string;
}

export function WelcomeHeader({ displayName }: WelcomeHeaderProps) {
    const { t } = useLanguage()

    const welcomeText = t("home.welcome");
    const name = displayName.split(' ')[0]

    return (
        <h1 className="text-3xl font-bold mb-6 text-primary animate-in fade-in slide-in-from-left-4 duration-700">
            {welcomeText} {name}!
        </h1>
    )
}
