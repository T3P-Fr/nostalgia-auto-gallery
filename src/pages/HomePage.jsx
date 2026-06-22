import {BadgeCheck, Droplets, Gauge, MapPin} from "lucide-react";
import {ButtonLink, PageHero, SectionHeading} from "../components/Ui.jsx";

const pageCards = [
    {
        title: "Prestations",
        description: "Découvrez les trois pôles de soin et les niveaux de finition.",
        image: "/assets/nissan-front.jpg",
        to: "/prestations",
    },
    {
        title: "Négoce auto",
        description:
            "Accédez aux pages dédiées aux véhicules et aux pièces automobiles.",
        image: "/assets/peugeot-side.jpg",
        to: "/negoce-auto",
    },
    {
        title: "Galerie",
        description: "Avant, après et détails de véhicules qui méritent toute notre attention.",
        image: "/assets/nissan-dusk2.jpg",
        to: "/galerie",
    },
    {
        title: "Tarifs",
        description: "Des formules lisibles, de l’entretien essentiel à la rénovation complète.",
        image: "/assets/engine.jpg",
        to: "/tarifs",
    },
    {
        title: "À propos",
        description:
            "Découvrez l’histoire, les engagements et les deux piliers de l’entreprise.",
        image: "/assets/context.jpg",
        to: "/a-propos",
    },
];

/**
 * Sert de porte d'entrée vers les différentes pages de l'application.
 * @returns {JSX.Element} La page d'accueil.
 */
export default function HomePage() {
    return (
        <>
            <PageHero
                image="/assets/hero-night.jpg"
                eyebrow="Detailing · négoce · solutions automobiles"
                title={<>le soin que mérite<br />chaque <em>légende</em>.</>}
                description="Lavage à la main, rénovation esthétique et protection céramique — directement chez vous, autour de Parignargues."
            >
                <div className="hero__actions">
                    <ButtonLink to="/rendez-vous">Prendre rendez-vous →</ButtonLink>
                    <ButtonLink variant="secondary" to="/tarifs">
                        Voir les formules
                    </ButtonLink>
                </div>
                <div className="hero__stats">
                    <div><strong>15 km</strong><span>déplacement offert</span></div>
                    <div><strong>dès 65 €</strong><span>la formule</span></div>
                    <div><strong>à domicile</strong><span>service itinérant</span></div>
                </div>
            </PageHero>

            <section className="trust-strip">
                <div className="container trust-grid">
                    <span><Gauge /> Lavage 100 % à la main</span>
                    <span><Droplets /> Vapeur & produits pro</span>
                    <span><MapPin /> Déplacement offert 15 km</span>
                    <span><BadgeCheck /> Devis personnalisé</span>
                </div>
            </section>

            <section className="container">
                <SectionHeading
                    overline="Nostalgia Auto Gallery"
                    title="choisissez votre route"
                    description="Detailing, négoce automobile ou projet particulier : découvrez l’accompagnement adapté à votre véhicule."
                    split
                />
                <div className="nav-grid">
                    {pageCards.map((page) => (
                        <article className="card nav-card" key={page.title}>
                            <img src={page.image} alt={page.title} />
                            <div className="content">
                                <h2>{page.title}</h2>
                                <p>{page.description}</p>
                                <ButtonLink size="small" to={page.to}>
                                    Découvrir →
                                </ButtonLink>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </>
    );
}
