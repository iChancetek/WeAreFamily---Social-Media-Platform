"use client"

import { useLanguage } from "@/components/language-context"

interface WelcomeHeaderProps {
    displayName: string;
}

export function WelcomeHeader({ displayName }: WelcomeHeaderProps) {
    const { language } = useLanguage()

    const welcomeText = language === 'es' ? 'Bienvenido a Casa' : 'Welcome Home';
    const name = displayName.split(' ')[0]

    return (
        <h1 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-gray-600 dark:from-white dark:via-blue-100 dark:to-gray-400 animate-in fade-in slide-in-from-left-4 duration-700">
            {welcomeText}, {name}!
        </h1>
    )
}
