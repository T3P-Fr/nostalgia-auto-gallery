const { randomUUID } = require("node:crypto");
const { mkdir, readFile, rename, writeFile } = require("node:fs/promises");
const path = require("node:path");

// Version CommonJS (.cjs) pour Phusion Passenger (o2switch).
// __dirname est natif en CommonJS : chemin indépendant du dossier de lancement.
const dataDirectory = path.resolve(__dirname, "data");
const dataFile = path.join(dataDirectory, "appointments.json");

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

module.exports = {
    readAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
};
