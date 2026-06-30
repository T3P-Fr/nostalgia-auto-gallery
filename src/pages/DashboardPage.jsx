import { useState } from "react";
import { CalendarClock, Images, LayoutGrid, LogOut, Sparkles, Tag } from "lucide-react";
import { isAuthenticated, logout } from "../dashboard/directusClient.js";
import DashboardLogin from "../dashboard/DashboardLogin.jsx";
import RealisationsSection from "../dashboard/sections/RealisationsSection.jsx";
import GallerySection from "../dashboard/sections/GallerySection.jsx";

// Définition du menu latéral : une entrée par section gérable. `key` identifie la
// section active ; `icon` est un composant lucide ; `available` indique si la
// section est déjà implémentée (sinon on affiche un message « à venir »).
const SECTIONS = [
    { key: "realisations", label: "Réalisations", icon: Sparkles, available: true },
    { key: "gallery", label: "Galerie", icon: Images, available: true },
    { key: "forfaits", label: "Forfaits", icon: Tag, available: false },
    { key: "disponibilites", label: "Disponibilités", icon: CalendarClock, available: false },
];

/**
 * Page racine du Dashboard du gérant. Affiche l'écran de connexion tant qu'aucune
 * session n'est ouverte, puis la coque (menu latéral + section active). Espace
 * volontairement séparé du site public (pas d'en-tête/pied de page du site).
 * @returns {JSX.Element} Le Dashboard ou l'écran de connexion.
 */
export default function DashboardPage() {
    // État de connexion, initialisé selon la présence d'un jeton en stockage.
    const [authenticated, setAuthenticated] = useState(() => isAuthenticated());
    // Clé de la section actuellement affichée (par défaut : Réalisations).
    const [activeSection, setActiveSection] = useState("realisations");

    /**
     * Déconnecte le gérant et revient à l'écran de connexion.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function handleLogout() {
        await logout();
        setAuthenticated(false);
    }

    // Tant que non connecté : on n'affiche que le formulaire de connexion.
    if (!authenticated) {
        return <DashboardLogin onAuthenticated={() => setAuthenticated(true)} />;
    }

    // Métadonnées de la section active (pour le titre et l'état « disponible »).
    const currentSection = SECTIONS.find((section) => section.key === activeSection);

    return (
        <div className="dashboard">
            {/* Menu latéral : marque + navigation entre sections + déconnexion. */}
            <aside className="dashboard-sidebar">
                <div className="dashboard-brand">
                    <LayoutGrid className="dashboard-brand__mark" />
                    <div>
                        <strong>Nostalgia</strong>
                        <span>Espace gérant</span>
                    </div>
                </div>

                <nav className="dashboard-nav">
                    {SECTIONS.map((section) => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.key}
                                type="button"
                                className={`dashboard-nav__item${section.key === activeSection ? " is-active" : ""}`}
                                onClick={() => setActiveSection(section.key)}
                                title={section.available ? `Gérer : ${section.label}` : `${section.label} — bientôt disponible`}
                            >
                                <Icon />
                                {section.label}
                            </button>
                        );
                    })}
                </nav>

                <button type="button" className="dashboard-nav__logout" onClick={handleLogout} title="Fermer votre session et revenir à l’écran de connexion">
                    <LogOut /> Déconnexion
                </button>
            </aside>

            {/* Zone principale : la section choisie. */}
            <main className="dashboard-main">
                {/* Section Réalisations (avant/après). */}
                {activeSection === "realisations" && <RealisationsSection />}

                {/* Section Galerie (photos mises en avant). */}
                {activeSection === "gallery" && <GallerySection />}

                {/* Sections à venir : message d'attente pour les briques suivantes. */}
                {currentSection && !currentSection.available && (
                    <div className="dashboard-section">
                        <div className="dashboard-section__head">
                            <h2>{currentSection.label}</h2>
                        </div>
                        <div className="empty-state">Cette section arrive bientôt.</div>
                    </div>
                )}
            </main>
        </div>
    );
}
