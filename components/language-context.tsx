"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

type Language = 'en' | 'es';

type Translations = {
    [key: string]: string;
}

const dictionaries: Record<Language, Translations> = {
    en: {
        "nav.home": "Home",
        "nav.admin": "Admin Console",
        "nav.messages": "Messages",
        "nav.gallery": "Gallery",
        "nav.events": "Events",
        "nav.family": "Family",
        "nav.profile": "Profile",
        "nav.settings": "Settings",
        "nav.signout": "Sign Out",
        "settings.updated": "Account settings updated",
        "settings.profile.title": "Profile",
        "settings.profile.desc": "Update your public profile information.",
        "settings.displayName": "Display Name",
        "settings.displayName.desc": "This is your public display name.",
        "settings.bio": "Bio",
        "settings.bio.desc": "Tell us a little bit about yourself.",
        "settings.cover": "Cover Photo / Video",
        "settings.profilePic": "Profile Picture / Video",
        "settings.updateProfile": "Update profile",
        "settings.account.title": "Account",
        "settings.account.desc": "Update your account preferences.",
        "settings.language": "Language",
        "settings.language.desc": "This is the language that will be used in the dashboard.",
        "settings.theme": "Theme",
        "settings.theme.desc": "Select the theme for the dashboard.",
        "settings.security": "Security",
        "settings.security.desc": "Change your password, enable 2FA, and manage connected accounts.",
        "settings.manageSecurity": "Manage Password & Security",
        "settings.updateAccount": "Update account",
    },
    es: {
        "nav.home": "Inicio",
        "nav.admin": "Consola de Admin",
        "nav.messages": "Mensajes",
        "nav.gallery": "Galería",
        "nav.events": "Eventos",
        "nav.family": "Familia",
        "nav.profile": "Perfil",
        "nav.settings": "Ajustes",
        "nav.signout": "Cerrar Sesión",
        "settings.updated": "Configuración actualizada",
        "settings.profile.title": "Perfil",
        "settings.profile.desc": "Actualiza tu información pública de perfil.",
        "settings.displayName": "Nombre Visible",
        "settings.displayName.desc": "Este es tu nombre público.",
        "settings.bio": "Biografía",
        "settings.bio.desc": "Cuéntanos un poco sobre ti.",
        "settings.cover": "Foto/Video de Portada",
        "settings.profilePic": "Foto/Video de Perfil",
        "settings.updateProfile": "Actualizar perfil",
        "settings.account.title": "Cuenta",
        "settings.account.desc": "Actualiza tus preferencias de cuenta.",
        "settings.language": "Idioma",
        "settings.language.desc": "Este es el idioma que se usará en el panel.",
        "settings.theme": "Tema",
        "settings.theme.desc": "Selecciona el tema para el panel.",
        "settings.security": "Seguridad",
        "settings.security.desc": "Cambia tu contraseña, activa 2FA y gestiona cuentas conectadas.",
        "settings.manageSecurity": "Gestionar Contraseña y Seguridad",
        "settings.updateAccount": "Actualizar cuenta",
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, defaultLanguage = 'en' }: { children: React.ReactNode, defaultLanguage?: string }) {
    const [language, setLanguage] = useState<Language>((defaultLanguage as Language) || 'en');

    const t = (key: string) => {
        return dictionaries[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
