import { Check, Plus } from "lucide-react";
import { ButtonLink, PageHero } from "../components/Ui.jsx";
import { pages, pricingGroups, pricingOptions } from "../data.js";

// Contenu centralisé (cf. content.json → pages.pricing + pricing.*).
const { hero, actions, options } = pages.pricing;

/**
 * Affiche les formules détaillées issues de la plaquette tarifs.
 * @returns {JSX.Element} La page des tarifs.
 */
export default function PricingPage() {
    return (
        <>
            <PageHero {...hero} actions={actions} />

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
                                    <div className="price"><strong>{tier.price}</strong> €</div>
                                    {tier.includes ? (
                                        <div className="includes">
                                            <Plus />Tout le {tier.includes}, et en plus :
                                        </div>
                                    ) : (
                                        <div className="base-label">La formule de base</div>
                                    )}
                                    <ul>
                                        {tier.features.map((feature) => (
                                            <li key={feature}><Check />{feature}</li>
                                        ))}
                                    </ul>
                                    <ButtonLink
                                        block
                                        to={`/rendez-vous?service=${encodeURIComponent(service)}`}
                                    >
                                        Réserver →
                                    </ButtonLink>
                                </article>
                            );
                        })}
                    </div>
                </section>
            ))}

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
                <ButtonLink to="/rendez-vous">{options.cta}</ButtonLink>
            </section>
        </>
    );
}
