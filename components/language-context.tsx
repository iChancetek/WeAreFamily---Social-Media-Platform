'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { updateAccountSettings } from '@/app/actions/settings';

type Language = 'en' | 'es';

const dictionaries = {
    en: {
        "nav.home": "Home",
        "nav.family": "Family",
        "nav.messages": "Messages",
        "nav.events": "Events",
        "nav.gallery": "Gallery",
        "nav.stories": "Stories",
        "nav.admin": "Admin",
        "nav.settings": "Settings",
        "nav.signout": "Sign Out",
        "nav.profile": "Profile"
    },
    es: {
        "nav.home": "Inicio",
        "nav.family": "Familia",
        "nav.messages": "Mensajes",
        "nav.events": "Eventos",
        "nav.gallery": "Galería",
        "nav.stories": "Historias",
        "nav.admin": "Administrar",
        "nav.settings": "Ajustes",
        "nav.signout": "Cerrar Sesión",
        "nav.profile": "Perfil"
    }
}

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');
    const { user } = useAuth();

    useEffect(() => {
        // Here we could fetch the user's preferred language from the database
        // via a server action if we wanted slightly better UX on load.
    }, [user]);

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        if (user) {
            try {
                await updateAccountSettings({ language: lang });
            } catch (e) {
                console.error("Failed to sync language", e);
            }
        }
    };

    const t = (key: string) => {
        // @ts-ignore
        return dictionaries[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}
