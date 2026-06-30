import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch, assetUrl } from "../directusClient.js";
import ImageDropField from "../ImageDropField.jsx";

// Champs récupérés/enregistrés pour une photo de galerie.
const GALLERY_FIELDS = ["id", "sort", "image", "title", "caption", "category"].join(",");

// Formulaire vierge pour l'ajout d'une nouvelle photo.
const EMPTY_FORM = {
    image: null,
    title: "",
    caption: "",
    category: "",
};

/**
 * Section « Galerie » du Dashboard : grille de photos avec ajout, édition,
 * suppression et réordonnancement (flèches haut/bas). Chaque photo est un fichier
 * Directus accompagné d'un titre, d'une légende et d'une catégorie.
 * @returns {JSX.Element} La section Galerie.
 */
export default function GallerySection() {
    const [items, setItems] = useState([]);
    // null = aucun formulaire, "new" = ajout, un id = édition d'une photo existante.
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [feedback, setFeedback] = useState("");
    const [saving, setSaving] = useState(false);

    /**
     * Recharge les photos depuis Directus, triées par `sort`.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    const loadItems = useCallback(async () => {
        try {
            const data = await apiFetch(`/items/gallery_items?fields=${GALLERY_FIELDS}&sort=sort&limit=-1`);
            setItems(data || []);
        } catch (error) {
            setFeedback(error.message || "Impossible de charger la galerie.");
        }
    }, []);

    // Chargement initial à l'affichage de la section.
    useEffect(() => {
        loadItems();
    }, [loadItems]);

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
     * Ouvre le formulaire en mode ajout (champs vierges).
     * @returns {void} Aucune valeur de retour.
     */
    function startNew() {
        setForm(EMPTY_FORM);
        setEditingId("new");
        setFeedback("");
    }

    /**
     * Ouvre le formulaire pré-rempli pour modifier une photo existante.
     * @param {object} item Photo à éditer.
     * @returns {void} Aucune valeur de retour.
     */
    function startEdit(item) {
        setForm({
            image: item.image || null,
            title: item.title || "",
            caption: item.caption || "",
            category: item.category || "",
        });
        setEditingId(item.id);
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
     * Enregistre la photo : ajout (POST) ou mise à jour (PATCH) selon le mode.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function saveItem() {
        // Une photo de galerie n'a de sens qu'avec une image : on bloque sinon.
        if (!form.image) {
            setFeedback("Veuillez d’abord choisir une image.");
            return;
        }
        setSaving(true);
        setFeedback("");
        try {
            const payload = {
                image: form.image,
                title: form.title,
                caption: form.caption,
                category: form.category,
            };
            if (editingId === "new") {
                // À l'ajout, on place la photo en fin de galerie (sort = nb d'éléments).
                await apiFetch("/items/gallery_items", {
                    method: "POST",
                    body: JSON.stringify({ ...payload, sort: items.length }),
                });
            } else {
                await apiFetch(`/items/gallery_items/${editingId}`, {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                });
            }
            await loadItems();
            cancelEdit();
            setFeedback("Photo enregistrée.");
        } catch (error) {
            setFeedback(error.message || "Échec de l’enregistrement.");
        } finally {
            setSaving(false);
        }
    }

    /**
     * Supprime une photo après confirmation.
     * @param {object} item Photo à supprimer.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function deleteItem(item) {
        if (!window.confirm("Supprimer définitivement cette photo de la galerie ?")) {
            return;
        }
        try {
            await apiFetch(`/items/gallery_items/${item.id}`, { method: "DELETE" });
            await loadItems();
        } catch (error) {
            setFeedback(error.message || "Suppression impossible.");
        }
    }

    /**
     * Déplace une photo d'un cran dans l'ordre d'affichage (haut/bas), en
     * échangeant sa position avec sa voisine puis en persistant le nouvel ordre.
     * @param {number} index Position actuelle de la photo dans la liste.
     * @param {number} direction -1 pour monter, +1 pour descendre.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function move(index, direction) {
        const targetIndex = index + direction;
        // On ignore les déplacements hors limites (déjà en haut / en bas).
        if (targetIndex < 0 || targetIndex >= items.length) {
            return;
        }
        // Échange local des deux voisins pour obtenir le nouvel ordre.
        const reordered = [...items];
        [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
        // Affichage immédiat (optimiste) avant la confirmation serveur.
        setItems(reordered);
        try {
            // On persiste l'ordre en alignant le champ `sort` sur la nouvelle position.
            // Seules les deux photos échangées changent réellement de `sort`.
            await Promise.all(
                [index, targetIndex].map((position) =>
                    apiFetch(`/items/gallery_items/${reordered[position].id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ sort: position }),
                    }),
                ),
            );
        } catch (error) {
            // En cas d'échec, on recharge l'ordre réel depuis le serveur.
            setFeedback(error.message || "Réordonnancement impossible.");
            await loadItems();
        }
    }

    return (
        <div className="dashboard-section">
            <div className="dashboard-section__head">
                <div>
                    <h2>Galerie</h2>
                    <p className="dashboard-section__subtitle">Vos photos mises en avant sur le site.</p>
                </div>
                {editingId === null && (
                    <button className="button" onClick={startNew}><Plus /> Ajouter</button>
                )}
            </div>

            {feedback && <p className="dashboard-feedback">{feedback}</p>}

            {/* Formulaire d'ajout/édition d'une photo. */}
            {editingId !== null && (
                <div className="realisation-form">
                    <div className="gallery-form__layout">
                        <ImageDropField
                            label="Photo"
                            fileId={form.image}
                            onChange={(fileId) => updateField("image", fileId)}
                        />
                        <div className="realisation-form__fields">
                            <label className="dashboard-field dashboard-field--wide">
                                <span>Titre</span>
                                <input value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Nissan 200SX" />
                            </label>
                            <label className="dashboard-field dashboard-field--wide">
                                <span>Légende</span>
                                <input value={form.caption} onChange={(event) => updateField("caption", event.target.value)} placeholder="Rénovation des phares" />
                            </label>
                            <label className="dashboard-field dashboard-field--wide">
                                <span>Catégorie</span>
                                <input value={form.category} onChange={(event) => updateField("category", event.target.value)} placeholder="Extérieur" />
                            </label>
                        </div>
                    </div>
                    <div className="realisation-form__actions">
                        <button className="button button--ghost" onClick={cancelEdit} disabled={saving}>Annuler</button>
                        <button className="button" onClick={saveItem} disabled={saving}>
                            {saving ? "Enregistrement…" : "Enregistrer"}
                        </button>
                    </div>
                </div>
            )}

            {/* Grille des photos existantes. */}
            <div className="gallery-grid">
                {items.map((item, index) => (
                    <article className="gallery-card" key={item.id}>
                        <div className="gallery-card__image">
                            {item.image
                                ? <img src={assetUrl(item.image, { width: 360, height: 270, fit: "cover" })} alt={item.title || "Photo"} />
                                : <div className="realisation-card__empty">—</div>}
                        </div>
                        <div className="gallery-card__body">
                            <strong>{item.title || "Sans titre"}</strong>
                            <span>{item.caption || ""}</span>
                        </div>
                        <div className="gallery-card__actions">
                            {/* Flèches de réordonnancement (désactivées aux extrémités). */}
                            <button className="icon-button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Monter"><ArrowUp /></button>
                            <button className="icon-button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Descendre"><ArrowDown /></button>
                            <button className="icon-button" onClick={() => startEdit(item)} aria-label="Modifier"><Pencil /></button>
                            <button className="icon-button" onClick={() => deleteItem(item)} aria-label="Supprimer"><Trash2 /></button>
                        </div>
                    </article>
                ))}
                {items.length === 0 && editingId === null && (
                    <div className="empty-state">Aucune photo. Cliquez sur « Ajouter ».</div>
                )}
            </div>
        </div>
    );
}
