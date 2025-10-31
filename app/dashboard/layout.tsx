"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [menuOpen, setMenuOpen] = useState(true);
    const pathname = usePathname(); // Hook pour connaître la route actuelle

    const handleLogout = async () => {
        await signOut(auth);
        window.location.href = "/login";
    };

    // Fonction pour appliquer la classe active
    const getLinkClass = (href: string) =>
        `px-3 py-2 rounded hover:bg-gray-700 ${pathname === href ? "bg-gray-700 font-bold" : ""
        }`;

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className={`bg-gray-800 text-white w-64 p-6 flex flex-col ${menuOpen ? "block" : "hidden"} md:block`}>
                <h2 className="text-2xl font-bold mb-8">Smart Stock Box</h2>
                <nav className="flex flex-col space-y-3">
                    <a href="/dashboard/mouvement" className={getLinkClass("/dashboard/mouvement")}>Mouvement</a>
                    <a href="/dashboard/settings" className={getLinkClass("/dashboard/settings")}>Paramètres</a>
                    <a href="/dashboard/zone" className={getLinkClass("/dashboard/zone")}>Zone et Stock</a>
                    {/* <a href="/dashboard/users" className={getLinkClass("/dashboard/users")}>Utilisateurs</a> */}
                    
                    <button
                        onClick={handleLogout}
                        className="mt-6 bg-red-600 hover:bg-red-700 px-3 py-2 rounded"
                    >
                        Déconnexion
                    </button>
                </nav>
            </aside>

            {/* Contenu principal */}
            <main className="flex-1 p-6">
                <header className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold capitalize">
                        {pathname.split("/").pop() || "Dashboard"}
                    </h1>
                    <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? "Fermer" : "Menu"}
                    </button>
                </header>

                {/* Contenu dynamique */}
                {children}
            </main>
        </div>
    );
}
