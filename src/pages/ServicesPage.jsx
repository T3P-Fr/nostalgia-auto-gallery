import { ButtonLink, PageHero, SectionHeading, ServiceCard } from "../components/Ui.jsx";
import { services } from "../data.js";

/**
 * Présente les prestations sur une page indépendante.
 * @returns {JSX.Element} La page des prestations.
 */
export default function ServicesPage() {
    return (
        <>
            <PageHero
                image="/assets/nissan-front.jpg"
                eyebrow="Prestations"
                title={<>trois pôles,<br />une même <em>exigence</em>.</>}
                description="Du soin de l’habitacle à la rénovation complète, chaque intervention est réalisée à la main avec des produits professionnels."
            >
                <div className="hero__actions">
                    <ButtonLink to="/rendez-vous">Choisir un créneau →</ButtonLink>
                    <ButtonLink variant="secondary" to="/tarifs">Voir les tarifs</ButtonLink>
                </div>
            </PageHero>

            <section className="section container">
                <SectionHeading
                    overline="Detailing à domicile"
                    title="le bon soin, au bon niveau"
                    description="Standard, Platine ou Premium : la formule s’adapte à l’état du véhicule, à son usage et au résultat recherché."
                    split
                />
                <div className="service-grid">
                    {services.map((service) => (
                        <ServiceCard key={service.title} service={service} />
                    ))}
                </div>
                <div className="beyond-card">
                    <strong>Au-delà du detailing</strong>
                    <span>
                        Achat et vente de véhicules · Pièces performance · Optiques et
                        sellerie · Protection céramique.
                    </span>
                </div>
            </section>
        </>
    );
}
