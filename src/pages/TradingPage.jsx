import { ShieldCheck } from "lucide-react";
import { ButtonLink, PageHero, SectionHeading } from "../components/Ui.jsx";

const tradingPages = [
    {
        title: "Véhicules",
        description:
            "Achat, vente et accompagnement autour de véhicules d’occasion sélectionnés avec attention.",
        image: "/assets/peugeot-front.jpg",
        to: "/vehicules",
    },
    {
        title: "Pièces & solutions",
        description:
            "Recherche de pièces détachées, de performance, d’optiques et de solutions de sellerie.",
        image: "/assets/engine.jpg",
        to: "/pieces-automobiles",
    },
    {
        title: "Préparation avant vente",
        description:
            "Une présentation esthétique soignée du véhicule pour le valoriser et permettre aux futurs acheteurs de l’examiner dans de bonnes conditions.",
        image: "/assets/nissan-dusk2.jpg",
        to: "/prestations",
    },
];

/**
 * Présente le second pilier de l'entreprise consacré au négoce automobile.
 * @returns {JSX.Element} La page d'achat, de vente et de recherche de pièces.
 */
export default function TradingPage() {
    return (
        <>
            <PageHero
                image="/assets/peugeot-side.jpg"
                eyebrow="Achat · Vente · Pièces"
                title={<>votre projet auto,<br />suivi avec <em>rigueur</em>.</>}
                description="Nostalgia Auto Gallery accompagne les particuliers et les passionnés dans l’achat, la vente et la recherche de solutions automobiles."
            >
                <div className="hero__actions">
                    <ButtonLink to="/rendez-vous">Parler de mon projet →</ButtonLink>
                    <ButtonLink variant="secondary" to="/galerie">
                        Voir les véhicules
                    </ButtonLink>
                </div>
            </PageHero>

            <section className="section container">
                <SectionHeading
                    overline="Négoce automobile"
                    title="une sélection attentive"
                    description="Chaque demande est étudiée individuellement. L’objectif est de proposer une solution cohérente, avec une attention particulière portée à l’état, à l’historique et à la qualité du véhicule ou de la pièce recherchée."
                    split
                />
                <div className="page-card-grid">
                    {tradingPages.map((page) => (
                        <article className="page-card" key={page.title}>
                            <img src={page.image} alt="" />
                            <div>
                                <h2>{page.title}</h2>
                                <p>{page.description}</p>
                                <ButtonLink size="small" to={page.to}>
                                    Découvrir →
                                </ButtonLink>
                            </div>
                        </article>
                    ))}
                </div>
                <div className="beyond-card">
                    <span className="icon-tile">
                        <ShieldCheck />
                    </span>
                    <strong>Une recherche particulière ?</strong>
                    <span>
                        Véhicule d’occasion, pièce spécifique ou préparation avant
                        vente : chaque demande fait l’objet d’une réponse
                        personnalisée.
                    </span>
                    <ButtonLink size="small" to="/rendez-vous">
                        Me contacter →
                    </ButtonLink>
                </div>
            </section>
        </>
    );
}
