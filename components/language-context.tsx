'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { updateAccountSettings } from '@/app/actions/settings';
import { dictionaries, DictionaryKey } from '@/lib/dictionaries';

type Language = keyof typeof dictionaries;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    t: (key: DictionaryKey) => string;
    dir: 'ltr' | 'rtl';
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
    const { user, profile } = useAuth();

    // Determine direction based on language
    const dir = language === 'ar' ? 'rtl' : 'ltr';

    useEffect(() => {
        // Sync language from profile on load
        if (profile?.language && Object.keys(dictionaries).includes(profile.language) && profile.language !== language) {
            setLanguageState(profile.language as Language);
        }
    }, [profile, language]);

    useEffect(() => {
        // Apply direction to document root
        document.documentElement.dir = dir;
        document.documentElement.lang = language;
    }, [dir, language]);

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        if (user) {
            try {
                await updateAccountSettings({ language: lang }); // ensure backend supports this string
            } catch (e) {
                console.error("Failed to sync language", e);
            }
        }
    };

    const t = (key: DictionaryKey) => {
        const dict = dictionaries[language];
        // fallback to english if key missing in target language
        // @ts-ignore
        return dict[key] || dictionaries['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
            {children}
        </LanguageContext.Provider>
    );
}
