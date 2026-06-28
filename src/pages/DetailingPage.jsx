import { Check, Plus } from "lucide-react";
import {
    ButtonLink,
    PageHero,
    SectionHeading,
    ServiceCard,
} from "../components/Ui.jsx";
import { TierBadges } from "../components/TierBadges.jsx";
import { pages, pricingGroups, pricingOptions, services } from "../data.js";

// Contenu centralisé (cf. content.json → pages.detailing + services + pricing.*).
// Page « argent » : elle fusionne l'ancienne page Prestations et l'ancienne page Tarifs.
const { hero, actions, typeHeading, pricingHeading, options, faq, final } =
    pages.detailing;

// Les lavages (Intérieur/Extérieur) sont de vraies formules ; la méca est un COMPLÉMENT
// qui ne peut être pris qu'avec au moins un lavage. On les présente donc séparément.
const washGroups = pricingGroups.filter((group) => group.key !== "meca");
const mecaGroup = pricingGroups.find((group) => group.key === "meca");

/**
 * Page Detailing : choix du type de prestation, formules détaillées, options et FAQ.
 * @returns {JSX.Element} La page Detailing.
 */
export default function DetailingPage() {
    return (
        <>
            <PageHero {...hero} actions={actions} />

            {/* Section 1 — Choisir son type de prestation (intérieur / extérieur / complète). */}
            <section className="container">
                <SectionHeading {...typeHeading} split />
                <div className="service-grid">
                    {services.map((service) => (
                        <ServiceCard key={service.title} service={service} />
                    ))}
                </div>
            </section>

            {/* Section 2 — Les formules détaillées (lavages uniquement). */}
            <section className="container">
                <SectionHeading {...pricingHeading} split />
            </section>
            {washGroups.map((group) => (
                <section className="pricing-section container" key={group.title}>
                    <div className="pricing-title">
                        <h2>{group.title}</h2>
                        <span>{group.subtitle}</span>
                    </div>
                    <div className="pricing-grid">
                        {group.tiers.map((tier) => {
                            const service = `${group.title} — ${tier.tier} · ${tier.price} €`;
                            return (
                                <article
                                    className={`card bluredBackground--card price-card price-card--${tier.tier.toLowerCase()} ${tier.tier === "Premium" ? "price-card--featured" : ""}`}
                                    key={tier.tier}
                                >
                                    <div className="price-card__top">
                                        <span className="price-card__ident">
                                            {/* Icônes du niveau (1 étoile / 2 diamants / 3 couronnes). */}
                                            <TierBadges tier={tier.tier} />
                                            <strong>{tier.tier}</strong>
                                        </span>
                                        <span>{tier.duration}</span>
                                    </div>
                                    {/* Prix à gauche, bouton « Réserver » compact à droite. */}
                                    <div className="price-row">
                                        <div className="price">
                                            <strong>{tier.price}</strong> €
                                        </div>
                                        <ButtonLink
                                            size="small"
                                            to={`/contact?service=${encodeURIComponent(service)}`}
                                        >
                                            Réserver →
                                        </ButtonLink>
                                    </div>
                                    {tier.includes ? (
                                        <div className="includes">
                                            <Plus />
                                            Tout le {tier.includes}, et en plus :
                                        </div>
                                    ) : (
                                        <div className="base-label">La formule de base</div>
                                    )}
                                    <ul>
                                        {tier.features.map((feature) => (
                                            <li key={feature}>
                                                <Check />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            );
                        })}
                    </div>
                </section>
            ))}

            {/* Complément méca : présenté comme un ajout conditionné à un lavage,
                et non comme une formule autonome (cf. son prix réservation). */}
            {mecaGroup && (
                <section className="pricing-section container">
                    <div className="pricing-title">
                        <h2>{mecaGroup.title}</h2>
                        <span>{mecaGroup.subtitle}</span>
                    </div>
                    <p className="meca-condition">{mecaGroup.condition}</p>
                    <div className="pricing-grid">
                        {mecaGroup.tiers.map((tier) => (
                            <article
                                className={`card bluredBackground--card price-card price-card--${tier.tier.toLowerCase()}`}
                                key={tier.tier}
                            >
                                <div className="price-card__top">
                                    <span className="price-card__ident">
                                        <TierBadges tier={tier.tier} />
                                        <strong>{tier.tier}</strong>
                                    </span>
                                    <span>{tier.duration}</span>
                                </div>
                                <div className="price-row">
                                    {/* « + » : c'est un complément qui s'ajoute à un lavage. */}
                                    <div className="price">
                                        + <strong>{tier.price}</strong> €
                                    </div>
                                </div>
                                {tier.includes ? (
                                    <div className="includes">
                                        <Plus />
                                        Tout le {tier.includes}, et en plus :
                                    </div>
                                ) : (
                                    <div className="base-label">Le complément de base</div>
                                )}
                                <ul>
                                    {tier.features.map((feature) => (
                                        <li key={feature}>
                                            <Check />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {/* Section 3 — Options et suppléments à la carte. */}
            <section className="options-card container">
                <div>
                    <span className="overline">{options.overline}</span>
                    <h2>{options.title}</h2>
                    <p>{options.text}</p>
                </div>
                <div className="option-list">
                    {pricingOptions.map(([option, price]) => (
                        <span key={option}>
                            {option}
                            <strong>{price}</strong>
                        </span>
                    ))}
                </div>
                <p className="options-card__note">{options.note}</p>
                <ButtonLink to="/contact">{options.cta}</ButtonLink>
            </section>

            {/* Section 4 — Questions fréquentes. */}
            <section className="container">
                <SectionHeading overline={faq.overline} title={faq.title} split />
                <div className="faq-list">
                    {faq.items.map((item) => (
                        <details className="faq-item" key={item.question}>
                            <summary>{item.question}</summary>
                            <div className="faq-item__answer">
                                <p>{item.answer}</p>
                            </div>
                        </details>
                    ))}
                </div>
            </section>

            {/* Section 5 — Appel à l'action final. */}
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
