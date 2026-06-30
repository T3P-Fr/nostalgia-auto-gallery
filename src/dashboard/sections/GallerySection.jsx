import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Film, ImagePlus, Pencil, Play, RotateCcw, Trash2, Video } from "lucide-react";
import { apiFetch, assetUrl, uploadFileWithProgress } from "../directusClient.js";
import BeforeAfterSlider from "../BeforeAfterSlider.jsx";

// Champs récupérés/enregistrés pour une entrée de galerie.
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
    "alt_text",
    "trashed",
].join(",");

// Libellés lisibles des types de média (badge sous chaque carte).
const MEDIA_TYPE_LABELS = {
    image: "Photo",
    before_after: "Avant / Après",
    video: "Vidéo",
};

// Formulaire vierge de métadonnées (édition et création de vidéo).
const EMPTY_META = { title: "", caption: "", alt_text: "", category: "" };

/**
 * Extrait l'URL de la miniature d'une vidéo YouTube à partir de son lien.
 * Gère les formats youtu.be/ID, youtube.com/watch?v=ID et /embed/ID.
 * @param {string} url Lien de la vidéo.
 * @returns {string} L'URL de la miniature, ou une chaîne vide si non reconnu.
 */
function youtubeThumbnail(url) {
    if (!url) {
        return "";
    }
    // Recherche d'un identifiant YouTube de 11 caractères dans les formats courants.
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : "";
}

/**
 * Section « Galerie » du Dashboard. Gère des photos, des avant/après (curseur en
 * direct) et des vidéos, avec : réordonnancement par glisser-déposer, carte
 * d'ajout (1 photo, ou 2 pour un avant/après) avec suivi de progression,
 * corbeille à purge manuelle, et texte alternatif (accessibilité).
 * @returns {JSX.Element} La section Galerie.
 */
export default function GallerySection() {
    // Entrées visibles (hors corbeille), triées par `sort`.
    const [active, setActive] = useState([]);
    // Entrées dans la corbeille (en attente de restauration ou de purge).
    const [trash, setTrash] = useState([]);
    // Suivi des téléversements en cours : [{ name, progress }].
    const [uploads, setUploads] = useState([]);
    const [feedback, setFeedback] = useState("");

    // Édition des métadonnées d'une entrée existante (id en cours, ou null).
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState(EMPTY_META);

    // Formulaire d'ajout d'une vidéo (ouvert/fermé + champs).
    const [videoOpen, setVideoOpen] = useState(false);
    const [videoForm, setVideoForm] = useState({ ...EMPTY_META, video_url: "" });

    // Index de la carte actuellement glissée (null si aucun glissement en cours).
    const [draggingIndex, setDraggingIndex] = useState(null);
    // Index survolé pendant le glissement : emplacement où la carte fantôme s'affiche.
    const [overIndex, setOverIndex] = useState(null);
    // Input fichier caché de la carte d'ajout.
    const addInputRef = useRef(null);

    /**
     * Recharge la galerie et répartit les entrées entre visibles et corbeille.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    const loadItems = useCallback(async () => {
        try {
            const data = await apiFetch(`/items/gallery_items?fields=${GALLERY_FIELDS}&sort=sort&limit=-1`);
            const all = data || [];
            // On sépare visibles / corbeille selon le drapeau `trashed`.
            setActive(all.filter((item) => !item.trashed));
            setTrash(all.filter((item) => item.trashed));
        } catch (error) {
            setFeedback(error.message || "Impossible de charger la galerie.");
        }
    }, []);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    /* ----------------------------- Réordonnancement ----------------------------- */

    /**
     * Persiste l'ordre courant en alignant le champ `sort` sur la position.
     * @param {Array<object>} list Liste réordonnée.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function persistOrder(list) {
        try {
            // On ne met à jour que les entrées dont la position a réellement changé.
            await Promise.all(
                list
                    .map((item, index) =>
                        item.sort === index
                            ? null
                            : apiFetch(`/items/gallery_items/${item.id}`, {
                                method: "PATCH",
                                body: JSON.stringify({ sort: index }),
                            }),
                    )
                    .filter(Boolean),
            );
            // Mémorise les nouveaux `sort` localement (évite un rechargement complet).
            setActive(list.map((item, index) => ({ ...item, sort: index })));
        } catch (error) {
            setFeedback(error.message || "Réordonnancement impossible.");
            await loadItems();
        }
    }

    /**
     * Réinitialise l'état de glissement (fin ou annulation du drag).
     * @returns {void} Aucune valeur de retour.
     */
    function resetDrag() {
        setDraggingIndex(null);
        setOverIndex(null);
    }

    /**
     * Termine un glisser-déposer : déplace la carte tirée à la position cible.
     * @param {number} targetIndex Position de dépôt.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function handleDrop(targetIndex) {
        // On capture l'origine avant de réinitialiser l'état visuel du drag.
        const fromIndex = draggingIndex;
        resetDrag();
        // Rien à faire si on relâche au même endroit ou hors d'une carte.
        if (fromIndex === null || fromIndex === targetIndex) {
            return;
        }
        // Réinsertion de l'élément tiré à la position cible (affichage optimiste).
        const reordered = [...active];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(targetIndex, 0, moved);
        setActive(reordered);
        await persistOrder(reordered);
    }

    /* -------------------------------- Ajout photo ------------------------------- */

    /**
     * Téléverse les fichiers déposés (avec progression) puis crée les entrées :
     * 1 image → photo simple ; 2 images → avant/après ; au-delà → une photo chacune.
     * @param {FileList|Array<File>} fileList Fichiers sélectionnés/déposés.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function handleAddFiles(fileList) {
        // On ne garde que les images.
        const files = [...fileList].filter((file) => file.type.startsWith("image/"));
        if (!files.length) {
            setFeedback("Déposez une photo, ou deux pour un avant/après.");
            return;
        }
        // Initialise le suivi de progression (une barre par fichier).
        setUploads(files.map((file) => ({ name: file.name, progress: 0 })));
        setFeedback("");
        try {
            // Téléversement séquentiel pour un suivi de progression lisible.
            const uploadedIds = [];
            for (let index = 0; index < files.length; index += 1) {
                const uploaded = await uploadFileWithProgress(files[index], (percent) =>
                    setUploads((current) =>
                        current.map((entry, position) =>
                            position === index ? { ...entry, progress: percent } : entry,
                        ),
                    ),
                );
                uploadedIds.push(uploaded.id);
            }

            if (files.length === 2) {
                // Deux photos → une entrée avant/après.
                await apiFetch("/items/gallery_items", {
                    method: "POST",
                    body: JSON.stringify({
                        media_type: "before_after",
                        before_image: uploadedIds[0],
                        after_image: uploadedIds[1],
                        sort: active.length,
                    }),
                });
                setFeedback("Avant/après ajouté.");
            } else {
                // Une (ou plus de deux) → une entrée photo par fichier.
                for (let k = 0; k < uploadedIds.length; k += 1) {
                    await apiFetch("/items/gallery_items", {
                        method: "POST",
                        body: JSON.stringify({
                            media_type: "image",
                            image: uploadedIds[k],
                            sort: active.length + k,
                        }),
                    });
                }
                setFeedback(files.length > 1 ? "Photos ajoutées." : "Photo ajoutée.");
            }
            await loadItems();
        } catch (error) {
            setFeedback(error.message || "Échec de l’envoi.");
        } finally {
            // On efface les barres de progression dans tous les cas.
            setUploads([]);
        }
    }

    /* -------------------------------- Corbeille --------------------------------- */

    /**
     * Place une entrée dans la corbeille (suppression douce, réversible).
     * @param {object} item Entrée à mettre à la corbeille.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function trashItem(item) {
        // Confirmation systématique avant tout retrait (même réversible).
        if (!window.confirm(`Mettre « ${item.title || "cette entrée"} » à la corbeille ?`)) {
            return;
        }
        try {
            await apiFetch(`/items/gallery_items/${item.id}`, {
                method: "PATCH",
                body: JSON.stringify({ trashed: true }),
            });
            await loadItems();
        } catch (error) {
            setFeedback(error.message || "Mise à la corbeille impossible.");
        }
    }

    /**
     * Restaure une entrée depuis la corbeille (la replace dans la galerie).
     * @param {object} item Entrée à restaurer.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function restoreItem(item) {
        try {
            await apiFetch(`/items/gallery_items/${item.id}`, {
                method: "PATCH",
                body: JSON.stringify({ trashed: false }),
            });
            await loadItems();
        } catch (error) {
            setFeedback(error.message || "Restauration impossible.");
        }
    }

    /**
     * Vide définitivement la corbeille (suppression réelle des entrées).
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function emptyTrash() {
        if (!window.confirm(`Vider la corbeille ? ${trash.length} élément(s) seront supprimés définitivement.`)) {
            return;
        }
        try {
            await Promise.all(
                trash.map((item) => apiFetch(`/items/gallery_items/${item.id}`, { method: "DELETE" })),
            );
            await loadItems();
            setFeedback("Corbeille vidée.");
        } catch (error) {
            setFeedback(error.message || "Impossible de vider la corbeille.");
        }
    }

    /* ------------------------------ Métadonnées --------------------------------- */

    /**
     * Ouvre le panneau d'édition des métadonnées d'une entrée.
     * @param {object} item Entrée à éditer.
     * @returns {void} Aucune valeur de retour.
     */
    function startEdit(item) {
        setEditForm({
            title: item.title || "",
            caption: item.caption || "",
            alt_text: item.alt_text || "",
            category: item.category || "",
        });
        setEditingId(item.id);
        setFeedback("");
    }

    /**
     * Enregistre les métadonnées éditées.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function saveEdit() {
        try {
            await apiFetch(`/items/gallery_items/${editingId}`, {
                method: "PATCH",
                body: JSON.stringify(editForm),
            });
            setEditingId(null);
            await loadItems();
            setFeedback("Modifications enregistrées.");
        } catch (error) {
            setFeedback(error.message || "Enregistrement impossible.");
        }
    }

    /* --------------------------------- Vidéo ------------------------------------ */

    /**
     * Enregistre une nouvelle entrée vidéo (lien externe ou fichier déjà téléversé).
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function saveVideo() {
        // Une vidéo nécessite au minimum un lien (le fichier est géré à part).
        if (!videoForm.video_url.trim()) {
            setFeedback("Indiquez le lien de la vidéo (YouTube, Vimeo…).");
            return;
        }
        try {
            await apiFetch("/items/gallery_items", {
                method: "POST",
                body: JSON.stringify({
                    media_type: "video",
                    video_url: videoForm.video_url.trim(),
                    title: videoForm.title,
                    caption: videoForm.caption,
                    alt_text: videoForm.alt_text,
                    category: videoForm.category,
                    sort: active.length,
                }),
            });
            setVideoOpen(false);
            setVideoForm({ ...EMPTY_META, video_url: "" });
            await loadItems();
            setFeedback("Vidéo ajoutée.");
        } catch (error) {
            setFeedback(error.message || "Ajout de la vidéo impossible.");
        }
    }

    /* --------------------------------- Rendu ------------------------------------ */

    /**
     * Construit le texte alternatif d'une entrée (repli sur le titre).
     * @param {object} item Entrée concernée.
     * @returns {string} Le texte alternatif à utiliser.
     */
    function altOf(item) {
        return item.alt_text || item.title || "Photo de la galerie";
    }

    return (
        <div className="dashboard-section">
            <div className="dashboard-section__head">
                <div>
                    <h2>Galerie</h2>
                    <p className="dashboard-section__subtitle">
                        Glissez les cartes pour les réordonner. Déposez une photo, ou deux pour un avant/après.
                    </p>
                </div>
                <button className="button button--ghost" onClick={() => setVideoOpen((open) => !open)} title="Ajouter une vidéo (lien YouTube ou Vimeo)">
                    <Video /> Ajouter une vidéo
                </button>
            </div>

            {feedback && <p className="dashboard-feedback">{feedback}</p>}

            {/* Formulaire d'ajout de vidéo (replié par défaut). */}
            {videoOpen && (
                <div className="realisation-form">
                    <label className="dashboard-field dashboard-field--wide" title="Collez le lien d’une vidéo YouTube ou Vimeo">
                        <span>Lien vidéo</span>
                        <input value={videoForm.video_url} onChange={(event) => setVideoForm((current) => ({ ...current, video_url: event.target.value }))} placeholder="https://youtu.be/…" />
                    </label>
                    <div className="realisation-form__fields">
                        <label className="dashboard-field dashboard-field--wide" title="Titre affiché sous la vidéo">
                            <span>Titre</span>
                            <input value={videoForm.title} onChange={(event) => setVideoForm((current) => ({ ...current, title: event.target.value }))} />
                        </label>
                        <label className="dashboard-field dashboard-field--wide" title="Texte alternatif (accessibilité)">
                            <span>Texte alternatif</span>
                            <input value={videoForm.alt_text} onChange={(event) => setVideoForm((current) => ({ ...current, alt_text: event.target.value }))} />
                        </label>
                    </div>
                    <div className="realisation-form__actions">
                        <button className="button button--ghost" onClick={() => setVideoOpen(false)} title="Annuler l’ajout de vidéo">Annuler</button>
                        <button className="button" onClick={saveVideo} title="Enregistrer la vidéo">Enregistrer</button>
                    </div>
                </div>
            )}

            {/* Panneau d'édition des métadonnées (titre, légende, alt, catégorie). */}
            {editingId !== null && (
                <div className="realisation-form">
                    <div className="realisation-form__fields">
                        <label className="dashboard-field dashboard-field--wide" title="Titre affiché sous le média">
                            <span>Titre</span>
                            <input value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} />
                        </label>
                        <label className="dashboard-field dashboard-field--wide" title="Courte description affichée sous le titre">
                            <span>Légende</span>
                            <input value={editForm.caption} onChange={(event) => setEditForm((current) => ({ ...current, caption: event.target.value }))} />
                        </label>
                        <label className="dashboard-field dashboard-field--wide" title="Texte alternatif : décrit l’image pour l’accessibilité et le référencement">
                            <span>Texte alternatif (alt)</span>
                            <input value={editForm.alt_text} onChange={(event) => setEditForm((current) => ({ ...current, alt_text: event.target.value }))} placeholder="Peugeot 205 GTI rouge après lustrage" />
                        </label>
                        <label className="dashboard-field dashboard-field--wide" title="Catégorie pour regrouper/filtrer les médias">
                            <span>Catégorie</span>
                            <input value={editForm.category} onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))} />
                        </label>
                    </div>
                    <div className="realisation-form__actions">
                        <button className="button button--ghost" onClick={() => setEditingId(null)} title="Fermer sans enregistrer">Annuler</button>
                        <button className="button" onClick={saveEdit} title="Enregistrer les modifications">Enregistrer</button>
                    </div>
                </div>
            )}

            {/* Grille : cartes réordonnables par glisser-déposer + carte d'ajout. */}
            <div className="gallery-grid">
                {active.map((item, index) => (
                    <Fragment key={item.id}>
                        {/* Carte fantôme : aperçu de l'emplacement de dépôt pendant le glissement. */}
                        {draggingIndex !== null && overIndex === index && draggingIndex !== index && (
                            <div className="gallery-ghost" aria-hidden="true">Déposer ici</div>
                        )}
                        <article
                            className={`gallery-card${draggingIndex === index ? " is-dragging" : ""}`}
                            draggable
                            onDragStart={() => setDraggingIndex(index)}
                            onDragEnter={() => setOverIndex(index)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => handleDrop(index)}
                            onDragEnd={resetDrag}
                            title="Glissez pour réordonner"
                        >
                        <div className="gallery-card__image">
                            {/* Aperçu adapté au type de média (avant/après en direct). */}
                            {(item.media_type || "image") === "image" && (item.image
                                ? <img src={assetUrl(item.image, { width: 400, height: 300, fit: "cover" })} alt={altOf(item)} draggable={false} />
                                : <div className="realisation-card__empty">—</div>)}

                            {item.media_type === "before_after" && item.before_image && item.after_image && (
                                <BeforeAfterSlider
                                    beforeUrl={assetUrl(item.before_image, { width: 400, height: 300, fit: "cover" })}
                                    afterUrl={assetUrl(item.after_image, { width: 400, height: 300, fit: "cover" })}
                                    beforeAlt={`Avant — ${altOf(item)}`}
                                    afterAlt={`Après — ${altOf(item)}`}
                                />
                            )}

                            {item.media_type === "video" && (
                                <a className="gallery-card__video" href={item.video_url || "#"} target="_blank" rel="noreferrer" title="Ouvrir la vidéo">
                                    {/* Aperçu : miniature YouTube si disponible, sinon repli icône film. */}
                                    {youtubeThumbnail(item.video_url)
                                        ? <img src={youtubeThumbnail(item.video_url)} alt={altOf(item)} draggable={false} />
                                        : <span className="gallery-card__video-fallback"><Film /></span>}
                                    {/* Bouton Play superposé au centre de l'aperçu. */}
                                    <span className="gallery-card__play"><Play /></span>
                                </a>
                            )}
                        </div>
                        <div className="gallery-card__body">
                            <strong>{item.title || "Sans titre"}</strong>
                            <span>{[MEDIA_TYPE_LABELS[item.media_type || "image"], item.caption].filter(Boolean).join(" · ")}</span>
                        </div>
                        <div className="gallery-card__actions">
                            <button className="icon-button" onClick={() => startEdit(item)} aria-label="Modifier" title="Modifier le titre, la légende et le texte alternatif"><Pencil /></button>
                            <button className="icon-button" onClick={() => trashItem(item)} aria-label="Mettre à la corbeille" title="Mettre à la corbeille (réversible)"><Trash2 /></button>
                        </div>
                        </article>
                    </Fragment>
                ))}

                {/* Carte d'ajout : clic ou glisser-déposer de 1 à 2 photos. */}
                <div
                    className="gallery-add"
                    onClick={() => addInputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                        // Dépôt direct de fichiers depuis l'explorateur.
                        event.preventDefault();
                        handleAddFiles(event.dataTransfer.files);
                    }}
                    title="Cliquez ou déposez : 1 photo, ou 2 pour un avant/après"
                >
                    {uploads.length > 0 ? (
                        // Suivi de progression (une barre par fichier en cours d'envoi).
                        <div className="gallery-add__uploads">
                            {uploads.map((upload, index) => (
                                <div className="upload-row" key={index}>
                                    <span className="upload-row__name">{upload.name}</span>
                                    <div className="upload-row__bar"><div style={{ width: `${upload.progress}%` }} /></div>
                                    <span className="upload-row__pct">{upload.progress}%</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <span className="gallery-add__hint">
                            <ImagePlus />
                            Ajouter
                            <small>1 photo, ou 2 pour un avant/après</small>
                        </span>
                    )}
                    <input
                        ref={addInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(event) => handleAddFiles(event.target.files)}
                    />
                </div>
            </div>

            {/* Corbeille : entrées en attente de restauration ou de purge manuelle. */}
            {trash.length > 0 && (
                <div className="gallery-trash">
                    <div className="gallery-trash__head">
                        <h3><Trash2 /> Corbeille ({trash.length})</h3>
                        <button className="button button--ghost" onClick={emptyTrash} title="Supprimer définitivement tous les éléments de la corbeille">
                            Vider la corbeille
                        </button>
                    </div>
                    <div className="gallery-trash__list">
                        {trash.map((item) => (
                            <div className="trash-item" key={item.id}>
                                <span>{item.title || MEDIA_TYPE_LABELS[item.media_type || "image"]}</span>
                                <button className="icon-button" onClick={() => restoreItem(item)} aria-label="Restaurer" title="Restaurer dans la galerie"><RotateCcw /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
