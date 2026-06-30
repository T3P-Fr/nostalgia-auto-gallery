const { mkdir, readFile, rename, writeFile } = require("node:fs/promises");
const path = require("node:path");

// Version CommonJS (.cjs) pour Phusion Passenger (o2switch), comme le reste du
// serveur. __dirname est natif en CommonJS : le chemin reste correct quel que
// soit le dossier de lancement (le cwd n'est pas garanti sous Passenger).
const dataDirectory = path.resolve(__dirname, "data");
const configFile = path.join(dataDirectory, "availability.json");

// Catalogue COMPLET des créneaux possibles dans une journée (un par heure, de
// 08:00 à 18:00, pause à midi). Sert de référence pour valider qu'un créneau
// reçu existe bel et bien ; les créneaux RÉELLEMENT proposés un jour donné sont
// un sous-ensemble choisi par le gérant (cf. config.slots).
const SLOT_CATALOG = [
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
// Par défaut : ouvert du lundi au samedi, fermé le dimanche, tous les créneaux
// du catalogue, aucune fermeture exceptionnelle. weeklyOpenDays est indexé par
// le numéro de jour de getDay() : 0 = dimanche, 1 = lundi … 6 = samedi.
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
 * Lit la configuration de disponibilité depuis le stockage persistant, en
 * comblant les champs manquants avec les valeurs par défaut (robustesse face à
 * un fichier partiel ou plus ancien).
 * @returns {Promise<object>} La configuration de disponibilité complète.
 */
async function readAvailabilityConfig() {
    try {
        // Lecture du fichier puis fusion avec les valeurs par défaut : si une
        // clé manque (ancienne version du fichier), on garde la valeur par défaut.
        const content = await readFile(configFile, "utf8");
        const stored = JSON.parse(content);
        return {
            ...DEFAULT_CONFIG,
            ...stored,
            // weeklyOpenDays est imbriqué : on fusionne aussi son contenu pour ne
            // jamais perdre un jour absent du fichier stocké.
            weeklyOpenDays: {
                ...DEFAULT_CONFIG.weeklyOpenDays,
                ...(stored.weeklyOpenDays || {}),
            },
        };
    } catch (error) {
        // Premier lancement (fichier absent) : on crée le fichier par défaut puis
        // on le renvoie. Toute autre erreur (JSON corrompu, droits…) remonte.
        if (error.code === "ENOENT") {
            await writeAvailabilityConfig(DEFAULT_CONFIG);
            return { ...DEFAULT_CONFIG };
        }
        throw error;
    }
}

/**
 * Écrit atomiquement la configuration de disponibilité (écriture dans un fichier
 * temporaire puis renommage, pour ne jamais laisser un fichier à moitié écrit).
 * @param {object} config Configuration à persister.
 * @returns {Promise<void>} Aucune valeur de retour.
 */
async function writeAvailabilityConfig(config) {
    // S'assure que le dossier data/ existe avant d'écrire (idempotent).
    await mkdir(dataDirectory, { recursive: true });
    const temporaryFile = `${configFile}.tmp`;
    await writeFile(temporaryFile, JSON.stringify(config, null, 4), "utf8");
    await rename(temporaryFile, configFile);
}

/**
 * Valide et normalise une configuration reçue du client (onglet admin) avant de
 * l'enregistrer : on ne fait jamais confiance aux données entrantes. Les jours
 * deviennent des booléens, les créneaux sont filtrés sur le catalogue, et les
 * dates de fermeture sont contrôlées au format AAAA-MM-JJ.
 * @param {object} input Configuration brute envoyée par l'admin.
 * @returns {object} Configuration nettoyée, prête à être persistée.
 */
function normalizeAvailabilityConfig(input) {
    const source = input && typeof input === "object" ? input : {};

    // Jours ouverts : on reconstruit l'objet jour par jour (0 → 6) pour garantir
    // exactement sept clés booléennes, peu importe ce qu'on a reçu.
    const weeklyOpenDays = {};
    for (let weekdayIndex = 0; weekdayIndex <= 6; weekdayIndex += 1) {
        const received = source.weeklyOpenDays ? source.weeklyOpenDays[weekdayIndex] : undefined;
        weeklyOpenDays[weekdayIndex] = Boolean(received);
    }

    // Créneaux : on ne conserve que ceux qui existent dans le catalogue, dans
    // l'ordre du catalogue (évite les doublons et un ordre incohérent).
    const requestedSlots = Array.isArray(source.slots) ? source.slots : [];
    const slots = SLOT_CATALOG.filter((slot) => requestedSlots.includes(slot));

    // Fermetures exceptionnelles : uniquement des chaînes au format AAAA-MM-JJ,
    // dédoublonnées et triées pour un affichage stable côté admin.
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
        // Horodatage de la dernière modification (utile pour info côté admin).
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Calcule la liste des créneaux RÉELLEMENT ouverts à la réservation pour une
 * date donnée, en croisant la règle hebdomadaire et les fermetures ponctuelles.
 * Ne tient PAS compte des rendez-vous déjà pris (c'est le rôle de l'appelant) :
 * cette fonction répond seulement « ce jour-là, quels créneaux propose-t-on ? ».
 * @param {string} dateString Date au format AAAA-MM-JJ.
 * @returns {Promise<Array<string>>} Créneaux ouverts ce jour (vide si fermé).
 */
async function getOpenSlotsForDate(dateString) {
    const config = await readAvailabilityConfig();

    // Fermeture exceptionnelle prioritaire : si la date est listée, jour fermé.
    if (config.closedDates.includes(dateString)) {
        return [];
    }

    // On déduit le jour de la semaine à midi pour éviter tout décalage de fuseau
    // horaire qui ferait basculer la date sur la veille/le lendemain.
    const weekdayIndex = new Date(`${dateString}T12:00:00`).getDay();
    if (!config.weeklyOpenDays[weekdayIndex]) {
        return [];
    }

    // Jour ouvert : on renvoie les créneaux choisis par le gérant pour ce jour.
    return config.slots;
}

module.exports = {
    SLOT_CATALOG,
    readAvailabilityConfig,
    writeAvailabilityConfig,
    normalizeAvailabilityConfig,
    getOpenSlotsForDate,
};
