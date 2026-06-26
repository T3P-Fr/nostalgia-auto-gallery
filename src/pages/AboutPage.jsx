import { ButtonLink, PageHero, SectionHeading } from "../components/Ui.jsx";
import { icons, pages } from "../data.js";

// Contenu centralisé (cf. content.json → pages.about).
const { hero, actions, heading, cards, surface } = pages.about;

// Icône de la section secondaire « Au-delà du detailing » (achat/vente discret).
const BeyondIcon = icons[surface.beyond.icon];

/**
 * Raconte l'origine de l'entreprise et présente ses engagements.
 * @returns {JSX.Element} La page de présentation de Nostalgia Auto Gallery.
 */
export default function AboutPage() {
    return (
        <>
            <PageHero {...hero} actions={actions} />

            <section className="container">
                <SectionHeading {...heading} split />
                <div className="nav-grid">
                    {cards.map((card) => (
                        <article className="card nav-card" key={card.title}>
                            <img src={card.image} alt={card.alt} />
                            <div className="content">
                                <h2>{card.title}</h2>
                                <p>{card.text}</p>
                                <ButtonLink size="small" to={card.to}>
                                    {card.cta}
                                </ButtonLink>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="section--surface">
                <div className="container">
                    <SectionHeading {...surface.heading} />
                    <div className="service-grid">
                        {surface.commitments.map((commitment) => {
                            const Icon = icons[commitment.icon];

                            return (
                                <article className="card service-card" key={commitment.title}>
                                    <span className="icon-tile">
                                        <Icon />
                                    </span>
                                    <h3>{commitment.title}</h3>
                                    <p>{commitment.description}</p>
                                    <div className="service-card__footer">
                                        <strong>{surface.footerLabel}</strong>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                    <div className="card beyond-card">
                        {surface.beyond.icon && (
                            <span className="icon-tile">
                                <BeyondIcon />
                            </span>
                        )}
                        <strong>{surface.beyond.title}</strong>
                        <span>{surface.beyond.text}</span>
                        <ButtonLink size="small" to={surface.beyond.to}>
                            {surface.beyond.cta}
                        </ButtonLink>
                    </div>
                </div>
            </section>
        </>
    );
}
