import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Film, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { apiFetch, assetUrl, uploadFile } from "../directusClient.js";
import ImageDropField from "../ImageDropField.jsx";

// Champs récupérés/enregistrés pour une entrée de galerie (photo, avant/après ou vidéo).
const GALLERY_FIELDS = [
    "id",
    "sort",
    "media_type",
    "image",
    "before_image",
    "after_image",
    "video",
    "video_url",
    "title",
    "caption",
    "category",
].join(",");

// Libellés lisibles des types de média, pour le sélecteur et les vignettes.
const MEDIA_TYPE_LABELS = {
    image: "Photo",
    before_after: "Avant / Après",
    video: "Vidéo",
};

// Formulaire vierge : par défaut une simple photo.
const EMPTY_FORM = {
    media_type: "image",
    image: null,
    before_image: null,
    after_image: null,
    video: null,
    video_url: "",
    title: "",
    caption: "",
    category: "",
};

/**
 * Section « Galerie » du Dashboard : grille d'entrées pouvant être une photo, un
 * avant/après ou une vidéo. Gère l'ajout, l'édition, la suppression et le
 * réordonnancement (flèches haut/bas).
 * @returns {JSX.Element} La section Galerie.
 */
export default function GallerySection() {
    const [items, setItems] = useState([]);
    // null = aucun formulaire, "new" = ajout, un id = édition d'une entrée existante.
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [feedback, setFeedback] = useState("");
    const [saving, setSaving] = useState(false);
    // Indique qu'un fichier vidéo est en cours de téléversement.
    const [uploadingVideo, setUploadingVideo] = useState(false);
    // Référence vers l'input fichier vidéo caché.
    const videoInputRef = useRef(null);

    /**
     * Recharge les entrées depuis Directus, triées par `sort`.
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
     * Ouvre le formulaire pré-rempli pour modifier une entrée existante.
     * @param {object} item Entrée à éditer.
     * @returns {void} Aucune valeur de retour.
     */
    function startEdit(item) {
        setForm({
            // Repli sur "image" pour les anciennes entrées sans media_type défini.
            media_type: item.media_type || "image",
            image: item.image || null,
            before_image: item.before_image || null,
            after_image: item.after_image || null,
            video: item.video || null,
            video_url: item.video_url || "",
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
     * Téléverse un fichier vidéo et mémorise son identifiant dans le formulaire.
     * @param {File} file Fichier vidéo sélectionné.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function handleVideoFile(file) {
        // On n'accepte qu'un fichier de type vidéo.
        if (!file || !file.type.startsWith("video/")) {
            setFeedback("Veuillez choisir un fichier vidéo.");
            return;
        }
        setUploadingVideo(true);
        try {
            const uploaded = await uploadFile(file);
            updateField("video", uploaded.id);
        } catch (error) {
            setFeedback(error.message || "Échec de l’envoi de la vidéo.");
        } finally {
            setUploadingVideo(false);
        }
    }

    /**
     * Vérifie que l'entrée possède bien le média correspondant à son type.
     * @returns {string} Un message d'erreur, ou une chaîne vide si tout est bon.
     */
    function validateMedia() {
        if (form.media_type === "image" && !form.image) {
            return "Veuillez choisir une photo.";
        }
        if (form.media_type === "before_after" && (!form.before_image || !form.after_image)) {
            return "Veuillez fournir une photo avant ET une photo après.";
        }
        if (form.media_type === "video" && !form.video && !form.video_url.trim()) {
            return "Veuillez fournir un lien vidéo ou téléverser un fichier.";
        }
        return "";
    }

    /**
     * Enregistre l'entrée : ajout (POST) ou mise à jour (PATCH) selon le mode.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function saveItem() {
        // Contrôle du média requis selon le type choisi.
        const mediaError = validateMedia();
        if (mediaError) {
            setFeedback(mediaError);
            return;
        }
        setSaving(true);
        setFeedback("");
        try {
            const payload = {
                media_type: form.media_type,
                // On envoie tous les champs média : ceux non utilisés par le type
                // courant restent simplement nuls/vides côté base.
                image: form.media_type === "image" ? form.image : null,
                before_image: form.media_type === "before_after" ? form.before_image : null,
                after_image: form.media_type === "before_after" ? form.after_image : null,
                video: form.media_type === "video" ? form.video : null,
                video_url: form.media_type === "video" ? form.video_url.trim() : "",
                title: form.title,
                caption: form.caption,
                category: form.category,
            };
            if (editingId === "new") {
                // Nouvelle entrée placée en fin de galerie.
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
            setFeedback("Entrée enregistrée.");
        } catch (error) {
            setFeedback(error.message || "Échec de l’enregistrement.");
        } finally {
            setSaving(false);
        }
    }

    /**
     * Supprime une entrée après confirmation.
     * @param {object} item Entrée à supprimer.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function deleteItem(item) {
        if (!window.confirm("Supprimer définitivement cette entrée de la galerie ?")) {
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
     * Déplace une entrée d'un cran dans l'ordre d'affichage (haut/bas).
     * @param {number} index Position actuelle de l'entrée.
     * @param {number} direction -1 pour monter, +1 pour descendre.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function move(index, direction) {
        const targetIndex = index + direction;
        // On ignore les déplacements hors limites (déjà en haut / en bas).
        if (targetIndex < 0 || targetIndex >= items.length) {
            return;
        }
        // Échange local des deux voisins pour le nouvel ordre (affichage optimiste).
        const reordered = [...items];
        [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
        setItems(reordered);
        try {
            // Persistance : seules les deux entrées échangées changent de `sort`.
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
                    <p className="dashboard-section__subtitle">Photos, avant/après et vidéos mis en avant sur le site.</p>
                </div>
                {editingId === null && (
                    <button className="button" onClick={startNew} title="Ajouter une photo, un avant/après ou une vidéo"><Plus /> Ajouter</button>
                )}
            </div>

            {feedback && <p className="dashboard-feedback">{feedback}</p>}

            {/* Formulaire d'ajout/édition, adapté au type de média choisi. */}
            {editingId !== null && (
                <div className="realisation-form">
                    {/* Sélecteur du type de média (photo / avant-après / vidéo). */}
                    <label className="dashboard-field" title="Choisissez le type de contenu à ajouter">
                        <span>Type de contenu</span>
                        <select value={form.media_type} onChange={(event) => updateField("media_type", event.target.value)}>
                            {Object.entries(MEDIA_TYPE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </label>

                    {/* Champ média selon le type. */}
                    {form.media_type === "image" && (
                        <ImageDropField label="Photo" fileId={form.image} onChange={(fileId) => updateField("image", fileId)} />
                    )}

                    {form.media_type === "before_after" && (
                        <div className="realisation-form__images">
                            <ImageDropField label="Avant" fileId={form.before_image} onChange={(fileId) => updateField("before_image", fileId)} />
                            <ImageDropField label="Après" fileId={form.after_image} onChange={(fileId) => updateField("after_image", fileId)} />
                        </div>
                    )}

                    {form.media_type === "video" && (
                        <div className="video-field">
                            <label className="dashboard-field" title="Collez le lien d’une vidéo YouTube ou Vimeo">
                                <span>Lien vidéo (YouTube, Vimeo…)</span>
                                <input value={form.video_url} onChange={(event) => updateField("video_url", event.target.value)} placeholder="https://youtu.be/…" />
                            </label>
                            <div className="video-field__or">— ou —</div>
                            {/* Téléversement d'un fichier vidéo hébergé directement. */}
                            <button
                                type="button"
                                className="button button--ghost"
                                onClick={() => videoInputRef.current?.click()}
                                disabled={uploadingVideo}
                                title="Téléverser un fichier vidéo depuis votre ordinateur"
                            >
                                {uploadingVideo ? <><Upload className="spin" /> Envoi…</> : <><Upload /> {form.video ? "Vidéo téléversée ✓" : "Téléverser une vidéo"}</>}
                            </button>
                            <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={(event) => handleVideoFile(event.target.files?.[0])} />
                        </div>
                    )}

                    {/* Champs descriptifs communs à tous les types. */}
                    <div className="realisation-form__fields">
                        <label className="dashboard-field dashboard-field--wide" title="Titre affiché sous le média">
                            <span>Titre</span>
                            <input value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Nissan 200SX" />
                        </label>
                        <label className="dashboard-field dashboard-field--wide" title="Courte description affichée sous le titre">
                            <span>Légende</span>
                            <input value={form.caption} onChange={(event) => updateField("caption", event.target.value)} placeholder="Rénovation des phares" />
                        </label>
                        <label className="dashboard-field dashboard-field--wide" title="Catégorie pour regrouper/filtrer les médias">
                            <span>Catégorie</span>
                            <input value={form.category} onChange={(event) => updateField("category", event.target.value)} placeholder="Extérieur" />
                        </label>
                    </div>

                    <div className="realisation-form__actions">
                        <button className="button button--ghost" onClick={cancelEdit} disabled={saving} title="Fermer sans enregistrer">Annuler</button>
                        <button className="button" onClick={saveItem} disabled={saving} title="Enregistrer cette entrée dans la galerie">
                            {saving ? "Enregistrement…" : "Enregistrer"}
                        </button>
                    </div>
                </div>
            )}

            {/* Grille des entrées existantes. */}
            <div className="gallery-grid">
                {items.map((item, index) => (
                    <article className="gallery-card" key={item.id}>
                        <div className="gallery-card__image">
                            {/* Aperçu adapté au type de média. */}
                            {(item.media_type || "image") === "image" && (item.image
                                ? <img src={assetUrl(item.image, { width: 360, height: 270, fit: "cover" })} alt={item.title || "Photo"} />
                                : <div className="realisation-card__empty">—</div>)}

                            {item.media_type === "before_after" && (
                                <div className="gallery-card__beforeafter">
                                    {item.before_image
                                        ? <img src={assetUrl(item.before_image, { width: 180, height: 270, fit: "cover" })} alt="Avant" />
                                        : <div className="realisation-card__empty">—</div>}
                                    {item.after_image
                                        ? <img src={assetUrl(item.after_image, { width: 180, height: 270, fit: "cover" })} alt="Après" />
                                        : <div className="realisation-card__empty">—</div>}
                                </div>
                            )}

                            {item.media_type === "video" && (
                                <div className="gallery-card__video"><Film /> Vidéo</div>
                            )}
                        </div>
                        <div className="gallery-card__body">
                            <strong>{item.title || "Sans titre"}</strong>
                            {/* Badge du type de média + légende éventuelle. */}
                            <span>{[MEDIA_TYPE_LABELS[item.media_type || "image"], item.caption].filter(Boolean).join(" · ")}</span>
                        </div>
                        <div className="gallery-card__actions">
                            {/* Flèches de réordonnancement (désactivées aux extrémités). */}
                            <button className="icon-button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Monter" title="Monter dans l’ordre d’affichage"><ArrowUp /></button>
                            <button className="icon-button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Descendre" title="Descendre dans l’ordre d’affichage"><ArrowDown /></button>
                            <button className="icon-button" onClick={() => startEdit(item)} aria-label="Modifier" title="Modifier cette entrée"><Pencil /></button>
                            <button className="icon-button" onClick={() => deleteItem(item)} aria-label="Supprimer" title="Supprimer définitivement cette entrée"><Trash2 /></button>
                        </div>
                    </article>
                ))}
                {items.length === 0 && editingId === null && (
                    <div className="empty-state">Aucune entrée. Cliquez sur « Ajouter ».</div>
                )}
            </div>
        </div>
    );
}
