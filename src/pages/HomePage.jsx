import { ButtonLink, PageHero, SectionHeading } from "../components/Ui.jsx";
import { icons, pages } from "../data.js";

// Contenu éditorial centralisé (cf. content.json → pages.home).
const { hero, actions, stats, trust, heading, cards } = pages.home;

/**
 * Sert de porte d'entrée vers les différentes pages de l'application.
 * @returns {JSX.Element} La page d'accueil.
 */
export default function HomePage() {
    return (
        <>
            <PageHero {...hero} actions={actions}>
                <div className="hero__stats">
                    {stats.map((stat) => (
                        <div key={stat.label}>
                            <strong>{stat.value}</strong>
                            <span>{stat.label}</span>
                        </div>
                    ))}
                </div>
            </PageHero>

            <section className="trust-strip">
                <div className="container trust-grid">
                    {trust.map((item) => {
                        const Icon = icons[item.icon];
                        return (
                            <span key={item.label}>
                                <Icon /> {item.label}
                            </span>
                        );
                    })}
                </div>
            </section>

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
            </section>
        </>
    );
}
