import {
    Armchair,
    BadgeCheck,
    CarFront,
    ClipboardCheck,
    Cog,
    Droplets,
    Facebook,
    Gauge,
    Heart,
    Instagram,
    MapPin,
    PackageSearch,
    Search,
    ShieldCheck,
    Sparkles,
    Wrench,
} from "lucide-react";
import content from "./content.json";

/*
 * data.js est un fin ADAPTATEUR au-dessus de content.json : le contenu éditorial
 * (textes, images, tarifs) se modifie dans le JSON ; ici on se contente de le
 * ré-exposer et de rattacher les icônes — qui, étant des composants, ne peuvent
 * pas vivre dans un fichier de données pur.
 */

// Registre nom → composant d'icône (les icônes sont désignées par leur nom dans le JSON).
export const icons = {
    Armchair,
    BadgeCheck,
    CarFront,
    ClipboardCheck,
    Cog,
    Droplets,
    Facebook,
    Gauge,
    Heart,
    Instagram,
    MapPin,
    PackageSearch,
    Search,
    ShieldCheck,
    Sparkles,
    Wrench,
};

// Coordonnées et contenu de toutes les pages (héros, titres, cartes…).
export const site = content.site;
export const pages = content.pages;

// Listes partagées.
export const galleryItems = content.gallery;
export const interventionTowns = content.interventionTowns;

/*
 * SOURCE UNIQUE des tarifs : content.pricing. La page Tarifs l'utilise directement
 * (groupes/paliers), la page Contact en DÉRIVE sa grille de réservation ci-dessous.
 * Modifier un prix dans content.json se répercute donc sur les deux pages.
 */
const pricing = content.pricing;

/*
 * Pastille illustrant chaque niveau de detailing : l'icône (servie depuis /assets)
 * et la couleur d'identité, calquée sur la teinte dominante de l'icône.
 * Platine → étoile bronze, Premium → diamant argent, Deluxe → couronne or.
 * La couleur est aussi exposée en CSS (variables --tier-* / --level-color).
 */
// `count` : nombre d'icônes répétées (1 étoile, 2 diamants, 3 couronnes).
export const tierBadges = {
    Platine: { icon: "/assets/NAG--Platine.webp", color: "#c08a3e", count: 1 },
    Premium: { icon: "/assets/NAG--Premium.webp", color: "#9aa6b4", count: 2 },
    Deluxe: { icon: "/assets/NAG--Deluxe.webp", color: "#e0b020", count: 3 },
};

// Page Tarifs : groupes (avec paliers) et options au format [libellé, "30 €"].
export const pricingGroups = pricing.groups;
export const pricingOptions = pricing.options.map((option) => [
    option.label,
    `${option.price} €`,
]);

// Page Contact (étape « Formules »).
export const formulaLevels = pricing.levels;
export const comboDiscounts = pricing.comboDiscounts;
export const detailingOptions = pricing.options;

// Catégories de réservation construites depuis les mêmes groupes que la page Tarifs :
// prix et prestations viennent des paliers, les bonus/remises des métadonnées du groupe.
export const formulaCategories = pricing.groups.map((group) => ({
    key: group.key,
    label: group.title,
    bonusLabel: group.bonusLabel,
    discounts: group.discounts,
    prices: Object.fromEntries(group.tiers.map((tier) => [tier.tier, tier.price])),
    durations: Object.fromEntries(group.tiers.map((tier) => [tier.tier, tier.duration])),
    features: Object.fromEntries(group.tiers.map((tier) => [tier.tier, tier.features])),
    // Taux de remise par palier (méca uniquement) : « -50% » → 0.5. Appliqué au
    // prix du palier en lavage complet (la méca n'est plus offerte mais remisée).
    tierDiscounts: Object.fromEntries(
        group.tiers
            .filter((tier) => tier.discount)
            .map((tier) => [tier.tier, Math.abs(parseFloat(tier.discount)) / 100]),
    ),
}));

/*
 * Prix d'appel (« dès X € ») des cartes Prestations, DÉRIVÉS des tarifs de lavage
 * pour rester synchronisés avec content.pricing (source unique des prix) :
 *   - Intérieur / Extérieur → palier le moins cher de leur groupe ;
 *   - Complète → intérieur + extérieur au niveau le plus bas, moins la remise combinée.
 */
const minGroupPrice = (key) => {
    const group = pricing.groups.find((entry) => entry.key === key);
    return group ? Math.min(...group.tiers.map((tier) => tier.price)) : 0;
};
const interieurFrom = minGroupPrice("interieur");
const exterieurFrom = minGroupPrice("exterieur");
const lowestLevel = pricing.levels[0];
const completeFrom =
    interieurFrom + exterieurFrom - (pricing.comboDiscounts[lowestLevel] || 0);

// Prix d'appel du stat héros : le lavage le moins cher, tous groupes confondus.
export const cheapestWashFrom = `dès ${Math.min(interieurFrom, exterieurFrom)} €`;
// Prix d'appel par titre de prestation (repli sur la valeur du JSON si non géré).
const serviceFromByTitle = {
    Intérieur: interieurFrom,
    Extérieur: exterieurFrom,
    Complète: completeFrom,
};

/*
 * Lien de réservation par prestation : ouvre la page RDV sur l'onglet « lavage »
 * avec le(s) lavage(s) correspondant(s) pré-sélectionné(s) au niveau le moins cher
 * (premier palier). « Complète » pré-coche intérieur ET extérieur.
 */
const baseLevel = pricing.levels[0];
const serviceBookingByTitle = {
    Intérieur: `besoin=lavage&interieur=${baseLevel}`,
    Extérieur: `besoin=lavage&exterieur=${baseLevel}`,
    Complète: `besoin=lavage&interieur=${baseLevel}&exterieur=${baseLevel}`,
};

// Prestations : icône (nom → composant), prix d'appel dynamique et lien de réservation.
export const services = content.services.map((service) => ({
    ...service,
    icon: icons[service.icon],
    from:
        serviceFromByTitle[service.title] != null
            ? `dès ${serviceFromByTitle[service.title]} €`
            : service.from,
    to: serviceBookingByTitle[service.title]
        ? `/contact?${serviceBookingByTitle[service.title]}`
        : `/contact?service=${encodeURIComponent(service.title)}`,
}));
