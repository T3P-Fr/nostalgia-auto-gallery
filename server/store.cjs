const { randomUUID } = require("node:crypto");
const { mkdir, readFile, rename, writeFile } = require("node:fs/promises");
const path = require("node:path");

// Version CommonJS (.cjs) pour Phusion Passenger (o2switch).
// __dirname est natif en CommonJS : chemin indépendant du dossier de lancement.
const dataDirectory = path.resolve(__dirname, "data");
const dataFile = path.join(dataDirectory, "appointments.json");
// Demandes SANS créneau (achat/vente, recherche de pièces) : des « leads » à
// rappeler, stockés à part des rendez-vous pour ne pas polluer l'agenda.
const requestsFile = path.join(dataDirectory, "requests.json");

/**
 * Lit tous les rendez-vous depuis le stockage persistant.
 * @returns {Promise<Array<object>>} La liste des rendez-vous enregistrés.
 */
async function readAppointments() {
    try {
        const content = await readFile(dataFile, "utf8");
        return JSON.parse(content);
    } catch (error) {
        if (error.code === "ENOENT") {
            await writeAppointments([]);
            return [];
        }
        throw error;
    }
}

/**
 * Écrit atomiquement la liste complète des rendez-vous.
 * @param {Array<object>} appointments Rendez-vous à persister.
 * @returns {Promise<void>} Aucune valeur de retour.
 */
async function writeAppointments(appointments) {
    await mkdir(dataDirectory, { recursive: true });
    const temporaryFile = `${dataFile}.tmp`;
    await writeFile(temporaryFile, JSON.stringify(appointments, null, 4), "utf8");
    await rename(temporaryFile, dataFile);
}

/**
 * Ajoute un rendez-vous si le créneau n'est pas déjà occupé.
 * @param {object} payload Données validées de la demande.
 * @returns {Promise<object>} Le rendez-vous créé.
 */
async function createAppointment(payload) {
    const appointments = await readAppointments();
    const hasConflict = appointments.some(
        (appointment) =>
            appointment.date === payload.date &&
            appointment.slot === payload.slot &&
            appointment.status !== "cancelled",
    );

    if (hasConflict) {
        const conflictError = new Error("Ce créneau vient d’être réservé.");
        conflictError.code = "SLOT_CONFLICT";
        throw conflictError;
    }

    const appointment = {
        id: randomUUID(),
        ...payload,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    appointments.push(appointment);
    await writeAppointments(appointments);
    return appointment;
}

/**
 * Met à jour un rendez-vous existant.
 * @param {string} id Identifiant du rendez-vous.
 * @param {object} changes Champs autorisés à modifier.
 * @returns {Promise<object|null>} Le rendez-vous modifié, ou null s'il est absent.
 */
async function updateAppointment(id, changes) {
    const appointments = await readAppointments();
    const index = appointments.findIndex((appointment) => appointment.id === id);

    if (index === -1) {
        return null;
    }

    appointments[index] = {
        ...appointments[index],
        ...changes,
        updatedAt: new Date().toISOString(),
    };
    await writeAppointments(appointments);
    return appointments[index];
}

/**
 * Supprime définitivement un rendez-vous.
 * @param {string} id Identifiant du rendez-vous.
 * @returns {Promise<boolean>} Vrai si un rendez-vous a été supprimé.
 */
async function deleteAppointment(id) {
    const appointments = await readAppointments();
    const filteredAppointments = appointments.filter(
        (appointment) => appointment.id !== id,
    );

    if (filteredAppointments.length === appointments.length) {
        return false;
    }

    await writeAppointments(filteredAppointments);
    return true;
}

/*
 * ---------------------------------------------------------------------------
 * Demandes sans créneau (leads). Même schéma de persistance que les rendez-vous
 * mais sans logique de disponibilité : une demande de pièces ou un projet
 * achat/vente ne bloque aucun horaire, Corentin rappelle simplement le client.
 * ---------------------------------------------------------------------------
 */

/**
 * Lit toutes les demandes sans créneau depuis le stockage persistant.
 * @returns {Promise<Array<object>>} La liste des demandes enregistrées.
 */
async function readRequests() {
    try {
        const content = await readFile(requestsFile, "utf8");
        return JSON.parse(content);
    } catch (error) {
        if (error.code === "ENOENT") {
            await writeRequests([]);
            return [];
        }
        throw error;
    }
}

/**
 * Écrit atomiquement la liste complète des demandes sans créneau.
 * @param {Array<object>} requests Demandes à persister.
 * @returns {Promise<void>} Aucune valeur de retour.
 */
async function writeRequests(requests) {
    await mkdir(dataDirectory, { recursive: true });
    const temporaryFile = `${requestsFile}.tmp`;
    await writeFile(temporaryFile, JSON.stringify(requests, null, 4), "utf8");
    await rename(temporaryFile, requestsFile);
}

/**
 * Enregistre une nouvelle demande sans créneau (aucune vérification d'agenda).
 * @param {object} payload Données validées de la demande.
 * @returns {Promise<object>} La demande créée.
 */
async function createRequest(payload) {
    const requests = await readRequests();
    const request = {
        id: randomUUID(),
        ...payload,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    requests.push(request);
    await writeRequests(requests);
    return request;
}

/**
 * Met à jour une demande existante (ex. changement de statut depuis l'admin).
 * @param {string} id Identifiant de la demande.
 * @param {object} changes Champs autorisés à modifier.
 * @returns {Promise<object|null>} La demande modifiée, ou null si absente.
 */
async function updateRequest(id, changes) {
    const requests = await readRequests();
    const index = requests.findIndex((request) => request.id === id);

    if (index === -1) {
        return null;
    }

    requests[index] = {
        ...requests[index],
        ...changes,
        updatedAt: new Date().toISOString(),
    };
    await writeRequests(requests);
    return requests[index];
}

/**
 * Supprime définitivement une demande sans créneau.
 * @param {string} id Identifiant de la demande.
 * @returns {Promise<boolean>} Vrai si une demande a été supprimée.
 */
async function deleteRequest(id) {
    const requests = await readRequests();
    const filteredRequests = requests.filter((request) => request.id !== id);

    if (filteredRequests.length === requests.length) {
        return false;
    }

    await writeRequests(filteredRequests);
    return true;
}

module.exports = {
    readAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    readRequests,
    createRequest,
    updateRequest,
    deleteRequest,
};
