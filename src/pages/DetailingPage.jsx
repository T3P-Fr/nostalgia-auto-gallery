import { Check, Plus } from "lucide-react";
import {
    ButtonLink,
    PageHero,
    SectionHeading,
    ServiceCard,
} from "../components/Ui.jsx";
import { pages, pricingGroups, pricingOptions, services } from "../data.js";

// Contenu centralisé (cf. content.json → pages.detailing + services + pricing.*).
// Page « argent » : elle fusionne l'ancienne page Prestations et l'ancienne page Tarifs.
const { hero, actions, typeHeading, pricingHeading, options, faq, final } =
    pages.detailing;

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

            {/* Section 2 — Les formules détaillées, source unique pricing.groups. */}
            <section className="container">
                <SectionHeading {...pricingHeading} split />
            </section>
            {pricingGroups.map((group) => (
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
                                    className={`card price-card ${tier.tier === "Premium" ? "price-card--featured" : ""}`}
                                    key={tier.tier}
                                >
                                    <div className="price-card__top">
                                        <strong>{tier.tier}</strong>
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
                        <details className="card faq-item" key={item.question}>
                            <summary>{item.question}</summary>
                            <p>{item.answer}</p>
                        </details>
                    ))}
                </div>
            </section>

            {/* Section 5 — Appel à l'action final. */}
            <section className="container">
                <div className="card beyond-card">
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
