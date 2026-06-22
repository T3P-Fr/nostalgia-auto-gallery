import { ButtonLink, PageHero, SectionHeading } from "../components/Ui.jsx";
import { icons, pages } from "../data.js";

// Contenu centralisé (cf. content.json → pages.trading).
const { hero, actions, heading, cards, beyond } = pages.trading;

/**
 * Présente le second pilier de l'entreprise consacré au négoce automobile.
 * @returns {JSX.Element} La page d'achat, de vente et de recherche de pièces.
 */
export default function TradingPage() {
    const BeyondIcon = icons[beyond.icon];

    return (
        <>
            <PageHero {...hero} actions={actions} />

            <section className="container">
                <SectionHeading {...heading} split />
                <div className="nav-grid">
                    {cards.map((card) => (
                        <article className="card nav-card" key={card.title}>
                            <img src={card.image} alt={card.title} />
                            <div className="content">
                                <h2>{card.title}</h2>
                                <p>{card.description}</p>
                                <ButtonLink size="small" to={card.to}>
                                    Découvrir →
                                </ButtonLink>
                            </div>
                        </article>
                    ))}
                </div>
                <div className="card beyond-card">
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
