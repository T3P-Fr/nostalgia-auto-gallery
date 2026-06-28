import { ButtonLink, PageHero, SectionHeading } from "../components/Ui.jsx";
import { icons, pages } from "../data.js";

// Contenu centralisé (cf. content.json → pages.negoce).
const { hero, actions, sections, methodHeading, steps, footerLabel, beyond } =
    pages.negoce;

/**
 * Page Négoce : achat, vente, préparation avant vente et recherche de pièces.
 * @returns {JSX.Element} La page d'accompagnement des projets automobiles.
 */
export default function NegocePage() {
    const BeyondIcon = icons[beyond.icon];

    return (
        <>
            <PageHero {...hero} actions={actions} />

            {/* Les quatre volets de l'accompagnement, en sections lisibles. */}
            <section className="container">
                {sections.map((section) => (
                    <div className="lead-section" key={section.title}>
                        <SectionHeading
                            overline={section.overline}
                            title={section.title}
                            description={section.text}
                            split
                        />
                        <ButtonLink size="small" to={section.to}>
                            {section.cta}
                        </ButtonLink>
                    </div>
                ))}
            </section>

            {/* Méthode d'accompagnement en quatre étapes. */}
            <section className="section--surface bluredBackground--features">
                <div className="container">
                    <SectionHeading {...methodHeading} />
                    <div className="service-grid">
                        {steps.map((step) => {
                            const Icon = icons[step.icon];

                            return (
                                <article className="card bluredBackground--card service-card" key={step.title}>
                                    <span className="icon-tile">
                                        <Icon />
                                    </span>
                                    <h3>{step.title}</h3>
                                    <p>{step.description}</p>
                                    <div className="service-card__footer">
                                        <strong>{footerLabel}</strong>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Véhicules disponibles / appel à confier une recherche. */}
            <section className="container">
                <div className="card bluredBackground--card beyond-card">
                    <span className="icon-tile">
                        <BeyondIcon />
                    </span>
                    <strong>{beyond.title}</strong>
                    <span>{beyond.text}</span>
                    <ButtonLink size="small" to={beyond.to}>
                        {beyond.cta}
                    </ButtonLink>
                </div>
            </section>
        </>
    );
}
