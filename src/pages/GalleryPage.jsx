import { Eye, X } from "lucide-react";
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

// Avant/après mis en avant (Hero) : l'intérieur de la Nissan. Il n'apparaît donc
// PAS dans la liste (pour ne pas l'avoir en double).
const heroSet =
    beforeAfter.find((set) => set.label === "Intérieur") ?? beforeAfter[0];

/*
 * Liste de réalisations : avant/après (hors Hero) ET photos, mêmes vignettes.
 * L'ordre viendra du serveur ; ici on concatène. Chaque vignette porte un type qui
 * décide du plein écran : un comparateur (« ba ») ou une image simple (« photo »).
 */
const tiles = [
    ...beforeAfter
        .filter((set) => set !== heroSet)
        .map((set) => ({
            type: "ba",
            key: `ba-${set.label}`,
            thumb: set.after,
            before: set.before,
            after: set.after,
            label: set.label,
            caption: set.label,
            subtitle: "avant / après",
        })),
    ...galleryItems.map(([image, title, subtitle]) => ({
        type: "photo",
        key: image,
        thumb: resolveImageSource(image),
        source: resolveImageSource(image),
        caption: title,
        subtitle,
    })),
];

/**
 * Page Réalisations : une galerie unique. Chaque vignette révèle un œil au survol
 * (curseur loupe) et s'ouvre en plein écran au clic — image ou comparateur.
 * @returns {JSX.Element} La page des réalisations.
 */
export default function GalleryPage() {
    // Vignette affichée en plein écran dans le <dialog> (null = fermé).
    const [viewer, setViewer] = useState(null);
    const dialogRef = useRef(null);

    /**
     * Ouvre une vignette en plein écran via le modal natif <dialog>.
     * @param {object} tile Vignette à afficher (type « ba » ou « photo »).
     * @returns {void} Aucune valeur de retour.
     */
    function openViewer(tile) {
        setViewer(tile);
        dialogRef.current?.showModal();
    }

    /**
     * Ferme le modal plein écran.
     * @returns {void} Aucune valeur de retour.
     */
    function closeViewer() {
        dialogRef.current?.close();
    }

    /**
     * Ferme le modal lorsqu'on clique en dehors du contenu (fond du <dialog>).
     * @param {import("react").MouseEvent} event Évènement de clic sur le dialog.
     * @returns {void} Aucune valeur de retour.
     */
    function handleDialogClick(event) {
        if (event.target === dialogRef.current) {
            closeViewer();
        }
    }

    return (
        <>
            <PageHero {...hero} actions={actions} />

            <section className="container">
                <SectionHeading {...heading} />

                {/* Hero : un seul avant/après mis en avant (l'intérieur de la Nissan). */}
                <BeforeAfterComparison
                    before={heroSet.before}
                    after={heroSet.after}
                    label={heroSet.label}
                />

                {/* Réalisations : photos et avant/après mélangés. Œil au survol
                    (curseur loupe), clic = plein écran. */}
                <div className="gallery-grid">
                    {tiles.map((tile) => (
                        <figure key={tile.key}>
                            <button
                                type="button"
                                className="gallery-zoom"
                                onClick={() => openViewer(tile)}
                                aria-label={`Voir en plein écran : ${tile.caption}`}
                            >
                                {tile.type === "ba" ? (
                                    // Miniature figée : moitié avant / moitié après + pastilles
                                    // dans les angles (comme le grand comparateur, mais statique).
                                    <span className="ba-thumb">
                                        <img className="ba-thumb__img" src={tile.before} alt="" loading="lazy" />
                                        <img className="ba-thumb__img ba-thumb__img--after" src={tile.after} alt={tile.caption} loading="lazy" />
                                        <span className="ba-thumb__tag ba-thumb__tag--before">Avant</span>
                                        <span className="ba-thumb__tag ba-thumb__tag--after">Après</span>
                                    </span>
                                ) : (
                                    <img src={tile.thumb} alt={tile.caption} loading="lazy" />
                                )}
                                <span className="gallery-zoom__eye" aria-hidden="true">
                                    <Eye />
                                </span>
                            </button>
                            <figcaption>
                                <strong>{tile.caption}</strong>
                                <span>{tile.subtitle}</span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </section>

            {/* Avis clients authentiques. */}
            <section className="section--surface bluredBackground--features">
                <div className="container">
                    <SectionHeading {...reviewsHeading} />
                    <div className="service-grid">
                        {reviews.map((review) => (
                            <article className="card bluredBackground--card review-card" key={review.author}>
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
                <div className="card bluredBackground--card beyond-card">
                    <strong>{transparency.title}</strong>
                    <span>{transparency.text}</span>
                </div>
            </section>

            {/* Appel à l'action final. */}
            <section className="container">
                <div className="card bluredBackground--card beyond-card">
                    <strong>{final.title}</strong>
                    <span>{final.text}</span>
                    <ButtonLink size="small" to={final.to}>
                        {final.cta}
                    </ButtonLink>
                </div>
            </section>

            {/* Modal plein écran natif : image OU comparateur. Fermeture au clic sur
                le fond ou sur la croix (cercle en haut à droite). */}
            <dialog
                ref={dialogRef}
                className="image-modal"
                onClose={() => setViewer(null)}
                onClick={handleDialogClick}
            >
                <button
                    type="button"
                    className="image-modal__close"
                    onClick={closeViewer}
                    aria-label="Fermer"
                >
                    <X />
                </button>

                {viewer?.type === "ba" && (
                    <div className="image-modal__content image-modal__content--ba">
                        <BeforeAfterComparison
                            before={viewer.before}
                            after={viewer.after}
                            label={viewer.label}
                        />
                        <p className="image-modal__caption">{viewer.label} — avant / après</p>
                    </div>
                )}

                {viewer?.type === "photo" && (
                    <figure className="image-modal__content">
                        <img src={viewer.source} alt={viewer.caption} />
                        <figcaption>{viewer.caption}</figcaption>
                    </figure>
                )}
            </dialog>
        </>
    );
}
