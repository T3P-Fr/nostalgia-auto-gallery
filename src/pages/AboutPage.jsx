import { BadgeCheck, Heart, MapPin } from "lucide-react";
import { ButtonLink, PageHero, SectionHeading } from "../components/Ui.jsx";

const commitments = [
    {
        title: "Expertise & rigueur",
        description:
            "Une approche professionnelle et minutieuse pour proposer des prestations adaptées à l’état du véhicule et au résultat recherché.",
        icon: BadgeCheck,
    },
    {
        title: "Passion automobile",
        description:
            "Chaque véhicule reçoit la même attention, qu’il s’agisse d’un entretien esthétique, d’une vente ou d’un projet de passionné.",
        icon: Heart,
    },
    {
        title: "Proximité & mobilité",
        description:
            "Basé à Parignargues, le service se déplace à domicile ou sur le lieu convenu dans le Gard et, selon le projet, dans les départements voisins.",
        icon: MapPin,
    },
];

/**
 * Raconte l'origine de l'entreprise et présente ses engagements.
 * @returns {JSX.Element} La page de présentation de Nostalgia Auto Gallery.
 */
export default function AboutPage() {
    return (
        <>
            <PageHero
                image="/assets/context.jpg"
                eyebrow="À propos"
                title={<>la passion,<br />mise à votre <em>service</em>.</>}
                description="Nostalgia Auto Gallery est né à Parignargues d’une passion profonde pour l’automobile et du goût du travail réalisé avec soin."
            >
                <div className="hero__actions">
                    <ButtonLink to="/rendez-vous">Échanger sur mon véhicule →</ButtonLink>
                </div>
            </PageHero>

            <section className="container">
                <SectionHeading
                    overline="Nostalgia Auto Gallery"
                    title="bien plus qu’un moyen de transport"
                    description="Une voiture peut être un objet du quotidien, un souvenir ou un projet. Dans chaque cas, elle mérite une attention adaptée, des gestes précis et un regard honnête."
                    split
                />
                <div className="nav-grid">
                    <article className="card nav-card">
                        <img src="/assets/peugeot-front.jpg" alt="Peugeot 205 rouge" />
                        <div className="content">
                            <h2>Deux expertises</h2>
                            <p>
                                Le soin et la préparation esthétique, puis l’achat,
                                la vente et la recherche de solutions automobiles.
                            </p>
                            <ButtonLink size="small" to="/prestations">
                                Voir les prestations →
                            </ButtonLink>
                        </div>
                    </article>
                    <article className="card nav-card">
                        <img src="/assets/context.jpg" alt="Véhicules suivis par Nostalgia Auto Gallery" />
                        <div className="content">
                            <h2>Un suivi personnel</h2>
                            <p>
                                Corentin Jammes accompagne chaque demande avec un
                                regard attentif et une réponse adaptée au projet.
                            </p>
                            <ButtonLink size="small" to="/negoce-auto">
                                Découvrir le négoce →
                            </ButtonLink>
                        </div>
                    </article>
                    <article className="card nav-card">
                        <img src="/assets/nissan-dusk2.jpg" alt="Nissan 200SX préparée" />
                        <div className="content">
                            <h2>La passion du détail</h2>
                            <p>
                                Chaque véhicule mérite une approche précise, qu’il
                                s’agisse d’un entretien, d’une rénovation ou d’une
                                vente.
                            </p>
                            <ButtonLink size="small" to="/galerie">
                                Voir la galerie →
                            </ButtonLink>
                        </div>
                    </article>
                </div>
            </section>

            <section className="section--surface">
                <div className="container">
                    <SectionHeading
                        overline="Pourquoi me choisir ?"
                        title="trois engagements"
                        description="Une même exigence guide chaque intervention et chaque projet automobile."
                    />
                    <div className="service-grid">
                    {commitments.map((commitment) => {
                        const Icon = commitment.icon;

                        return (
                            <article className="card service-card" key={commitment.title}>
                                <span className="icon-tile">
                                    <Icon />
                                </span>
                                <h3>{commitment.title}</h3>
                                <p>{commitment.description}</p>
                                <div className="service-card__footer">
                                    <strong>Nostalgia</strong>
                                </div>
                            </article>
                        );
                    })}
                    </div>
                    <div className="card beyond-card">
                        <strong>Un projet automobile ?</strong>
                        <span>
                            Detailing, vente, achat ou recherche de pièces : échangeons
                            directement sur votre besoin.
                        </span>
                        <ButtonLink size="small" to="/rendez-vous">
                            Me contacter →
                        </ButtonLink>
                    </div>
                </div>
            </section>
        </>
    );
}
