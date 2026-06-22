import { ButtonLink, PageHero, SectionHeading } from "../components/Ui.jsx";
import { icons, pages } from "../data.js";

// Contenu centralisé (cf. content.json → pages.parts).
const { hero, actions, heading, steps, footerLabel, beyond } = pages.parts;

/**
 * Présente l'activité de recherche de pièces et de solutions automobiles.
 * @returns {JSX.Element} La page consacrée aux pièces automobiles.
 */
export default function PartsPage() {
    return (
        <>
            <PageHero {...hero} actions={actions} />

            <section className="container">
                <SectionHeading {...heading} split />
                <div className="service-grid">
                    {steps.map((step) => {
                        const Icon = icons[step.icon];

                        return (
                            <article className="card service-card" key={step.title}>
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
                <div className="card beyond-card">
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
