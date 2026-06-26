import { X } from "lucide-react";
import { useRef, useState } from "react";
import {
    BeforeAfterComparison,
    ButtonLink,
    PageHero,
    SectionHeading,
} from "../components/Ui.jsx";
import { galleryItems, pages } from "../data.js";

// Contenu centralisé (cf. content.json → pages.gallery).
const {
    hero,
    actions,
    heading,
    beforeAfter,
    reviewsHeading,
    reviews,
    transparency,
    final,
} = pages.gallery;

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
 * Page Réalisations : avant/après sélectionnable, galerie zoomable (modal natif),
 * avis clients et note de transparence.
 * @returns {JSX.Element} La page des réalisations.
 */
export default function GalleryPage() {
    // Exemple avant/après actuellement affiché dans le grand comparateur.
    const [activeSet, setActiveSet] = useState(0);
    // Photo affichée en plein écran dans le <dialog> (null = fermé).
    const [zoomed, setZoomed] = useState(null);

    const comparisonRef = useRef(null);
    const dialogRef = useRef(null);

    /**
     * Sélectionne un exemple avant/après et fait défiler vers le grand comparateur.
     * @param {number} index Indice de l'exemple choisi.
     * @returns {void} Aucune valeur de retour.
     */
    function showBeforeAfter(index) {
        setActiveSet(index);
        comparisonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    /**
     * Ouvre une photo en plein écran via le modal natif <dialog>.
     * @param {string} source URL de l'image à agrandir.
     * @param {string} title Légende de l'image.
     * @returns {void} Aucune valeur de retour.
     */
    function openZoom(source, title) {
        setZoomed({ source, title });
        dialogRef.current?.showModal();
    }

    /**
     * Ferme le modal plein écran.
     * @returns {void} Aucune valeur de retour.
     */
    function closeZoom() {
        dialogRef.current?.close();
    }

    const current = beforeAfter[activeSet];

    return (
        <>
            <PageHero {...hero} actions={actions} />

            <section className="container">
                <SectionHeading {...heading} />

                {/* Grand comparateur avant/après, piloté par l'exemple sélectionné. */}
                <div ref={comparisonRef}>
                    <BeforeAfterComparison
                        before={current.before}
                        after={current.after}
                        label={current.label}
                    />
                </div>

                {/* Cartes d'exemples (même style que la galerie) : une seule image,
                    surmontée des pills « Avant / Après ». Un clic défile vers le
                    grand comparateur et y charge l'exemple choisi. */}
                <div className="gallery-grid ba-grid">
                    {beforeAfter.map((set, index) => (
                        <button
                            type="button"
                            key={set.label}
                            className={`ba-card${index === activeSet ? " is-active" : ""}`}
                            onClick={() => showBeforeAfter(index)}
                            aria-label={`Voir l’avant / après — ${set.label}`}
                        >
                            <img src={set.after} alt={`Avant / après — ${set.label}`} loading="lazy" />
                            <span className="ba-card__pills">
                                <span className="pill">Avant</span>
                                <span className="pill">Après</span>
                            </span>
                            <span className="ba-card__caption">
                                <strong>{set.label}</strong>
                                <span>avant / après</span>
                            </span>
                        </button>
                    ))}
                </div>

                {/* Galerie : chaque photo s'ouvre en plein écran au clic. */}
                <div className="gallery-grid">
                    {galleryItems.map(([image, title, subtitle]) => {
                        const source = resolveImageSource(image);
                        return (
                            <figure key={image}>
                                <button
                                    type="button"
                                    className="gallery-zoom"
                                    onClick={() => openZoom(source, title)}
                                    aria-label={`Agrandir : ${title}`}
                                >
                                    <img src={source} alt={title} loading="lazy" />
                                </button>
                                <figcaption>
                                    <strong>{title}</strong>
                                    <span>{subtitle}</span>
                                </figcaption>
                            </figure>
                        );
                    })}
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

            {/* Modal plein écran natif : visualisation d'une photo + bouton Fermer. */}
            <dialog ref={dialogRef} className="image-modal" onClose={() => setZoomed(null)}>
                {zoomed && (
                    <figure className="image-modal__content">
                        <img src={zoomed.source} alt={zoomed.title} />
                        <figcaption>{zoomed.title}</figcaption>
                    </figure>
                )}
                <button type="button" className="image-modal__close bluredBckg" onClick={closeZoom}>
                    <X /> Fermer
                </button>
            </dialog>
        </>
    );
}
