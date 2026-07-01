import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Film, ImagePlus, Pencil, Play, RotateCcw, Trash2, Video } from "lucide-react";
import { apiFetch, assetUrl, uploadFileWithProgress } from "../directusClient.js";
import BeforeAfterSlider from "../BeforeAfterSlider.jsx";
import Modal from "../Modal.jsx";
import ConfirmDialog from "../ConfirmDialog.jsx";

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
    // Sous-vue affichée dans la section : "gallery" (grille) ou "trash" (corbeille).
    const [view, setView] = useState("gallery");
    // Demande de confirmation en cours (null = aucune). Remplace window.confirm.
    const [confirmState, setConfirmState] = useState(null);

    /**
     * Ouvre une boîte de confirmation. La fonction onConfirm fournie est exécutée
     * si l'utilisateur valide.
     * @param {object} config Paramètres (title, message, confirmLabel, danger, onConfirm).
     * @returns {void} Aucune valeur de retour.
     */
    function askConfirm(config) {
        setConfirmState(config);
    }

    // Édition des métadonnées d'une entrée existante (id en cours, ou null).
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState(EMPTY_META);

    // Formulaire d'ajout d'une vidéo (ouvert/fermé + champs).
    const [videoOpen, setVideoOpen] = useState(false);
    const [videoForm, setVideoForm] = useState({ ...EMPTY_META, video_url: "" });

    // Glisser-déposer personnalisé (pointer events) : id de la carte tirée (rendue
    // vide à sa place) et position à l'écran du clone flottant qui suit le curseur.
    const [draggingId, setDraggingId] = useState(null);
    const [clonePos, setClonePos] = useState({ x: 0, y: 0 });
    // Données transitoires du glissement (évitent les fermetures périmées).
    const dragRef = useRef({ id: null, active: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0, width: 0 });
    // Réf vers la liste « active » à jour, lue à la fin du drag pour persister l'ordre.
    const activeRef = useRef(active);
    activeRef.current = active;
    // Réf vers persistOrder, appelée depuis les écouteurs globaux de pointeur.
    const persistOrderRef = useRef(null);
    // Input fichier caché de la carte d'ajout.
    const addInputRef = useRef(null);
    // Référence du formulaire de la modale d'édition + taille mesurée de l'aperçu.
    // L'aperçu est rendu carré exactement à la hauteur du formulaire (= hauteur
    // utile de la pop-up), via mesure JS (l'approche CSS pure s'effondrait à 0).
    const editFormRef = useRef(null);
    const [previewSize, setPreviewSize] = useState(0);

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

    // Mesure la hauteur du formulaire d'édition pour dimensionner l'aperçu carré.
    // Se met à jour si le contenu (et donc la hauteur) change (ResizeObserver).
    useEffect(() => {
        // Rien à mesurer tant que la modale d'édition est fermée.
        if (editingId === null) {
            return undefined;
        }
        const formElement = editFormRef.current;
        if (!formElement) {
            return undefined;
        }
        const measure = () => setPreviewSize(formElement.offsetHeight);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(formElement);
        return () => observer.disconnect();
    }, [editingId]);

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

    // Garde une réf à jour vers persistOrder pour les écouteurs globaux de pointeur.
    persistOrderRef.current = persistOrder;

    /**
     * Pendant le glissement : déplace le clone, et réordonne en plaçant la carte
     * tirée avant la carte actuellement sous le curseur (tri vivant).
     * Stable (useCallback []) pour pouvoir s'ajouter/retirer comme écouteur global.
     * @param {PointerEvent} event Événement pointermove.
     * @returns {void} Aucune valeur de retour.
     */
    const onPointerMove = useCallback((event) => {
        const drag = dragRef.current;
        if (!drag.id) {
            return;
        }
        // Seuil de déclenchement : on n'amorce le drag qu'au-delà de 5px (sinon clic).
        if (!drag.active) {
            if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5) {
                return;
            }
            drag.active = true;
            setDraggingId(drag.id);
        }
        // Le clone suit le curseur en conservant le point de saisie.
        setClonePos({ x: event.clientX - drag.offsetX, y: event.clientY - drag.offsetY });

        // Carte sous le curseur (le clone est pointer-events:none, donc ignoré).
        const element = document.elementFromPoint(event.clientX, event.clientY);
        const card = element && element.closest("[data-dnd-id]");
        const targetId = card && card.getAttribute("data-dnd-id");
        if (targetId && String(targetId) !== String(drag.id)) {
            // Réordonne : retire la carte tirée puis la réinsère avant la cible.
            setActive((current) => {
                const fromIndex = current.findIndex((entry) => String(entry.id) === String(drag.id));
                if (fromIndex === -1) {
                    return current;
                }
                const next = [...current];
                const [moved] = next.splice(fromIndex, 1);
                const insertAt = next.findIndex((entry) => String(entry.id) === String(targetId));
                if (insertAt === -1) {
                    return current;
                }
                next.splice(insertAt, 0, moved);
                return next;
            });
        }
    }, []);

    /**
     * Fin du glissement : retire les écouteurs, persiste l'ordre et réinitialise.
     * @returns {void} Aucune valeur de retour.
     */
    const onPointerUp = useCallback(() => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        const wasActive = dragRef.current.active;
        dragRef.current = { id: null, active: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0, width: 0 };
        if (wasActive) {
            setDraggingId(null);
            if (persistOrderRef.current) {
                persistOrderRef.current(activeRef.current);
            }
        }
    }, [onPointerMove]);

    /**
     * Amorce un éventuel glissement de carte au pointeur (souris/tactile). Les
     * éléments interactifs (boutons, liens, champs) gardent leur comportement.
     * @param {React.PointerEvent} event Événement pointerdown.
     * @param {object} item Entrée de galerie de la carte.
     * @returns {void} Aucune valeur de retour.
     */
    function handleCardPointerDown(event, item) {
        if (event.button !== 0 || event.target.closest("button, a, input, label, select, textarea")) {
            return;
        }
        // Empêche la sélection de texte / le drag natif d'image pendant le glissement.
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        dragRef.current = {
            id: item.id,
            active: false,
            startX: event.clientX,
            startY: event.clientY,
            offsetX: event.clientX - rect.left,
            offsetY: event.clientY - rect.top,
            width: rect.width,
        };
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
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
    function trashItem(item) {
        // Confirmation systématique avant tout retrait (même réversible).
        askConfirm({
            title: "Mettre à la corbeille",
            message: `Mettre « ${item.title || "cette entrée"} » à la corbeille ? Vous pourrez la restaurer ensuite.`,
            confirmLabel: "Mettre à la corbeille",
            onConfirm: async () => {
                try {
                    await apiFetch(`/items/gallery_items/${item.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ trashed: true }),
                    });
                    await loadItems();
                } catch (error) {
                    setFeedback(error.message || "Mise à la corbeille impossible.");
                }
            },
        });
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
    function emptyTrash() {
        askConfirm({
            title: "Vider la corbeille",
            message: `${trash.length} élément(s) seront supprimés définitivement. Cette action est irréversible.`,
            confirmLabel: "Vider la corbeille",
            danger: true,
            onConfirm: async () => {
                try {
                    await Promise.all(
                        trash.map((item) => apiFetch(`/items/gallery_items/${item.id}`, { method: "DELETE" })),
                    );
                    await loadItems();
                    setFeedback("Corbeille vidée.");
                } catch (error) {
                    setFeedback(error.message || "Impossible de vider la corbeille.");
                }
            },
        });
    }

    /**
     * Supprime définitivement une seule entrée de la corbeille (après confirmation).
     * @param {object} item Entrée à supprimer définitivement.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    function deletePermanently(item) {
        askConfirm({
            title: "Supprimer définitivement",
            message: `Supprimer définitivement « ${item.title || "cette entrée"} » ? Cette action est irréversible.`,
            confirmLabel: "Supprimer",
            danger: true,
            onConfirm: async () => {
                try {
                    await apiFetch(`/items/gallery_items/${item.id}`, { method: "DELETE" });
                    await loadItems();
                } catch (error) {
                    setFeedback(error.message || "Suppression impossible.");
                }
            },
        });
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

    /**
     * Rend l'aperçu média d'une entrée (photo, avant/après en direct ou vidéo).
     * Mutualisé entre les cartes de la grille et le rappel d'image de la modale.
     * Les images sont demandées en 16:9 (480×270) pour un cadrage homogène.
     * @param {object} item Entrée de galerie à illustrer.
     * @returns {JSX.Element} L'aperçu correspondant au type de média.
     */
    function renderMedia(item) {
        const type = item.media_type || "image";

        // Avant/après : curseur comparatif en direct.
        if (type === "before_after" && item.before_image && item.after_image) {
            return (
                <BeforeAfterSlider
                    beforeUrl={assetUrl(item.before_image, { width: 480, height: 270, fit: "cover" })}
                    afterUrl={assetUrl(item.after_image, { width: 480, height: 270, fit: "cover" })}
                    beforeAlt={`Avant — ${altOf(item)}`}
                    afterAlt={`Après — ${altOf(item)}`}
                />
            );
        }

        // Vidéo : miniature YouTube (ou repli icône film) + bouton Play centré.
        if (type === "video") {
            return (
                <a className="gallery-card__video" href={item.video_url || "#"} target="_blank" rel="noreferrer" title="Ouvrir la vidéo" draggable={false}>
                    {youtubeThumbnail(item.video_url)
                        ? <img src={youtubeThumbnail(item.video_url)} alt={altOf(item)} draggable={false} />
                        : <span className="gallery-card__video-fallback"><Film /></span>}
                    <span className="gallery-card__play"><Play /></span>
                </a>
            );
        }

        // Photo simple (ou repli si l'image manque).
        return item.image
            ? <img src={assetUrl(item.image, { width: 480, height: 270, fit: "cover" })} alt={altOf(item)} draggable={false} />
            : <div className="realisation-card__empty">—</div>;
    }

    // Entrée actuellement éditée (pour le rappel d'image dans la modale).
    const editingItem = active.find((item) => item.id === editingId) || null;

    return (
        <div className="dashboard-section">
            {/* En-tête : vue Galerie (titre + actions) ou vue Corbeille (fil d'Ariane). */}
            {view === "gallery" ? (
                <div className="dashboard-section__head">
                    <div>
                        <h2>Galerie</h2>
                        <p className="dashboard-section__subtitle">
                            Glissez les cartes pour les réordonner. Déposez une photo, ou deux pour un avant/après.
                        </p>
                    </div>
                    <div className="dashboard-section__actions">
                        <button className="button button--ghost" onClick={() => setVideoOpen((open) => !open)} title="Ajouter une vidéo (lien YouTube ou Vimeo)">
                            <Video /> Ajouter une vidéo
                        </button>
                        {/* Corbeille en icône, avec le nombre d'éléments s'il y en a. */}
                        <button className="trash-toggle" onClick={() => setView("trash")} title="Ouvrir la corbeille" aria-label="Ouvrir la corbeille">
                            <Trash2 />
                            {trash.length > 0 && <span className="trash-toggle__count">{trash.length}</span>}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="dashboard-section__head">
                    {/* Le titre devient un fil d'Ariane cliquable pour revenir à la galerie. */}
                    <button className="dashboard-breadcrumb" onClick={() => setView("gallery")} title="Revenir à la galerie">
                        <ArrowLeft />
                        <span>Galerie</span>
                        <span className="dashboard-breadcrumb__sep">/</span>
                        <strong>Corbeille</strong>
                    </button>
                    {trash.length > 0 && (
                        <button className="button button--ghost" onClick={emptyTrash} title="Supprimer définitivement tous les éléments de la corbeille">
                            <Trash2 /> Vider la corbeille
                        </button>
                    )}
                </div>
            )}

            {feedback && <p className="dashboard-feedback">{feedback}</p>}

            {/* Formulaire d'ajout de vidéo (replié par défaut, vue Galerie seulement). */}
            {view === "gallery" && videoOpen && (
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

            {/* Grille (vue Galerie) : cartes réordonnables + carte d'ajout. */}
            {view === "gallery" && (
            <div className="gallery-grid">
                {active.map((item) => (
                        <article
                            className={`gallery-card deletable${item.id === draggingId ? " gallery-card--placeholder" : ""}`}
                            key={item.id}
                            data-dnd-id={item.id}
                            onPointerDown={(event) => handleCardPointerDown(event, item)}
                            title="Glissez pour réordonner"
                        >
                        {/* Aperçu 16:9 (mutualisé avec la modale d'édition). */}
                        <div className="gallery-card__image">{renderMedia(item)}</div>
                        <div className="gallery-card__body">
                            {/* Titre + sous-titre empilés, sur une seule colonne. */}
                            <div className="gallery-card__text">
                                <strong>{item.title || "Sans titre"}</strong>
                                <span>{[MEDIA_TYPE_LABELS[item.media_type || "image"], item.caption].filter(Boolean).join(" · ")}</span>
                            </div>
                            {/* Modification à côté du titre. */}
                            <div className="gallery-card__actions">
                                <button className="icon-button icon-button--sm" onClick={() => startEdit(item)} aria-label="Modifier" title="Modifier le titre, la légende et le texte alternatif"><Pencil /></button>
                            </div>
                        </div>
                        {/* Mise à la corbeille (réversible) : corbeille douce en bas à droite. */}
                        <button className="delete-badge delete-badge--soft delete-badge--corner" onClick={() => trashItem(item)} aria-label="Mettre à la corbeille" title="Mettre à la corbeille (réversible)"><Trash2 /></button>
                        </article>
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
            )}

            {/* Contenu de la corbeille (vue Corbeille) : mêmes cartes 16:9, avec
                restauration et suppression définitive par élément. */}
            {view === "trash" && (
                <div className="gallery-grid">
                    {trash.map((item) => (
                        <article className="gallery-card deletable" key={item.id}>
                            <div className="gallery-card__image">{renderMedia(item)}</div>
                            <div className="gallery-card__body">
                                <div className="gallery-card__text">
                                    <strong>{item.title || "Sans titre"}</strong>
                                    <span>{[MEDIA_TYPE_LABELS[item.media_type || "image"], item.caption].filter(Boolean).join(" · ")}</span>
                                </div>
                                <div className="gallery-card__actions">
                                    <button className="icon-button icon-button--sm" onClick={() => restoreItem(item)} aria-label="Restaurer" title="Restaurer dans la galerie"><RotateCcw /></button>
                                </div>
                            </div>
                            {/* Suppression définitive : corbeille rouge en bas à droite. */}
                            <button className="delete-badge delete-badge--corner" onClick={() => deletePermanently(item)} aria-label="Supprimer définitivement" title="Supprimer définitivement (irréversible)"><Trash2 /></button>
                        </article>
                    ))}
                    {trash.length === 0 && (
                        <div className="empty-state">La corbeille est vide.</div>
                    )}
                </div>
            )}

            {/* Modale d'édition des métadonnées : fond flouté, rappel de l'image à
                gauche (1fr) et formulaire à droite (3fr). Un clic sur le fond ferme. */}
            {editingId !== null && editingItem && (
                <Modal onClose={() => setEditingId(null)}>
                    <div className="modal__layout">
                            {/* Rappel visuel carré, exactement à la hauteur du formulaire. */}
                            <div
                                className="modal__preview"
                                style={previewSize ? { width: previewSize, height: previewSize } : undefined}
                            >
                                {renderMedia(editingItem)}
                            </div>

                            {/* Formulaire des métadonnées (sa hauteur dimensionne l'aperçu). */}
                            <div className="modal__form" ref={editFormRef}>
                                <h3>Modifier l’entrée</h3>
                                <label className="dashboard-field" title="Titre affiché sous le média">
                                    <span>Titre</span>
                                    <input value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} />
                                </label>
                                <label className="dashboard-field" title="Courte description affichée sous le titre">
                                    <span>Légende</span>
                                    <input value={editForm.caption} onChange={(event) => setEditForm((current) => ({ ...current, caption: event.target.value }))} />
                                </label>
                                <label className="dashboard-field" title="Texte alternatif : décrit l’image pour l’accessibilité et le référencement">
                                    <span>Texte alternatif (alt)</span>
                                    <input value={editForm.alt_text} onChange={(event) => setEditForm((current) => ({ ...current, alt_text: event.target.value }))} placeholder="Peugeot 205 GTI rouge après lustrage" />
                                </label>
                                <label className="dashboard-field" title="Catégorie pour regrouper/filtrer les médias">
                                    <span>Catégorie</span>
                                    <input value={editForm.category} onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))} />
                                </label>
                                <div className="realisation-form__actions">
                                    <button className="button button--ghost" onClick={() => setEditingId(null)} title="Fermer sans enregistrer">Annuler</button>
                                    <button className="button" onClick={saveEdit} title="Enregistrer les modifications">Enregistrer</button>
                                </div>
                            </div>
                        </div>
                </Modal>
            )}

            {/* Boîte de confirmation réutilisable (mise à la corbeille, purge,
                suppression définitive). Remplace window.confirm partout ici. */}
            {confirmState && (
                <ConfirmDialog
                    title={confirmState.title}
                    message={confirmState.message}
                    confirmLabel={confirmState.confirmLabel}
                    danger={confirmState.danger}
                    onConfirm={async () => {
                        // On ferme la boîte puis on exécute l'action confirmée.
                        const action = confirmState.onConfirm;
                        setConfirmState(null);
                        if (action) {
                            await action();
                        }
                    }}
                    onCancel={() => setConfirmState(null)}
                />
            )}

            {/* Clone flottant suivant le curseur pendant le glissement : soulevé
                (110 %, légère rotation, ombre portée), opacité pleine. */}
            {draggingId && (() => {
                // Entrée tirée, retrouvée par id (la liste se réordonne en direct).
                const cloneItem = active.find((entry) => String(entry.id) === String(draggingId));
                if (!cloneItem) {
                    return null;
                }
                return (
                    <div
                        className="drag-clone"
                        style={{ left: clonePos.x, top: clonePos.y, width: dragRef.current.width }}
                        aria-hidden="true"
                    >
                        <article className="gallery-card">
                            <div className="gallery-card__image">{renderMedia(cloneItem)}</div>
                            <div className="gallery-card__body">
                                <div className="gallery-card__text">
                                    <strong>{cloneItem.title || "Sans titre"}</strong>
                                    <span>{MEDIA_TYPE_LABELS[cloneItem.media_type || "image"]}</span>
                                </div>
                            </div>
                        </article>
                    </div>
                );
            })()}
        </div>
    );
}
