import { PageHero, SectionHeading, ServiceCard } from "../components/Ui.jsx";
import { pages, services } from "../data.js";

// Contenu centralisé (cf. content.json → pages.services).
const { hero, actions, heading, beyond } = pages.services;

/**
 * Présente les prestations sur une page indépendante.
 * @returns {JSX.Element} La page des prestations.
 */
export default function ServicesPage() {
    return (
        <>
            <PageHero {...hero} actions={actions} />

            <section className="container">
                <SectionHeading {...heading} split />
                <div className="service-grid">
                    {services.map((service) => (
                        <ServiceCard key={service.title} service={service} />
                    ))}
                </div>
                <div className="card beyond-card">
                    <strong>{beyond.title}</strong>
                    <span>{beyond.text}</span>
                </div>
            </section>
        </>
    );
}
