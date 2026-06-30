import { Eye, EyeOff, RefreshCw, Trash2 } from "lucide-react";
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

// Libellés des jours de la semaine, indexés comme getDay() : 0 = dimanche … 6 = samedi.
// L'ordre suit volontairement getDay() pour correspondre à la config serveur.
const weekdayLabels = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
];

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
    // Affichage en clair (œil) de la clé administrateur.
    const [showKey, setShowKey] = useState(false);
    // Onglet actif : "appointments" (rendez-vous) ou "requests" (demandes).
    const [view, setView] = useState("appointments");
    const [appointments, setAppointments] = useState([]);
    const [requests, setRequests] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [feedback, setFeedback] = useState("");
    // Configuration de disponibilité (jours ouverts, créneaux, fermetures) éditée
    // dans l'onglet « Disponibilités ». null tant qu'elle n'est pas chargée.
    const [availabilityConfig, setAvailabilityConfig] = useState(null);
    // Champ de saisie d'une nouvelle date de fermeture exceptionnelle.
    const [newClosedDate, setNewClosedDate] = useState("");

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
            // On charge les trois sources en parallèle : rendez-vous, demandes et
            // configuration de disponibilité, pour que chaque onglet soit prêt.
            const [appointmentsResponse, requestsResponse, availabilityResponse] = await Promise.all([
                fetch("/api/appointments", { headers }),
                fetch("/api/requests", { headers }),
                fetch("/api/availability-config", { headers }),
            ]);
            const appointmentsData = await readJson(appointmentsResponse);
            const requestsData = await readJson(requestsResponse);
            const availabilityData = await readJson(availabilityResponse);
            if (!appointmentsResponse.ok) {
                throw new Error(appointmentsData?.message || "Accès refusé.");
            }
            sessionStorage.setItem("nag-admin-key", adminKey);
            setAppointments(appointmentsData || []);
            setRequests(requestsData || []);
            setAvailabilityConfig(availabilityData || null);
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

    /**
     * Inverse l'ouverture d'un jour de la semaine dans la config locale (l'envoi
     * au serveur se fait seulement au clic sur « Enregistrer »).
     * @param {number} weekdayIndex Numéro du jour (0 = dimanche … 6 = samedi).
     * @returns {void} Aucune valeur de retour.
     */
    function toggleWeekday(weekdayIndex) {
        // Recopie immuable de la config en basculant le booléen du jour ciblé.
        setAvailabilityConfig((current) => ({
            ...current,
            weeklyOpenDays: {
                ...current.weeklyOpenDays,
                [weekdayIndex]: !current.weeklyOpenDays[weekdayIndex],
            },
        }));
    }

    /**
     * Ajoute ou retire un créneau horaire de la liste proposée les jours ouverts.
     * @param {string} slot Créneau au format HH:MM (ex. "09:00").
     * @returns {void} Aucune valeur de retour.
     */
    function toggleSlot(slot) {
        setAvailabilityConfig((current) => {
            // Présent → on l'enlève ; absent → on l'ajoute. L'ordre final est
            // recalé sur le catalogue pour rester cohérent à l'affichage.
            const alreadySelected = current.slots.includes(slot);
            const nextSlots = alreadySelected
                ? current.slots.filter((value) => value !== slot)
                : [...current.slots, slot];
            return {
                ...current,
                slots: (current.slotCatalog || []).filter((value) => nextSlots.includes(value)),
            };
        });
    }

    /**
     * Ajoute la date saisie à la liste des fermetures exceptionnelles (sans
     * doublon), puis vide le champ de saisie.
     * @returns {void} Aucune valeur de retour.
     */
    function addClosedDate() {
        // On ignore une saisie vide ou déjà présente dans la liste.
        if (!newClosedDate || availabilityConfig.closedDates.includes(newClosedDate)) {
            return;
        }
        setAvailabilityConfig((current) => ({
            ...current,
            // Tri pour un affichage chronologique stable.
            closedDates: [...current.closedDates, newClosedDate].sort(),
        }));
        setNewClosedDate("");
    }

    /**
     * Retire une date de la liste des fermetures exceptionnelles.
     * @param {string} date Date à retirer (AAAA-MM-JJ).
     * @returns {void} Aucune valeur de retour.
     */
    function removeClosedDate(date) {
        setAvailabilityConfig((current) => ({
            ...current,
            closedDates: current.closedDates.filter((value) => value !== date),
        }));
    }

    /**
     * Envoie la configuration de disponibilité au serveur pour enregistrement.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function saveAvailability() {
        const response = await fetch("/api/availability-config", {
            method: "PUT",
            headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
            body: JSON.stringify(availabilityConfig),
        });
        const data = await readJson(response);
        if (response.ok) {
            // Le serveur renvoie la config normalisée : on la réinjecte pour
            // refléter exactement ce qui a été persisté.
            setAvailabilityConfig(data);
            setFeedback("Disponibilités enregistrées.");
        } else {
            setFeedback(data?.message || "Échec de l’enregistrement des disponibilités.");
        }
    }

    const isRequestsView = view === "requests";
    // Onglet « Disponibilités » : édition de la règle, sans liste filtrable.
    const isAvailabilityView = view === "availability";
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
                    {/* Titre adapté à l'onglet actif. */}
                    <h1>
                        {isAvailabilityView
                            ? "disponibilités"
                            : isRequestsView
                                ? "demandes"
                                : "rendez-vous"}
                    </h1>
                </div>
                <div className="admin-auth">
                    {/* Champ clé + œil pour révéler/masquer la saisie. */}
                    <div className="admin-auth__field">
                        <input
                            type={showKey ? "text" : "password"}
                            value={adminKey}
                            onChange={(event) => setAdminKey(event.target.value)}
                            placeholder="Clé administrateur"
                        />
                        <button
                            type="button"
                            className="admin-auth__eye"
                            onClick={() => setShowKey((current) => !current)}
                            aria-label={showKey ? "Masquer la clé" : "Afficher la clé"}
                        >
                            {showKey ? <EyeOff /> : <Eye />}
                        </button>
                    </div>
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
                <button
                    type="button"
                    className={`admin-tab${isAvailabilityView ? " is-active" : ""}`}
                    onClick={() => switchView("availability")}
                >
                    Disponibilités
                </button>
            </div>

            {/* Barre de filtre par statut : utile seulement pour les listes
                (rendez-vous / demandes), masquée dans l'onglet Disponibilités. */}
            {!isAvailabilityView && (
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
            )}

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

            {/* Onglet Disponibilités : le gérant choisit ses jours ouverts, les
                créneaux proposés et ses fermetures exceptionnelles. Affiché
                seulement une fois la config chargée depuis le serveur. */}
            {isAvailabilityView && availabilityConfig && (
                <div className="availability-editor">
                    {/* Jours de la semaine ouverts à la réservation. */}
                    <fieldset className="availability-block">
                        <legend>Jours d’ouverture</legend>
                        <p className="availability-hint">
                            Cochez les jours où vous acceptez des rendez-vous.
                        </p>
                        <div className="availability-grid">
                            {weekdayLabels.map((label, weekdayIndex) => (
                                <label key={weekdayIndex} className="availability-toggle">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(availabilityConfig.weeklyOpenDays[weekdayIndex])}
                                        onChange={() => toggleWeekday(weekdayIndex)}
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    {/* Créneaux horaires proposés les jours ouverts. */}
                    <fieldset className="availability-block">
                        <legend>Créneaux proposés</legend>
                        <p className="availability-hint">
                            Ces horaires sont proposés à vos clients les jours ouverts.
                        </p>
                        <div className="availability-grid">
                            {(availabilityConfig.slotCatalog || []).map((slot) => (
                                <label key={slot} className="availability-toggle">
                                    <input
                                        type="checkbox"
                                        checked={availabilityConfig.slots.includes(slot)}
                                        onChange={() => toggleSlot(slot)}
                                    />
                                    {slot}
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    {/* Fermetures exceptionnelles (congés, jour férié, indisponibilité). */}
                    <fieldset className="availability-block">
                        <legend>Fermetures exceptionnelles</legend>
                        <p className="availability-hint">
                            Bloquez une date précise même si le jour est normalement ouvert.
                        </p>
                        <div className="availability-add-date">
                            <input
                                type="date"
                                value={newClosedDate}
                                onChange={(event) => setNewClosedDate(event.target.value)}
                            />
                            <button type="button" className="button button--small" onClick={addClosedDate}>
                                Ajouter
                            </button>
                        </div>
                        {availabilityConfig.closedDates.length > 0 ? (
                            <ul className="availability-closed-list">
                                {availabilityConfig.closedDates.map((date) => (
                                    <li key={date}>
                                        {/* Date affichée en français pour lisibilité. */}
                                        <span>{new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
                                        <button className="icon-button" onClick={() => removeClosedDate(date)} aria-label="Retirer cette fermeture"><Trash2 /></button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="empty-state">Aucune fermeture programmée.</div>
                        )}
                    </fieldset>

                    {/* Enregistrement : rien n'est envoyé au serveur avant ce clic. */}
                    <div className="availability-actions">
                        <button className="button" onClick={saveAvailability}>
                            Enregistrer les disponibilités
                        </button>
                    </div>
                </div>
            )}

            {/* Garde-fou : onglet ouvert mais config pas encore chargée (clé admin
                manquante ou en cours de chargement). */}
            {isAvailabilityView && !availabilityConfig && (
                <div className="empty-state">Saisissez la clé administrateur pour gérer vos disponibilités.</div>
            )}
        </section>
    );
}
