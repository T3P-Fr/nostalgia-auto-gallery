import { Link } from "react-router-dom";

/**
 * Logo de la marque (emblème + nom typographique), cliquable vers l'accueil.
 *
 * Partagé entre l'en-tête et le pied de page ; la variante `footer` agrandit
 * seulement l'emblème.
 * @param {{ footer?: boolean }} props `footer` pour la variante du pied de page.
 * @returns {JSX.Element} Le logo de la marque.
 */
export function Brand({ footer = false }) {
    return (
        <Link className="brand" to="/">
            <img
                src="/assets/logo.webp"
                alt="Nostalgia Auto Gallery"
                className={footer ? "brand__image brand__image--footer" : "brand__image"}
            />
            <span className="brand__words">
                <span className="brand__name">
                    nostalgia<span>.</span>
                </span>
                <span className="brand__subtitle">AUTO GALLERY</span>
            </span>
        </Link>
    );
}
