import { RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const statusLabels = {
    pending: "À confirmer",
    confirmed: "Confirmé",
    completed: "Terminé",
    cancelled: "Annulé",
};

/**
 * Affiche et pilote tous les rendez-vous via l'API protégée.
 * @returns {JSX.Element} L'espace administrateur.
 */
export default function AdminPage() {
    const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("nag-admin-key") || "");
    const [appointments, setAppointments] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [feedback, setFeedback] = useState("");

    /**
     * Recharge la liste des rendez-vous avec la clé saisie.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    const loadAppointments = useCallback(async () => {
        if (!adminKey) return;
        setFeedback("");
        try {
            const response = await fetch("/api/appointments", {
                headers: { "x-admin-key": adminKey },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            sessionStorage.setItem("nag-admin-key", adminKey);
            setAppointments(data);
        } catch (error) {
            setFeedback(error.message || "Impossible de charger les rendez-vous.");
        }
    }, [adminKey]);

    useEffect(() => {
        loadAppointments();
    }, [loadAppointments]);

    /**
     * Modifie le statut d'un rendez-vous.
     * @param {string} id Identifiant du rendez-vous.
     * @param {string} status Nouveau statut.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function changeStatus(id, status) {
        const response = await fetch(`/api/appointments/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "x-admin-key": adminKey,
            },
            body: JSON.stringify({ status }),
        });
        if (response.ok) await loadAppointments();
    }

    /**
     * Supprime définitivement une demande après confirmation.
     * @param {string} id Identifiant du rendez-vous.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function removeAppointment(id) {
        if (!window.confirm("Supprimer définitivement ce rendez-vous ?")) return;
        await fetch(`/api/appointments/${id}`, {
            method: "DELETE",
            headers: { "x-admin-key": adminKey },
        });
        await loadAppointments();
    }

    const visibleAppointments = appointments.filter(
        (appointment) => statusFilter === "all" || appointment.status === statusFilter,
    );

    return (
        <section className="admin-page container">
            <div className="section-heading section-heading--split">
                <div>
                    <span className="overline">Gestion</span>
                    <h1>rendez-vous</h1>
                </div>
                <div className="admin-auth">
                    <input type="password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} placeholder="Clé administrateur" />
                    <button className="button button--small" onClick={loadAppointments}><RefreshCw />Actualiser</button>
                </div>
            </div>
            {feedback && <p className="form-error">{feedback}</p>}
            <div className="admin-toolbar">
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="all">Tous les statuts</option>
                    {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <span>{visibleAppointments.length} rendez-vous</span>
            </div>
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
                            <select value={appointment.status} onChange={(event) => changeStatus(appointment.id, event.target.value)}>
                                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                            <button className="icon-button" onClick={() => removeAppointment(appointment.id)} aria-label="Supprimer"><Trash2 /></button>
                        </div>
                    </article>
                ))}
                {!feedback && visibleAppointments.length === 0 && <div className="empty-state">Aucun rendez-vous dans cette vue.</div>}
            </div>
        </section>
    );
}
