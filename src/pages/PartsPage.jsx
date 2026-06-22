import { Cog, PackageSearch, Wrench } from "lucide-react";
import { ButtonLink, PageHero, SectionHeading } from "../components/Ui.jsx";

const partsServices = [
    {
        title: "Pièces détachées",
        description:
            "Recherche de pièces automobiles adaptées à l’entretien, à la remise en état ou à un projet spécifique.",
        icon: PackageSearch,
    },
    {
        title: "Pièces performance",
        description:
            "Étude de solutions et d’éléments de performance cohérents avec le véhicule et l’usage recherché.",
        icon: Cog,
    },
    {
        title: "Optiques & sellerie",
        description:
            "Solutions de rénovation ou de remplacement pour les optiques, la sellerie et certains éléments de finition.",
        icon: Wrench,
    },
];

/**
 * Présente l'activité de recherche de pièces et de solutions automobiles.
 * @returns {JSX.Element} La page consacrée aux pièces automobiles.
 */
export default function PartsPage() {
    return (
        <>
            <PageHero
                image="/assets/engine.jpg"
                eyebrow="Pièces & solutions automobiles"
                title={<>la bonne solution,<br />pour votre <em>projet</em>.</>}
                description="Pièces détachées, éléments de performance, optiques ou sellerie : chaque recherche commence par l’identification précise du véhicule et du besoin."
            >
                <div className="hero__actions">
                    <ButtonLink to="/rendez-vous">Rechercher une pièce →</ButtonLink>
                    <ButtonLink variant="secondary" to="/negoce-auto">
                        Retour au négoce
                    </ButtonLink>
                </div>
            </PageHero>

            <section className="container">
                <SectionHeading
                    overline="Pièces automobiles"
                    title="une recherche sur mesure"
                    description="Aucun catalogue générique n’est inventé : la disponibilité, la compatibilité et le tarif sont étudiés à partir des références du véhicule."
                    split
                />
                <div className="service-grid">
                    {partsServices.map((service) => {
                        const Icon = service.icon;

                        return (
                            <article className="card service-card" key={service.title}>
                                <span className="icon-tile">
                                    <Icon />
                                </span>
                                <h3>{service.title}</h3>
                                <p>{service.description}</p>
                                <div className="service-card__footer">
                                    <strong>Sur devis</strong>
                                </div>
                            </article>
                        );
                    })}
                </div>
                <div className="card beyond-card">
                    <strong>Pour lancer une recherche</strong>
                    <span>
                        Précisez la marque, le modèle, l’année, la motorisation et la
                        pièce souhaitée, idéalement avec sa référence ou une photo.
                    </span>
                    <ButtonLink size="small" to="/rendez-vous">
                        Décrire mon besoin →
                    </ButtonLink>
                </div>
            </section>
        </>
    );
}
