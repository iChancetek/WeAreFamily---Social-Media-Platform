'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { updateAccountSettings } from '@/app/actions/settings';

type Language = 'en' | 'es';

const dictionaries = {
    en: {
        "nav.home": "Home",
        "nav.family": "Family",
        "nav.groups": "Groups",
        "nav.branding": "Branding",
        "nav.messages": "Messages",
        "nav.events": "Events",
        "nav.gallery": "Gallery",
        "nav.stories": "My Life",
        "nav.admin": "Admin",
        "nav.settings": "Settings",
        "nav.signout": "Sign Out",
        "nav.profile": "Profile",
        "nav.notifications": "Notifications",
        "feed.placeholder": "What's on your mind?",
        "feed.post": "Post",
        "feed.repost": "Repost",
        "feed.repost.success": "Reposted to your feed!",
        "feed.share.copy": "Copy Link",
        "feed.share.external": "Share Externally",
        "feed.comment.placeholder": "Write a comment...",
        "feed.empty": "No posts yet. Start the conversation!",
        "profile.title": "Profile",
        "profile.bio": "Bio",
        "profile.family": "Family Members",
        "profile.edit": "Edit Profile",
        "profile.back": "Back",
        "profile.save": "Save Changes",
        "profile.update.success": "Profile updated successfully",
        "profile.update.error": "Failed to update profile",
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
        "settings.security.password.btn": "Change Password (Send Email)",
        "settings.security.password.success": "Password reset email sent!",
        "btn.save": "Save",
        "btn.cancel": "Cancel",
        "btn.post": "Post",
        "btn.share": "Share",
        "btn.comment": "Comment"
    },
    es: {
        "nav.home": "Inicio",
        "nav.family": "Familia",
        "nav.groups": "Grupos",
        "nav.branding": "Branding",
        "nav.messages": "Mensajes",
        "nav.events": "Eventos",
        "nav.gallery": "Galería",
        "nav.stories": "Mi Vida",
        "nav.admin": "Administrar",
        "nav.settings": "Ajustes",
        "nav.signout": "Cerrar Sesión",
        "nav.profile": "Perfil",
        "nav.notifications": "Notificaciones",
        "feed.placeholder": "¿Qué tienes en mente?",
        "feed.post": "Publicar",
        "feed.repost": "Compartir",
        "feed.repost.success": "¡Re-publicado en tu muro!",
        "feed.share.copy": "Copiar Enlace",
        "feed.share.external": "Compartir Externamente",
        "feed.comment.placeholder": "Escribe un comentario...",
        "feed.empty": "Aún no hay publicaciones. ¡Comienza la conversación!",
        "profile.title": "Perfil",
        "profile.bio": "Biografía",
        "profile.family": "Miembros de la Familia",
        "profile.edit": "Editar Perfil",
        "profile.back": "Volver",
        "profile.save": "Guardar Cambios",
        "profile.update.success": "Perfil actualizado correctamente",
        "profile.update.error": "Error al actualizar el perfil",
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
        "settings.security.password.btn": "Cambiar Contraseña (Enviar Email)",
        "settings.security.password.success": "¡Email de restablecimiento enviado!",
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
