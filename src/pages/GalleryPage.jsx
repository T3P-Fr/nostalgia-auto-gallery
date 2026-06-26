import {
    BeforeAfterComparison,
    ButtonLink,
    PageHero,
    SectionHeading,
} from "../components/Ui.jsx";
import { galleryItems, pages } from "../data.js";

// Contenu centralisé (cf. content.json → pages.gallery).
const { hero, actions, heading, reviewsHeading, reviews, transparency, final } =
    pages.gallery;

/**
 * Résout la source d'une image de galerie : URL distante (placeholder) telle quelle,
 * sinon fichier local du dossier /assets.
 * @param {string} image Nom de fichier local ou URL complète.
 * @returns {string} L'URL d'image à utiliser dans le src.
 */
function resolveImageSource(image) {
    return image.startsWith("http") ? image : `/assets/${image}`;
}

/**
 * Page Réalisations : avant/après, galerie de photos, avis clients et transparence.
 * @returns {JSX.Element} La page des réalisations.
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
                            <img src={resolveImageSource(image)} alt={title} loading="lazy" />
                            <figcaption>
                                <strong>{title}</strong>
                                <span>{subtitle}</span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </section>

            {/* Avis clients authentiques. */}
            <section className="section--surface">
                <div className="container">
                    <SectionHeading {...reviewsHeading} />
                    <div className="service-grid">
                        {reviews.map((review) => (
                            <article className="card review-card" key={review.author}>
                                <p className="review-card__quote">« {review.quote} »</p>
                                <div className="review-card__author">
                                    <strong>{review.author}</strong>
                                    <span>{review.context}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Note de précision et transparence. */}
            <section className="container">
                <div className="card beyond-card">
                    <strong>{transparency.title}</strong>
                    <span>{transparency.text}</span>
                </div>
            </section>

            {/* Appel à l'action final. */}
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
