/*
 * bookingHelpers.js — Cœur LOGIQUE (sans état ni JSX) de la page de réservation.
 *
 * On y rassemble :
 *   1. les CONSTANTES partagées du parcours (besoins, échelles, formulaire vierge…) ;
 *   2. les FONCTIONS PURES de calcul (dates, durées, créneaux, tarifs).
 *
 * Tout ce qui vit ici est déterministe et dépourvu de React : même entrée → même
 * sortie. L'objectif est double — alléger le composant de page et rendre cette
 * logique testable isolément (un simple import suffit, sans monter de composant).
 */

import {
    comboDiscounts,
    detailingOptions,
    formulaCategories,
    formulaLevels,
    pages,
} from "../data.js";

/* ------------------------------------------------------------------ *
 *  Constantes du parcours
 * ------------------------------------------------------------------ */

// Les trois besoins (lavage, achat/vente, pièces) pilotent tout le parcours.
export const needs = pages.booking.needs;

// Clés des besoins acceptées en pré-sélection via l'URL (?besoin=…).
export const needKeys = needs.map((need) => need.key);

// Échelle de délai partagée : projet véhicule (achat/vente) ET recherche de pièces.
export const delaiLevels = [
    "Pas pressé",
    "Sous quelques mois",
    "Sous quelques semaines",
    "Sous quelques jours",
];

// Initiales des jours de la semaine, lundi en tête (cohérent avec buildCalendar).
export const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

// Créneaux horaires proposés (doit refléter `allowedSlots` côté serveur). Sert de
// placeholder : on affiche cette grille DÉSACTIVÉE avant qu'une date soit choisie,
// afin d'éviter tout saut de mise en page à l'ouverture du popup d'agenda.
export const slotTimes = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
];

// Valeurs initiales du formulaire : contact commun + champs propres à chaque besoin.
export const initialForm = {
    name: "",
    phone: "",
    email: "",
    address: "",
    postalCode: "",
    city: "",
    vehicle: "",
    message: "",
    // Champs du projet achat/vente (ignorés hors de ce besoin).
    projet: "achat",
    budget: "",
    modele: "",
    annee: "",
    etat: "",
    delai: "Pas pressé",
    // Champs de la recherche de pièces.
    piece: "",
    reference: "",
    urgence: "Pas pressé",
};

// Aucune catégorie sélectionnée au départ (chaîne vide = aucun niveau pris).
export const emptyFormula = { interieur: "", exterieur: "", meca: "" };

// Économie maximale en ajoutant le second lavage (remise du plus haut niveau).
export const maxComboDiscount = Math.max(...Object.values(comboDiscounts));

// Lavages (Intérieur/Extérieur) et méca séparés : chacun a désormais son cadre.
export const washCategories = formulaCategories.filter((category) => category.key !== "meca");
export const mecaCategory = formulaCategories.find((category) => category.key === "meca");

/*
 * Plage de travail du prestataire. Sert à invalider un créneau dont la prestation
 * dépasserait l'heure de fermeture. Plage continue 08:00–19:00 : les créneaux
 * horaires (08:00 → 18:00, fournis par le backend) sont tous valides.
 */
export const workingPeriods = [
    { start: "08:00", end: "19:00" },
];

/* ------------------------------------------------------------------ *
 *  Dates & calendrier
 * ------------------------------------------------------------------ */

/**
 * Convertit une date locale en chaîne ISO sans décalage de fuseau.
 * @param {Date} date Date locale à convertir.
 * @returns {string} Date au format AAAA-MM-JJ.
 */
export function toLocalIso(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Grille calendrier fixe : 6 semaines de 7 jours. Une hauteur constante quel que
// soit le mois (4 à 6 semaines réelles) évite tout saut de mise en page.
const CALENDAR_CELLS = 42;

/**
 * Construit les cellules du mois, lundi étant le premier jour. La grille fait toujours
 * 6 lignes (42 cellules) : les cases en tête et en queue sont COMBLÉES par les jours
 * réels des mois précédent et suivant (marqués `outside`), affichés en très léger et
 * non interactifs — simple repère visuel pour une grille pleine et stable.
 * @param {Date} monthDate Mois actuellement affiché.
 * @returns {Array<{ date: Date, iso: string, outside: boolean }>} 42 cellules.
 */
export function buildCalendar(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const leadingEmptyCells = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Nombre de jours du mois précédent (jour 0 du mois courant = dernier du précédent).
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Tête : derniers jours du mois précédent pour démarrer la grille un lundi.
    const leadingCells = Array.from({ length: leadingEmptyCells }, (_, index) => {
        const day = prevMonthDays - leadingEmptyCells + index + 1;
        const date = new Date(year, month - 1, day);
        return { date, iso: toLocalIso(date), outside: true };
    });

    // Corps : les jours réels du mois affiché.
    const monthCells = Array.from({ length: daysInMonth }, (_, index) => {
        const date = new Date(year, month, index + 1);
        return { date, iso: toLocalIso(date), outside: false };
    });

    const cells = [...leadingCells, ...monthCells];

    // Queue : premiers jours du mois suivant jusqu'à compléter les 6 lignes.
    let nextDay = 1;
    while (cells.length < CALENDAR_CELLS) {
        const date = new Date(year, month + 1, nextDay);
        cells.push({ date, iso: toLocalIso(date), outside: true });
        nextDay += 1;
    }
    return cells;
}

/* ------------------------------------------------------------------ *
 *  Durées & créneaux horaires
 * ------------------------------------------------------------------ */

/**
 * Convertit une durée affichée (« ≈ 1h45 », « ≈ 4h ») en minutes.
 * @param {string} text Durée du palier.
 * @returns {number} Durée en minutes (0 si non reconnue).
 */
export function parseDurationMinutes(text) {
    const value = text || "";
    // Format heures « 1h45 » / « 4h » : on additionne heures et minutes.
    const hourMatch = /(\d+)\s*h\s*(\d*)/.exec(value);
    if (hourMatch) {
        return Number(hourMatch[1]) * 60 + (hourMatch[2] ? Number(hourMatch[2]) : 0);
    }
    // Format minutes seules « 5 min » / « 30 min » (ex. complément méca).
    const minuteMatch = /(\d+)\s*min/.exec(value);
    if (minuteMatch) {
        return Number(minuteMatch[1]);
    }
    return 0;
}

/**
 * Formate une durée en minutes vers « 4h » ou « 4h15 ».
 * @param {number} minutes Durée en minutes.
 * @returns {string} Durée lisible.
 */
export function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours}h${String(rest).padStart(2, "0")}` : `${hours}h`;
}

/**
 * Convertit un horaire « HH:MM » en minutes depuis minuit.
 * @param {string} time Horaire du créneau.
 * @returns {number} Minutes depuis minuit.
 */
export function slotToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

/**
 * Convertit des minutes depuis minuit en horaire « HH:MM ».
 * @param {number} minutes Minutes depuis minuit.
 * @returns {string} Horaire au format « HH:MM ».
 */
export function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

/**
 * Heure de fin (en minutes) de la plage de travail à laquelle appartient un créneau.
 * @param {string} time Horaire du créneau « HH:MM ».
 * @returns {number|null} Fin de la plage en minutes, ou null si hors plages de travail.
 */
export function periodEndForSlot(time) {
    const minutes = slotToMinutes(time);
    const period = workingPeriods.find(
        (range) => minutes >= slotToMinutes(range.start) && minutes < slotToMinutes(range.end),
    );
    return period ? slotToMinutes(period.end) : null;
}

/**
 * Indique si l'on peut DÉMARRER la prestation à l'heure donnée : l'horaire existe
 * dans la plage de travail, la durée ne dépasse pas la fin de journée et aucun
 * créneau réservé par un client ne tombe dans la durée. C'est le seul critère qui
 * rend un créneau « incompatible » (donc non sélectionnable comme point de départ).
 *
 * Fonction pure : on lui injecte `slots` et `durationMinutes` (qui, côté page, sont
 * de l'état React) plutôt que de fermer dessus — ainsi elle reste testable.
 * @param {string} time Heure de départ candidate « HH:MM ».
 * @param {Array<{ time: string, available: boolean }>} slots Créneaux du jour.
 * @param {number} durationMinutes Durée totale de la prestation choisie.
 * @returns {boolean} Vrai si la prestation rentre intégralement à partir de cette heure.
 */
export function canStartAt(time, slots, durationMinutes) {
    const start = slotToMinutes(time);
    const periodEnd = periodEndForSlot(time);
    // Hors plage de travail, ou la prestation déborderait la fin de journée.
    if (periodEnd === null || start + durationMinutes > periodEnd) {
        return false;
    }
    // Un créneau réservé par un client tombe dans la durée → impossible de démarrer ici.
    return !slots.some((other) => {
        const otherStart = slotToMinutes(other.time);
        return (
            !other.available &&
            otherStart > start &&
            otherStart < start + durationMinutes
        );
    });
}

/* ------------------------------------------------------------------ *
 *  Tarification & prestations
 * ------------------------------------------------------------------ */

/**
 * Taux de remise progressif appliqué au SOUS-TOTAL des options : plus le client en
 * cumule, plus la remise grandit (1 → 6 %, 2 → 8 %, 3 → 10 %, toutes → 12 %).
 * @param {number} selectedCount Nombre d'options cochées.
 * @param {number} totalCount Nombre total d'options proposées.
 * @returns {number} Taux de remise (0 à 0.12).
 */
export function optionsDiscountRate(selectedCount, totalCount) {
    if (selectedCount === 0) {
        return 0;
    }
    // Toutes les options choisies : remise maximale, quel que soit leur nombre.
    if (selectedCount >= totalCount) {
        return 0.12;
    }
    if (selectedCount === 1) {
        return 0.06;
    }
    if (selectedCount === 2) {
        return 0.08;
    }
    // 3 options ou plus (mais pas toutes).
    return 0.1;
}

/**
 * Liste cumulée et dédoublonnée des prestations incluses pour des catégories données.
 * Cumule les prestations du palier le plus bas jusqu'au niveau choisi de chaque catégorie.
 * Chaque prestation retient le niveau où elle APPARAÎT pour la première fois (du plus
 * bas au plus haut), afin de la colorer à la teinte de ce niveau. Le tri suit l'ordre
 * des niveaux (Platine → Premium → Deluxe), puis l'ordre alphabétique au sein de chacun.
 * @param {Array<object>} categories Catégories à parcourir (ex. lavages, ou méca seule).
 * @param {object} formula État de sélection { interieur, exterieur, meca }.
 * @returns {Array<{ key: string, label: string, level: string }>} Prestations triées par niveau puis alpha.
 */
export function collectFeatures(categories, formula) {
    const seen = new Set();
    const list = [];
    categories.forEach((category) => {
        const level = formula[category.key];
        if (!level) {
            return;
        }
        const selectedRank = formulaLevels.indexOf(level);
        formulaLevels.forEach((currentLevel, rank) => {
            if (rank <= selectedRank) {
                category.features[currentLevel].forEach((label) => {
                    if (!seen.has(label)) {
                        seen.add(label);
                        // Le niveau courant est le plus bas qui inclut cette prestation.
                        list.push({ key: label, label, level: currentLevel });
                    }
                });
            }
        });
    });
    // Tri principal par niveau (rang croissant), tri secondaire alphabétique.
    return list.sort((a, b) => {
        const rankDelta =
            formulaLevels.indexOf(a.level) - formulaLevels.indexOf(b.level);
        return rankDelta !== 0 ? rankDelta : a.label.localeCompare(b.label, "fr");
    });
}

/**
 * Calcule l'intégralité de la tarification d'une sélection : total barré, économies,
 * sous-totaux et prix de vente final. Centralisé ici pour rester testable et garder
 * le composant de page concentré sur l'orchestration.
 * @param {object} formula Sélection { interieur, exterieur, meca }.
 * @param {Array<string>} options Libellés des options cochées.
 * @param {boolean} isCompleteWash Vrai si un intérieur ET un extérieur sont pris.
 * @returns {object} Détail tarifaire (base, economy, sale, sous-totaux, remises…).
 */
export function computePricing(formula, options, isCompleteWash) {
    // Prix des lavages (Intérieur/Extérieur) et de la méca, comptés séparément.
    let washBase = 0;
    let mecaBase = 0;
    formulaCategories.forEach((category) => {
        const level = formula[category.key];
        if (!level) {
            return;
        }
        if (category.key === "meca") {
            // La méca compte TOUJOURS à son prix plein dans la base ; en lavage
            // complet, seule la valeur du niveau OFFERT est ensuite déduite (cf.
            // mecaEconomy), si bien qu'une montée en gamme reste facturée (sa
            // différence par rapport au niveau offert).
            mecaBase += category.prices[level];
            return;
        }
        washBase += category.prices[level];
    });

    // Remise « révision offerte » : en lavage complet, on offre la méca à hauteur
    // du niveau OFFERT (le plus bas des deux lavages). Si le client a choisi un
    // niveau de méca supérieur, il ne paie que la différence.
    let mecaEconomy = 0;
    if (isCompleteWash && formula.meca) {
        const offeredLevel = getMecaOfferedLevel(formula, isCompleteWash);
        const mecaPrices = formulaCategories.find((category) => category.key === "meca").prices;
        // Plafonné au prix réellement sélectionné pour ne jamais offrir plus que dû.
        mecaEconomy = Math.min(mecaPrices[offeredLevel], mecaPrices[formula.meca]);
    }

    // Sous-total des options choisies (la remise progressive s'y applique).
    let optionsBase = 0;
    options.forEach((label) => {
        const option = detailingOptions.find((entry) => entry.label === label);
        if (option) {
            optionsBase += option.price;
        }
    });

    const base = washBase + mecaBase + optionsBase;

    // Remise de combinaison sur les lavages : montant du niveau le plus bas des deux.
    let washEconomy = 0;
    if (isCompleteWash) {
        const lowerLevel =
            formulaLevels.indexOf(formula.interieur) <= formulaLevels.indexOf(formula.exterieur)
                ? formula.interieur
                : formula.exterieur;
        washEconomy += comboDiscounts[lowerLevel];
    }

    // Remise progressive sur le seul sous-total des options.
    const optionsRate = optionsDiscountRate(options.length, detailingOptions.length);
    const optionsDiscount = Math.round(optionsBase * optionsRate);

    // Économie totale = remise lavage complet + révision offerte + remise options.
    const economy = washEconomy + mecaEconomy + optionsDiscount;

    return {
        base,
        economy,
        washBase,
        mecaBase,
        washEconomy,
        mecaEconomy,
        mecaNet: mecaBase - mecaEconomy,
        optionsBase,
        optionsDiscount,
        optionsRate,
        optionsNet: optionsBase - optionsDiscount,
        sale: base - economy,
    };
}

/**
 * Détermine le niveau de méca OFFERT (gratuit) en lavage complet : le plus bas des
 * deux lavages. En dessous de ce niveau, la méca n'est pas sélectionnable.
 * @param {object} formula Sélection { interieur, exterieur, meca }.
 * @param {boolean} isCompleteWash Vrai si un intérieur ET un extérieur sont pris.
 * @returns {string|null} Niveau offert, ou null hors lavage complet.
 */
export function getMecaOfferedLevel(formula, isCompleteWash) {
    if (!isCompleteWash) {
        return null;
    }
    return formulaLevels.indexOf(formula.interieur) <= formulaLevels.indexOf(formula.exterieur)
        ? formula.interieur
        : formula.exterieur;
}
