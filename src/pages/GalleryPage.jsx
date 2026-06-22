import {
    BeforeAfterComparison,
    PageHero,
    SectionHeading,
} from "../components/Ui.jsx";
import { galleryItems, pages } from "../data.js";

// Contenu centralisé (cf. content.json → pages.gallery).
const { hero, actions, heading } = pages.gallery;

/**
 * Regroupe le comparateur et les photos sur une page dédiée.
 * @returns {JSX.Element} La page galerie.
 */
export default function GalleryPage() {
    return (
        <>
            <PageHero {...hero} actions={actions} />

            <section className="container">
                <SectionHeading {...heading} />
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
