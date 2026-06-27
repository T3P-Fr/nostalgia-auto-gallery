import { RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// Statuts d'un rendez-vous (parcours lavage, avec créneau).
const statusLabels = {
    pending: "À confirmer",
    confirmed: "Confirmé",
    completed: "Terminé",
    cancelled: "Annulé",
};

// Statuts d'une demande sans créneau (lead achat/vente ou pièces, à rappeler).
const requestStatusLabels = {
    pending: "À rappeler",
    contacted: "Contacté",
    closed: "Traité",
    cancelled: "Annulé",
};

// Libellé court du type de demande, affiché en tête de carte.
const requestTypeLabels = {
    "achat-vente": "Achat / Vente",
    pieces: "Pièces",
};

/**
 * Lit le corps d'une réponse en JSON de façon tolérante : une réponse vide
 * (ex. 204 sur DELETE, ou corps absent) ne déclenche plus l'erreur
 * « Unexpected end of JSON input ». Retourne null si le corps est vide.
 * @param {Response} response Réponse fetch à analyser.
 * @returns {Promise<any|null>} Le JSON analysé, ou null si le corps est vide.
 */
async function readJson(response) {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

/**
 * Construit une ligne de détail lisible pour une demande sans créneau, selon
 * qu'il s'agit d'un projet achat/vente ou d'une recherche de pièces.
 * @param {object} request La demande à résumer.
 * @returns {string} Les détails non vides, séparés par « · ».
 */
function requestDetails(request) {
    // Une demande peut porter plusieurs besoins (multi-sélection) : on cumule les
    // détails de chacun.
    const needs = request.needs || (request.type ? [request.type] : []);
    const parts = [];
    if (request.vehicle) {
        parts.push(request.vehicle);
    }
    if (needs.includes("achat-vente")) {
        parts.push(request.projet === "vente" ? "Vente" : "Achat");
        if (request.annee) parts.push(request.annee);
        if (request.budget) parts.push(`budget ${request.budget}`);
        if (request.etat) parts.push(request.etat);
        if (request.delai) parts.push(request.delai);
    }
    if (needs.includes("pieces")) {
        if (request.piece) parts.push(request.piece);
        if (request.reference) parts.push(`réf. ${request.reference}`);
        if (request.urgence) parts.push(request.urgence);
    }
    return parts.filter(Boolean).join(" · ") || "Aucun détail.";
}

/**
 * Affiche et pilote les rendez-vous (avec créneau) ET les demandes sans créneau
 * via l'API protégée. Deux onglets partagent la même clé administrateur.
 * @returns {JSX.Element} L'espace administrateur.
 */
export default function AdminPage() {
    const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("nag-admin-key") || "");
    // Onglet actif : "appointments" (rendez-vous) ou "requests" (demandes).
    const [view, setView] = useState("appointments");
    const [appointments, setAppointments] = useState([]);
    const [requests, setRequests] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [feedback, setFeedback] = useState("");

    /**
     * Recharge rendez-vous ET demandes avec la clé saisie. Les deux listes sont
     * chargées ensemble pour que chaque onglet soit immédiatement à jour.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    const loadData = useCallback(async () => {
        if (!adminKey) return;
        setFeedback("");
        try {
            const headers = { "x-admin-key": adminKey };
            const [appointmentsResponse, requestsResponse] = await Promise.all([
                fetch("/api/appointments", { headers }),
                fetch("/api/requests", { headers }),
            ]);
            const appointmentsData = await readJson(appointmentsResponse);
            const requestsData = await readJson(requestsResponse);
            if (!appointmentsResponse.ok) {
                throw new Error(appointmentsData?.message || "Accès refusé.");
            }
            sessionStorage.setItem("nag-admin-key", adminKey);
            setAppointments(appointmentsData || []);
            setRequests(requestsData || []);
        } catch (error) {
            setFeedback(error.message || "Impossible de charger les données.");
        }
    }, [adminKey]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    /**
     * Modifie le statut d'un rendez-vous (parcours lavage).
     * @param {string} id Identifiant du rendez-vous.
     * @param {string} status Nouveau statut.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function changeAppointmentStatus(id, status) {
        const response = await fetch(`/api/appointments/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
            body: JSON.stringify({ status }),
        });
        if (response.ok) await loadData();
    }

    /**
     * Modifie le statut d'une demande sans créneau.
     * @param {string} id Identifiant de la demande.
     * @param {string} status Nouveau statut.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function changeRequestStatus(id, status) {
        const response = await fetch(`/api/requests/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
            body: JSON.stringify({ status }),
        });
        if (response.ok) await loadData();
    }

    /**
     * Supprime définitivement un rendez-vous après confirmation.
     * @param {string} id Identifiant du rendez-vous.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function removeAppointment(id) {
        if (!window.confirm("Supprimer définitivement ce rendez-vous ?")) return;
        await fetch(`/api/appointments/${id}`, {
            method: "DELETE",
            headers: { "x-admin-key": adminKey },
        });
        await loadData();
    }

    /**
     * Supprime définitivement une demande sans créneau après confirmation.
     * @param {string} id Identifiant de la demande.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function removeRequest(id) {
        if (!window.confirm("Supprimer définitivement cette demande ?")) return;
        await fetch(`/api/requests/${id}`, {
            method: "DELETE",
            headers: { "x-admin-key": adminKey },
        });
        await loadData();
    }

    const isRequestsView = view === "requests";
    // Filtre par statut commun aux deux onglets, avec les libellés adaptés.
    const currentStatusLabels = isRequestsView ? requestStatusLabels : statusLabels;
    const visibleAppointments = appointments.filter(
        (appointment) => statusFilter === "all" || appointment.status === statusFilter,
    );
    const visibleRequests = requests.filter(
        (request) => statusFilter === "all" || request.status === statusFilter,
    );

    /**
     * Change d'onglet et réinitialise le filtre (les statuts diffèrent entre vues).
     * @param {string} nextView Onglet cible ("appointments" ou "requests").
     * @returns {void} Aucune valeur de retour.
     */
    function switchView(nextView) {
        setView(nextView);
        setStatusFilter("all");
    }

    return (
        <section className="admin-page container">
            <div className="section-heading section-heading--split">
                <div>
                    <span className="overline">Gestion</span>
                    <h1>{isRequestsView ? "demandes" : "rendez-vous"}</h1>
                </div>
                <div className="admin-auth">
                    <input type="password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} placeholder="Clé administrateur" />
                    <button className="button button--small" onClick={loadData}><RefreshCw />Actualiser</button>
                </div>
            </div>
            {feedback && <p className="form-error">{feedback}</p>}

            {/* Onglets : rendez-vous (lavage, avec créneau) vs demandes (à rappeler). */}
            <div className="admin-tabs">
                <button
                    type="button"
                    className={`admin-tab${!isRequestsView ? " is-active" : ""}`}
                    onClick={() => switchView("appointments")}
                >
                    Rendez-vous ({appointments.length})
                </button>
                <button
                    type="button"
                    className={`admin-tab${isRequestsView ? " is-active" : ""}`}
                    onClick={() => switchView("requests")}
                >
                    Demandes ({requests.length})
                </button>
            </div>

            <div className="admin-toolbar">
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="all">Tous les statuts</option>
                    {Object.entries(currentStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <span>
                    {isRequestsView
                        ? `${visibleRequests.length} demande${visibleRequests.length > 1 ? "s" : ""}`
                        : `${visibleAppointments.length} rendez-vous`}
                </span>
            </div>

            {/* Onglet Rendez-vous : cartes avec date/créneau et statut de réservation. */}
            {!isRequestsView && (
                <div className="appointment-list">
                    {visibleAppointments.map((appointment) => (
                        <article className="appointment-card" key={appointment.id}>
                            <div className="appointment-card__date">
                                <strong>{new Date(`${appointment.date}T12:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</strong>
                                <span>{appointment.slot}</span>
                            </div>
                            <div className="appointment-card__main">
                                <h2>{appointment.name}</h2>
                                <strong>{appointment.service}</strong>
                                <p>{appointment.vehicle || appointment.message || "Aucun détail véhicule."}</p>
                                <div><a href={`tel:${appointment.phone}`}>{appointment.phone}</a>{appointment.email && <a href={`mailto:${appointment.email}`}>{appointment.email}</a>}</div>
                            </div>
                            <div className="appointment-card__actions">
                                <select value={appointment.status} onChange={(event) => changeAppointmentStatus(appointment.id, event.target.value)}>
                                    {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                                <button className="icon-button" onClick={() => removeAppointment(appointment.id)} aria-label="Supprimer"><Trash2 /></button>
                            </div>
                        </article>
                    ))}
                    {!feedback && visibleAppointments.length === 0 && <div className="empty-state">Aucun rendez-vous dans cette vue.</div>}
                </div>
            )}

            {/* Onglet Demandes : cartes sans créneau, avec type et détails du projet. */}
            {isRequestsView && (
                <div className="appointment-list">
                    {visibleRequests.map((request) => (
                        <article className="appointment-card" key={request.id}>
                            <div className="appointment-card__date">
                                <strong>{(request.needs || [request.type]).map((need) => requestTypeLabels[need] || need).join(" + ") || "Demande"}</strong>
                                <span>{new Date(request.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>
                            </div>
                            <div className="appointment-card__main">
                                <h2>{request.name}</h2>
                                <strong>{requestDetails(request)}</strong>
                                {request.message && <p>{request.message}</p>}
                                <div><a href={`tel:${request.phone}`}>{request.phone}</a>{request.email && <a href={`mailto:${request.email}`}>{request.email}</a>}{request.city && <span>{request.city}</span>}</div>
                            </div>
                            <div className="appointment-card__actions">
                                <select value={request.status} onChange={(event) => changeRequestStatus(request.id, event.target.value)}>
                                    {Object.entries(requestStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                                <button className="icon-button" onClick={() => removeRequest(request.id)} aria-label="Supprimer"><Trash2 /></button>
                            </div>
                        </article>
                    ))}
                    {!feedback && visibleRequests.length === 0 && <div className="empty-state">Aucune demande dans cette vue.</div>}
                </div>
            )}
        </section>
    );
}
