import { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'en' | 'es' | 'fr' | 'de';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
    en: {
        dashboard: "Dashboard",
        explore: "Explore Hotels",
        bookings: "My Bookings",
        saved: "Saved Hotels",
        lang: "Language Settings",
        history: "Payment History",
        settings: "Settings",
        logout: "Logout",
        searchPlaceholder: "Search...",
        notifications: "Notifications",
        profile: "Profile"
    },
    es: {
        dashboard: "Panel",
        explore: "Explorar Hoteles",
        bookings: "Mis Reservas",
        saved: "Hoteles Guardados",
        lang: "Ajustes de Idioma",
        history: "Historial de Pagos",
        settings: "Configuración",
        logout: "Cerrar Sesión",
        searchPlaceholder: "Buscar...",
        notifications: "Notificaciones",
        profile: "Perfil"
    },
    fr: {
        dashboard: "Tableau de Bord",
        explore: "Explorer Hôtels",
        bookings: "Mes Réservations",
        saved: "Hôtels Enregistrés",
        lang: "Paramètres de Langue",
        history: "Historique des Paiements",
        settings: "Paramètres",
        logout: "Déconnexion",
        searchPlaceholder: "Rechercher...",
        notifications: "Notifications",
        profile: "Profil"
    },
    de: {
        dashboard: "Dashboard",
        explore: "Hotels Entdecken",
        bookings: "Meine Buchungen",
        saved: "Gespeicherte Hotels",
        lang: "Spracheinstellungen",
        history: "Zahlungsverlauf",
        settings: "Einstellungen",
        logout: "Abmelden",
        searchPlaceholder: "Suchen...",
        notifications: "Benachrichtigungen",
        profile: "Profil"
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    const t = (key: string) => {
        return translations[language][key] || key;
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
