import { Check, Plus } from "lucide-react";
import { ButtonLink, PageHero } from "../components/Ui.jsx";
import { pricingGroups, pricingOptions } from "../data.js";

/**
 * Affiche les formules détaillées issues de la maquette tarifs.
 * @returns {JSX.Element} La page des tarifs.
 */
export default function PricingPage() {
    return (
        <>
            <PageHero
                image="/assets/nissan-dusk.jpg"
                eyebrow="Tarifs & formules"
                title={<>des prix clairs,<br />sans <em>surprise</em>.</>}
                description="Trois formules par prestation. Chaque palier reprend tout le précédent et y ajoute son lot de soins."
            >
                <div className="hero__actions">
                    <ButtonLink to="/rendez-vous">Prendre rendez-vous →</ButtonLink>
                </div>
            </PageHero>

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
                    <span className="overline">À la carte</span>
                    <h2>options & suppléments</h2>
                    <p>
                        Complétez votre formule selon l’état du véhicule et le
                        résultat recherché.
                    </p>
                </div>
                <div className="option-list">
                    {pricingOptions.map(([option, price]) => (
                        <span key={option}>
                            {option}
                            <strong>{price}</strong>
                        </span>
                    ))}
                </div>
                <p className="options-card__note">
                    Les véhicules utilitaires d’entreprise sont proposés uniquement
                    sur devis.
                </p>
                <ButtonLink to="/rendez-vous">Demander un devis →</ButtonLink>
            </section>
        </>
    );
}
