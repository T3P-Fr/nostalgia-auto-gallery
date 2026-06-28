import { tierBadges } from "../data.js";

/**
 * Affiche les icônes répétées d'un niveau de detailing (1 étoile pour Platine,
 * 2 diamants pour Premium, 3 couronnes pour Deluxe). Utilisé partout où un niveau
 * est présenté (cartes tarifaires, boutons de formule du formulaire de réservation).
 * @param {object} props Propriétés.
 * @param {string} props.tier Nom du niveau (Platine/Premium/Deluxe).
 * @param {boolean} [props.small] Variante compacte (icônes plus petites).
 * @returns {JSX.Element|null} Le groupe d'icônes, ou null si le niveau est inconnu.
 */
export function TierBadges({ tier, small = false }) {
    const badge = tierBadges[tier];

    if (!badge) {
        return null;
    }

    return (
        <span className="tier-badges">
            {/* Une icône par unité de `count` : la quantité illustre la montée en gamme. */}
            {Array.from({ length: badge.count }, (_, index) => (
                <img
                    key={index}
                    className={`tier-badge${small ? " tier-badge--sm" : ""}`}
                    src={badge.icon}
                    alt=""
                    loading="lazy"
                />
            ))}
        </span>
    );
}
