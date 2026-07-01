import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch, assetUrl } from "../directusClient.js";
import ImageDropField from "../ImageDropField.jsx";
import ConfirmDialog from "../ConfirmDialog.jsx";
import ErrorToast from "../ErrorToast.jsx";

// Champs textes récupérés/enregistrés pour une réalisation. On liste explicitement
// les champs demandés à Directus pour ne transférer que l'utile (et inclure les
// deux identifiants d'images avant/après).
const REALISATION_FIELDS = [
    "id",
    "sort",
    "title",
    "before_image",
    "after_image",
    "start_state",
    "objective",
    "interventions",
    "result",
    "formula",
    "duration",
    "vehicle",
    "place",
].join(",");

// Formulaire vierge pour la création d'une nouvelle réalisation.
const EMPTY_FORM = {
    title: "",
    vehicle: "",
    formula: "",
    duration: "",
    place: "",
    start_state: "",
    objective: "",
    result: "",
    // interventions est une liste de tags : on la saisit en texte (séparé par des
    // virgules) puis on la convertit en tableau à l'enregistrement.
    interventionsText: "",
    before_image: null,
    after_image: null,
};

/**
 * Section « Réalisations » du Dashboard : liste les réalisations avant/après et
 * permet d'en créer, modifier et supprimer, avec téléversement des photos.
 * @returns {JSX.Element} La section Réalisations.
 */
export default function RealisationsSection() {
    const [realisations, setRealisations] = useState([]);
    // Identifiant en cours d'édition : null = aucun formulaire ouvert,
    // "new" = création, un id = modification d'une réalisation existante.
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [feedback, setFeedback] = useState("");
    const [saving, setSaving] = useState(false);
    // Demande de confirmation en cours (null = aucune). Alimente la ConfirmDialog.
    const [confirmState, setConfirmState] = useState(null);

    /**
     * Recharge la liste des réalisations depuis Directus (triées par `sort`).
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    const loadRealisations = useCallback(async () => {
        try {
            const data = await apiFetch(`/items/realisations?fields=${REALISATION_FIELDS}&sort=sort&limit=-1`);
            setRealisations(data || []);
        } catch (error) {
            setFeedback(error.message || "Impossible de charger les réalisations.");
        }
    }, []);

    // Chargement initial à l'affichage de la section.
    useEffect(() => {
        loadRealisations();
    }, [loadRealisations]);

    /**
     * Met à jour un champ du formulaire courant.
     * @param {string} fieldName Nom du champ.
     * @param {any} value Nouvelle valeur.
     * @returns {void} Aucune valeur de retour.
     */
    function updateField(fieldName, value) {
        setForm((current) => ({ ...current, [fieldName]: value }));
    }

    /**
     * Ouvre le formulaire en mode création (champs vierges).
     * @returns {void} Aucune valeur de retour.
     */
    function startNew() {
        setForm(EMPTY_FORM);
        setEditingId("new");
        setFeedback("");
    }

    /**
     * Ouvre le formulaire pré-rempli pour modifier une réalisation existante.
     * @param {object} realisation Réalisation à éditer.
     * @returns {void} Aucune valeur de retour.
     */
    function startEdit(realisation) {
        setForm({
            title: realisation.title || "",
            vehicle: realisation.vehicle || "",
            formula: realisation.formula || "",
            duration: realisation.duration || "",
            place: realisation.place || "",
            start_state: realisation.start_state || "",
            objective: realisation.objective || "",
            result: realisation.result || "",
            // Le tableau de tags est ré-affiché en texte séparé par des virgules.
            interventionsText: Array.isArray(realisation.interventions)
                ? realisation.interventions.join(", ")
                : "",
            before_image: realisation.before_image || null,
            after_image: realisation.after_image || null,
        });
        setEditingId(realisation.id);
        setFeedback("");
    }

    /**
     * Ferme le formulaire sans enregistrer.
     * @returns {void} Aucune valeur de retour.
     */
    function cancelEdit() {
        setEditingId(null);
        setForm(EMPTY_FORM);
    }

    /**
     * Enregistre la réalisation : création (POST) ou mise à jour (PATCH) selon le mode.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function saveRealisation() {
        setSaving(true);
        setFeedback("");
        try {
            // Conversion du texte d'interventions en tableau propre (sans vides).
            const interventions = form.interventionsText
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean);

            // Charge utile envoyée à Directus (les images sont déjà des identifiants
            // de fichiers téléversés au préalable par ImageDropField).
            const payload = {
                title: form.title,
                vehicle: form.vehicle,
                formula: form.formula,
                duration: form.duration,
                place: form.place,
                start_state: form.start_state,
                objective: form.objective,
                result: form.result,
                interventions,
                before_image: form.before_image,
                after_image: form.after_image,
            };

            if (editingId === "new") {
                // Création d'une nouvelle réalisation.
                await apiFetch("/items/realisations", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
            } else {
                // Mise à jour de la réalisation existante.
                await apiFetch(`/items/realisations/${editingId}`, {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                });
            }

            // Rechargement de la liste puis fermeture du formulaire.
            await loadRealisations();
            cancelEdit();
            setFeedback("Réalisation enregistrée.");
        } catch (error) {
            setFeedback(error.message || "Échec de l’enregistrement.");
        } finally {
            setSaving(false);
        }
    }

    /**
     * Supprime une réalisation après confirmation.
     * @param {object} realisation Réalisation à supprimer.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    function deleteRealisation(realisation) {
        // Confirmation via une modale (cohérence avec le reste du Dashboard).
        setConfirmState({
            title: "Supprimer définitivement",
            message: `Supprimer définitivement « ${realisation.title || "cette réalisation"} » ? Cette action est irréversible.`,
            confirmLabel: "Supprimer",
            danger: true,
            onConfirm: async () => {
                try {
                    await apiFetch(`/items/realisations/${realisation.id}`, { method: "DELETE" });
                    await loadRealisations();
                } catch (error) {
                    setFeedback(error.message || "Suppression impossible.");
                }
            },
        });
    }

    return (
        <div className="dashboard-section">
            <div className="dashboard-section__head">
                <div>
                    <h2>Réalisations</h2>
                    <p className="dashboard-section__subtitle">Vos avant / après, photos et détails de prestation.</p>
                </div>
                {/* Bouton d'ajout masqué quand un formulaire est déjà ouvert. */}
                {editingId === null && (
                    <button className="button" onClick={startNew} title="Créer une nouvelle réalisation avant/après"><Plus /> Ajouter</button>
                )}
            </div>

            <ErrorToast message={feedback} onClose={() => setFeedback("")} />

            {/* Formulaire de création/édition (avec les deux zones avant/après). */}
            {editingId !== null && (
                <div className="realisation-form">
                    <div className="realisation-form__images">
                        <ImageDropField
                            label="Avant"
                            fileId={form.before_image}
                            onChange={(fileId) => updateField("before_image", fileId)}
                        />
                        <ImageDropField
                            label="Après"
                            fileId={form.after_image}
                            onChange={(fileId) => updateField("after_image", fileId)}
                        />
                    </div>

                    <div className="realisation-form__fields">
                        <label className="dashboard-field">
                            <span>Titre</span>
                            <input value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Peugeot 205 GTI" />
                        </label>
                        <label className="dashboard-field">
                            <span>Véhicule</span>
                            <input value={form.vehicle} onChange={(event) => updateField("vehicle", event.target.value)} placeholder="205 GTI 1.9 — 1991" />
                        </label>
                        <label className="dashboard-field">
                            <span>Forfait</span>
                            <input value={form.formula} onChange={(event) => updateField("formula", event.target.value)} placeholder="Complète Deluxe" />
                        </label>
                        <label className="dashboard-field">
                            <span>Durée</span>
                            <input value={form.duration} onChange={(event) => updateField("duration", event.target.value)} placeholder="≈ 6h" />
                        </label>
                        <label className="dashboard-field">
                            <span>Lieu</span>
                            <input value={form.place} onChange={(event) => updateField("place", event.target.value)} placeholder="À domicile · Nîmes" />
                        </label>
                        <label className="dashboard-field dashboard-field--wide">
                            <span>Interventions (séparées par des virgules)</span>
                            <input value={form.interventionsText} onChange={(event) => updateField("interventionsText", event.target.value)} placeholder="Lustrage, décontamination, céramique" />
                        </label>
                        <label className="dashboard-field dashboard-field--wide">
                            <span>État initial</span>
                            <textarea value={form.start_state} onChange={(event) => updateField("start_state", event.target.value)} rows={2} />
                        </label>
                        <label className="dashboard-field dashboard-field--wide">
                            <span>Objectif</span>
                            <textarea value={form.objective} onChange={(event) => updateField("objective", event.target.value)} rows={2} />
                        </label>
                        <label className="dashboard-field dashboard-field--wide">
                            <span>Résultat</span>
                            <textarea value={form.result} onChange={(event) => updateField("result", event.target.value)} rows={2} />
                        </label>
                    </div>

                    <div className="realisation-form__actions">
                        <button className="button button--ghost" onClick={cancelEdit} disabled={saving} title="Fermer sans enregistrer">Annuler</button>
                        <button className="button" onClick={saveRealisation} disabled={saving} title="Enregistrer cette réalisation">
                            {saving ? "Enregistrement…" : "Enregistrer"}
                        </button>
                    </div>
                </div>
            )}

            {/* Liste des réalisations existantes, avec aperçu avant/après. */}
            <div className="realisation-list">
                {realisations.map((realisation) => (
                    <article className="realisation-card deletable" key={realisation.id}>
                        <div className="realisation-card__images">
                            {/* Vignettes avant/après côte à côte (placeholder si absente). */}
                            <div className="realisation-card__thumb">
                                <span>Avant</span>
                                {realisation.before_image
                                    ? <img src={assetUrl(realisation.before_image, { width: 240, height: 180, fit: "cover" })} alt="Avant" />
                                    : <div className="realisation-card__empty">—</div>}
                            </div>
                            <div className="realisation-card__thumb">
                                <span>Après</span>
                                {realisation.after_image
                                    ? <img src={assetUrl(realisation.after_image, { width: 240, height: 180, fit: "cover" })} alt="Après" />
                                    : <div className="realisation-card__empty">—</div>}
                            </div>
                        </div>
                        <div className="realisation-card__body">
                            <h3>{realisation.title || "Sans titre"}</h3>
                            <p>{[realisation.vehicle, realisation.formula].filter(Boolean).join(" · ") || "—"}</p>
                        </div>
                        <div className="realisation-card__actions">
                            <button className="icon-button" onClick={() => startEdit(realisation)} aria-label="Modifier" title="Modifier cette réalisation"><Pencil /></button>
                        </div>
                        <button className="delete-badge delete-badge--corner" onClick={() => deleteRealisation(realisation)} aria-label="Supprimer" title="Supprimer définitivement cette réalisation"><Trash2 /></button>
                    </article>
                ))}
                {realisations.length === 0 && editingId === null && (
                    <div className="empty-state">Aucune réalisation pour le moment. Cliquez sur « Ajouter ».</div>
                )}
            </div>

            {/* Boîte de confirmation (suppression) — même composant que la Galerie. */}
            {confirmState && (
                <ConfirmDialog
                    title={confirmState.title}
                    message={confirmState.message}
                    confirmLabel={confirmState.confirmLabel}
                    danger={confirmState.danger}
                    onConfirm={async () => {
                        const action = confirmState.onConfirm;
                        setConfirmState(null);
                        if (action) {
                            await action();
                        }
                    }}
                    onCancel={() => setConfirmState(null)}
                />
            )}
        </div>
    );
}
