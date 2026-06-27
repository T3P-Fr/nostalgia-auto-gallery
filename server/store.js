import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Chemin résolu à partir de ce fichier (et non du cwd) pour rester correct
// sous Passenger comme en local.
const dataDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "data");
const dataFile = path.join(dataDirectory, "appointments.json");
// Demandes SANS créneau (achat/vente, recherche de pièces) : des « leads » à
// rappeler, stockés à part des rendez-vous pour ne pas polluer l'agenda.
const requestsFile = path.join(dataDirectory, "requests.json");

/**
 * Lit tous les rendez-vous depuis le stockage persistant.
 * @returns {Promise<Array<object>>} La liste des rendez-vous enregistrés.
 */
export async function readAppointments() {
    try {
        const content = await readFile(dataFile, "utf8");
        return JSON.parse(content);
    } catch (error) {
        // Une première exécution démarre volontairement avec une base vide.
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
export async function createAppointment(payload) {
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
export async function updateAppointment(id, changes) {
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
export async function deleteAppointment(id) {
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
export async function readRequests() {
    try {
        const content = await readFile(requestsFile, "utf8");
        return JSON.parse(content);
    } catch (error) {
        // Première exécution : on démarre avec une base vide.
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
export async function createRequest(payload) {
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
export async function updateRequest(id, changes) {
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
export async function deleteRequest(id) {
    const requests = await readRequests();
    const filteredRequests = requests.filter((request) => request.id !== id);

    if (filteredRequests.length === requests.length) {
        return false;
    }

    await writeRequests(filteredRequests);
    return true;
}
