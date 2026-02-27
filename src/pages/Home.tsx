import { useState } from "react"
import {
    LayoutDashboard,
    Compass,
    CalendarDays,
    Heart,
    Globe,
    CreditCard,
    Settings,
    LogOut
} from "lucide-react"
import { Dock } from "@/components/Dock"
import { useLanguage } from "@/context/LanguageContext"
import { HeroCarousel } from "@/components/HeroCarousel"

export function Home() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const { t } = useLanguage();

    const dockItems = [
        { icon: LayoutDashboard, label: t('dashboard'), onClick: () => setActiveTab("dashboard") },
        { icon: Compass, label: t('explore'), onClick: () => setActiveTab("explore") },
        { icon: CalendarDays, label: t('bookings'), onClick: () => setActiveTab("bookings") },
        { icon: Heart, label: t('saved'), onClick: () => setActiveTab("saved") },
        { icon: Globe, label: t('lang'), onClick: () => setActiveTab("lang") },
        { icon: CreditCard, label: t('history'), onClick: () => setActiveTab("history") },
        { icon: Settings, label: t('settings'), onClick: () => setActiveTab("settings") },
        { icon: LogOut, label: t('logout'), onClick: () => setActiveTab("logout") },
    ]

    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-800">
            <div className="w-24 bg-transparent z-10 relative">
                <Dock items={dockItems} />
            </div>

            <main className="flex-1 overflow-hidden relative z-0 flex flex-col pt-4 pr-4 pb-4 bg-slate-50">
                <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-100/50 flex flex-col overflow-hidden ring-1 ring-slate-900/5">
                    <div className="flex-1 overflow-y-auto w-full relative">
                        <div className="max-w-7xl mx-auto px-8 md:px-12 pt-8 pb-16">
                            <h1 className="text-4xl font-light tracking-tight text-slate-900 mb-8 capitalize">
                                {t(activeTab)}
                            </h1>
                            {activeTab === 'dashboard' && <HeroCarousel />}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
