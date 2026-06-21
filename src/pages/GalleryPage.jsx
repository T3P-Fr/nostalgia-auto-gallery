import {
    BeforeAfterComparison,
    ButtonLink,
    PageHero,
    SectionHeading,
} from "../components/Ui.jsx";
import { galleryItems } from "../data.js";

/**
 * Regroupe le comparateur et les photos sur une page dédiée.
 * @returns {JSX.Element} La page galerie.
 */
export default function GalleryPage() {
    return (
        <>
            <PageHero
                image="/assets/nissan-dusk2.jpg"
                eyebrow="Galerie"
                title={<>la différence<br />se <em>voit</em>.</>}
                description="Une sélection de véhicules, de détails et de visuels fournis par Nostalgia Auto Gallery."
            >
                <div className="hero__actions">
                    <ButtonLink to="/rendez-vous">Confier mon véhicule →</ButtonLink>
                </div>
            </PageHero>

            <section className="section container">
                <SectionHeading
                    overline="Avant / Après"
                    title="retrouver l’éclat"
                    description="Glissez le curseur pour visualiser le résultat recherché après une préparation esthétique complète."
                />
                <BeforeAfterComparison />
                <div className="gallery-grid">
                    {galleryItems.map(([image, title, subtitle]) => (
                        <figure key={image}>
                            <img src={`/assets/${image}`} alt={title} />
                            <figcaption>
                                <strong>{title}</strong>
                                <span>{subtitle}</span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </section>
        </>
    );
}
