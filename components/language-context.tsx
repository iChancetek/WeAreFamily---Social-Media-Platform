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
        "nav.profile": "Profile",
        "settings.profile.title": "Profile Information",
        "settings.profile.desc": "Update your photo and personal details.",
        "settings.account.title": "Account Settings",
        "settings.account.desc": "Manage your preferences and security.",
        "settings.displayName": "Display Name",
        "settings.displayName.desc": "This is how other family members will see you.",
        "settings.bio": "Bio",
        "settings.bio.desc": "A short description about yourself.",
        "settings.profilePic": "Profile Picture",
        "settings.cover": "Cover Photo/Video",
        "settings.updateProfile": "Update Profile",
        "settings.language": "Language",
        "settings.language.desc": "Choose your preferred language.",
        "settings.theme": "Theme",
        "settings.theme.desc": "Select a visual style.",
        "settings.updateAccount": "Save Settings",
        "btn.save": "Save",
        "btn.cancel": "Cancel",
        "btn.post": "Post",
        "btn.share": "Share",
        "btn.comment": "Comment"
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
        "nav.profile": "Perfil",
        "settings.profile.title": "Información del Perfil",
        "settings.profile.desc": "Actualiza tu foto y detalles personales.",
        "settings.account.title": "Ajustes de Cuenta",
        "settings.account.desc": "Gestiona tus preferencias y seguridad.",
        "settings.displayName": "Nombre Distintivo",
        "settings.displayName.desc": "Así es como te verán otros miembros de la familia.",
        "settings.bio": "Biografía",
        "settings.bio.desc": "Una breve descripción sobre ti.",
        "settings.profilePic": "Foto de Perfil",
        "settings.cover": "Foto/Vídeo de Portada",
        "settings.updateProfile": "Actualizar Perfil",
        "settings.language": "Idioma",
        "settings.language.desc": "Elige tu idioma preferido.",
        "settings.theme": "Tema",
        "settings.theme.desc": "Selecciona un estilo visual.",
        "settings.updateAccount": "Guardar Ajustes",
        "btn.save": "Guardar",
        "btn.cancel": "Cancelar",
        "btn.post": "Publicar",
        "btn.share": "Compartir",
        "btn.comment": "Comentar"
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
    const { user, profile } = useAuth();

    useEffect(() => {
        if (profile?.language && (profile.language === 'en' || profile.language === 'es')) {
            setLanguageState(profile.language as Language);
        }
    }, [profile]);

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
