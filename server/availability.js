import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Miroir ESM de availability.cjs (le .cjs est la version active sous Passenger).
// En module ES, __dirname n'existe pas : on le reconstruit depuis import.meta.url.
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.resolve(currentDirectory, "data");
const configFile = path.join(dataDirectory, "availability.json");

// Catalogue COMPLET des créneaux possibles dans une journée (un par heure, de
// 08:00 à 18:00, pause à midi). Sert de référence pour valider qu'un créneau
// reçu existe ; les créneaux réellement proposés un jour donné sont un
// sous-ensemble choisi par le gérant (cf. config.slots).
export const SLOT_CATALOG = [
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

// Configuration par défaut, utilisée tant que le gérant n'a rien personnalisé.
// Ouvert du lundi au samedi, fermé le dimanche, tous les créneaux du catalogue,
// aucune fermeture. weeklyOpenDays est indexé par getDay() : 0 = dimanche … 6 = samedi.
const DEFAULT_CONFIG = {
    weeklyOpenDays: {
        0: false, // dimanche
        1: true, // lundi
        2: true, // mardi
        3: true, // mercredi
        4: true, // jeudi
        5: true, // vendredi
        6: true, // samedi
    },
    slots: [...SLOT_CATALOG],
    closedDates: [],
    updatedAt: null,
};

/**
 * Lit la configuration de disponibilité, en comblant les champs manquants par
 * les valeurs par défaut (robustesse face à un fichier partiel ou plus ancien).
 * @returns {Promise<object>} La configuration de disponibilité complète.
 */
export async function readAvailabilityConfig() {
    try {
        // Lecture puis fusion avec les défauts : une clé absente garde sa valeur
        // par défaut plutôt que de disparaître.
        const content = await readFile(configFile, "utf8");
        const stored = JSON.parse(content);
        return {
            ...DEFAULT_CONFIG,
            ...stored,
            weeklyOpenDays: {
                ...DEFAULT_CONFIG.weeklyOpenDays,
                ...(stored.weeklyOpenDays || {}),
            },
        };
    } catch (error) {
        // Premier lancement : on crée le fichier par défaut puis on le renvoie.
        if (error.code === "ENOENT") {
            await writeAvailabilityConfig(DEFAULT_CONFIG);
            return { ...DEFAULT_CONFIG };
        }
        throw error;
    }
}

/**
 * Écrit atomiquement la configuration (fichier temporaire puis renommage) pour
 * ne jamais laisser un fichier à moitié écrit en cas d'interruption.
 * @param {object} config Configuration à persister.
 * @returns {Promise<void>} Aucune valeur de retour.
 */
export async function writeAvailabilityConfig(config) {
    // Garantit l'existence du dossier data/ avant d'écrire (idempotent).
    await mkdir(dataDirectory, { recursive: true });
    const temporaryFile = `${configFile}.tmp`;
    await writeFile(temporaryFile, JSON.stringify(config, null, 4), "utf8");
    await rename(temporaryFile, configFile);
}

/**
 * Valide et normalise une configuration reçue de l'admin avant enregistrement :
 * jours en booléens, créneaux filtrés sur le catalogue, dates de fermeture au
 * format AAAA-MM-JJ. On ne fait jamais confiance aux données entrantes.
 * @param {object} input Configuration brute envoyée par l'admin.
 * @returns {object} Configuration nettoyée, prête à être persistée.
 */
export function normalizeAvailabilityConfig(input) {
    const source = input && typeof input === "object" ? input : {};

    // Jours ouverts : reconstruction jour par jour (0 → 6) pour garantir sept
    // clés booléennes, peu importe ce qui a été reçu.
    const weeklyOpenDays = {};
    for (let weekdayIndex = 0; weekdayIndex <= 6; weekdayIndex += 1) {
        const received = source.weeklyOpenDays ? source.weeklyOpenDays[weekdayIndex] : undefined;
        weeklyOpenDays[weekdayIndex] = Boolean(received);
    }

    // Créneaux : on ne garde que ceux du catalogue, dans l'ordre du catalogue.
    const requestedSlots = Array.isArray(source.slots) ? source.slots : [];
    const slots = SLOT_CATALOG.filter((slot) => requestedSlots.includes(slot));

    // Fermetures : seulement des chaînes AAAA-MM-JJ, dédoublonnées et triées.
    const requestedClosedDates = Array.isArray(source.closedDates) ? source.closedDates : [];
    const closedDates = [...new Set(
        requestedClosedDates.filter(
            (date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date),
        ),
    )].sort();

    return {
        weeklyOpenDays,
        slots,
        closedDates,
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Calcule les créneaux réellement ouverts pour une date, en croisant la règle
 * hebdomadaire et les fermetures ponctuelles. Ne tient pas compte des RDV déjà
 * pris (rôle de l'appelant).
 * @param {string} dateString Date au format AAAA-MM-JJ.
 * @returns {Promise<Array<string>>} Créneaux ouverts ce jour (vide si fermé).
 */
export async function getOpenSlotsForDate(dateString) {
    const config = await readAvailabilityConfig();

    // Fermeture exceptionnelle prioritaire.
    if (config.closedDates.includes(dateString)) {
        return [];
    }

    // Jour de la semaine calculé à midi pour éviter les décalages de fuseau.
    const weekdayIndex = new Date(`${dateString}T12:00:00`).getDay();
    if (!config.weeklyOpenDays[weekdayIndex]) {
        return [];
    }

    return config.slots;
}
