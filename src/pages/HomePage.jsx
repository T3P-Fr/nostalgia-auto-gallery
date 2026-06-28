import {
    BeforeAfterComparison,
    ButtonLink,
    PageHero,
    SectionHeading,
    ServiceCard,
    ZonePanel,
} from "../components/Ui.jsx";
import { cheapestWashFrom, icons, pages, services } from "../data.js";

// Contenu éditorial centralisé (cf. content.json → pages.home).
const { hero, actions, stats: rawStats, trust, heading, comparison, process, about, final } =
    pages.home;

// Le stat « soin esthétique » affiche dynamiquement le lavage le moins cher
// (dérivé des tarifs), pour rester synchronisé avec content.pricing.
const stats = rawStats.map((stat) =>
    stat.label === "soin esthétique" ? { ...stat, value: cheapestWashFrom } : stat,
);

/**
 * Page d'accueil v3 : promesse, aperçu des formules, preuve avant/après,
 * déroulement, zone d'intervention et appel à réserver. Recentrée sur la conversion.
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

            {/* Bandeau de réassurance. */}
            <section className="trust-strip bluredBackground--features">
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

            {/* Aperçu des trois formules (le détail vit sur la page Detailing). */}
            <section className="container">
                <SectionHeading {...heading} split />
                <div className="service-grid">
                    {services.map((service) => (
                        <ServiceCard key={service.title} service={service} />
                    ))}
                </div>
                <div className="card bluredBackground--card beyond-card">
                    <span>{heading.beyond.text}</span>
                    {/* Les deux piliers restent accessibles sans alourdir la section. */}
                    <div className="beyond-card__actions">
                        <ButtonLink size="small" to={heading.beyond.primaryTo}>
                            {heading.beyond.primaryCta}
                        </ButtonLink>
                        <ButtonLink
                            size="small"
                            variant="secondary"
                            to={heading.beyond.secondaryTo}
                        >
                            {heading.beyond.secondaryCta}
                        </ButtonLink>
                    </div>
                </div>
            </section>

            {/* Preuve visuelle : comparateur avant / après. */}
            <section className="container">
                <SectionHeading
                    overline={comparison.overline}
                    title={comparison.title}
                    description={comparison.description}
                    split
                />
                <BeforeAfterComparison />
                <div className="card bluredBackground--card beyond-card">
                    <ButtonLink size="small" to={comparison.to}>
                        {comparison.cta}
                    </ButtonLink>
                </div>
            </section>

            {/* Déroulement d'une intervention en quatre étapes. */}
            <section className="section--surface bluredBackground--features">
                <div className="container">
                    <SectionHeading
                        overline={process.overline}
                        title={process.title}
                    />
                    <div className="service-grid">
                        {process.steps.map((step) => {
                            const Icon = icons[step.icon];
                            return (
                                <article className="card bluredBackground--card service-card" key={step.title}>
                                    <span className="icon-tile">
                                        <Icon />
                                    </span>
                                    <h3>{step.title}</h3>
                                    <p>{step.description}</p>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Zone d'intervention (SEO local). */}
            <ZonePanel />

            {/* Présentation « À propos » en bas de page → renvoie vers la page dédiée. */}
            <section className="container">
                <article className="card bluredBackground--card nav-card nav-card--wide">
                    <img src={about.image} alt="Corentin Jammes — Nostalgia Auto Gallery" />
                    <div className="content">
                        <span className="overline">{about.overline}</span>
                        <h2>{about.title}</h2>
                        <p>{about.text}</p>
                        <ButtonLink size="small" to={about.to}>
                            {about.cta}
                        </ButtonLink>
                    </div>
                </article>
            </section>

            {/* Appel à l'action final. */}
            <section className="container">
                <div className="card bluredBackground--card beyond-card">
                    <strong>{final.title}</strong>
                    <span>{final.text}</span>
                    <ButtonLink size="small" to={final.to}>
                        {final.cta}
                    </ButtonLink>
                </div>
            </section>
        </>
    );
}
