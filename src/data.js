import {
    Armchair,
    BadgeCheck,
    CarFront,
    ClipboardCheck,
    Cog,
    Droplets,
    Gauge,
    Heart,
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
    Gauge,
    Heart,
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
}));

// Prestations : on remplace le NOM d'icône par le composant correspondant.
export const services = content.services.map((service) => ({
    ...service,
    icon: icons[service.icon],
}));
