import { ClipboardCheck, Search, Sparkles } from "lucide-react";
import { ButtonLink, PageHero, SectionHeading } from "../components/Ui.jsx";

const vehicleSteps = [
    {
        title: "Sélection",
        description:
            "Chaque véhicule est considéré selon son état général, son historique et la cohérence du projet.",
        icon: Search,
    },
    {
        title: "Présentation",
        description:
            "Une préparation esthétique permet de présenter le véhicule proprement et de valoriser ses qualités réelles.",
        icon: Sparkles,
    },
    {
        title: "Accompagnement",
        description:
            "La demande est étudiée individuellement afin de proposer une réponse adaptée à l’achat ou à la vente.",
        icon: ClipboardCheck,
    },
];

/**
 * Présente l'activité d'achat et de vente de véhicules d'occasion.
 * @returns {JSX.Element} La page consacrée aux véhicules.
 */
export default function VehiclesPage() {
    return (
        <>
            <PageHero
                image="/assets/peugeot-front.jpg"
                eyebrow="Véhicules d’occasion"
                title={<>acheter ou vendre,<br />avec un regard <em>passionné</em>.</>}
                description="Nostalgia Auto Gallery étudie les projets d’achat et de vente avec une attention particulière portée à l’état, à l’historique et à la qualité de chaque automobile."
            >
                <div className="hero__actions">
                    <ButtonLink to="/rendez-vous">Présenter mon véhicule →</ButtonLink>
                    <ButtonLink variant="secondary" to="/galerie">
                        Voir la galerie
                    </ButtonLink>
                </div>
            </PageHero>

            <section className="container">
                <SectionHeading
                    overline="Achat & vente"
                    title="une approche attentive"
                    description="Il ne s’agit pas d’afficher un stock fictif : les véhicules disponibles et les recherches en cours sont communiqués directement selon les projets."
                    split
                />
                <div className="service-grid">
                    {vehicleSteps.map((step) => {
                        const Icon = step.icon;

                        return (
                            <article className="card service-card" key={step.title}>
                                <span className="icon-tile">
                                    <Icon />
                                </span>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                                <div className="service-card__footer">
                                    <strong>Sur demande</strong>
                                </div>
                            </article>
                        );
                    })}
                </div>
                <div className="card beyond-card">
                    <strong>Vous avez un véhicule à vendre ?</strong>
                    <span>
                        Indiquez le modèle, l’année, l’état et les informations dont
                        vous disposez pour permettre une première étude.
                    </span>
                    <ButtonLink size="small" to="/rendez-vous">
                        Présenter le véhicule →
                    </ButtonLink>
                </div>
            </section>
        </>
    );
}
