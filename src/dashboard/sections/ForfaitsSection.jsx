import { useCallback, useEffect, useRef, useState } from "react";
import {
    Award,
    Car,
    Check,
    ChevronDown,
    Crown,
    Diamond,
    Droplets,
    Gem,
    GripVertical,
    Medal,
    Plus,
    Shield,
    Sparkles,
    Star,
    Trash2,
    Wrench,
    Zap,
} from "lucide-react";
import { apiFetch } from "../directusClient.js";
import ConfirmDialog from "../../slyk/ConfirmDialog.jsx";
import ErrorToast from "../../slyk/ErrorToast.jsx";
import useDragReorder from "../../slyk/useDragReorder.js";

// Couleur par défaut d'un niveau tant qu'aucune n'est choisie.
const DEFAULT_COLOR = "#b91c1c";

// Champs des familles + leurs forfaits (prix/contenu), avec le niveau rattaché.
const GROUP_QUERY =
    "fields=id,key,title,subtitle,bonus_label,discounts," +
    "tiers.id,tiers.price,tiers.duration,tiers.includes,tiers.features,tiers.level,tiers.sort" +
    "&sort=sort&limit=-1";

// Palette d'icônes proposée pour un niveau (clé stable ↔ composant lucide).
const ICON_CHOICES = [
    { key: "sparkles", Comp: Sparkles },
    { key: "star", Comp: Star },
    { key: "crown", Comp: Crown },
    { key: "gem", Comp: Gem },
    { key: "diamond", Comp: Diamond },
    { key: "award", Comp: Award },
    { key: "medal", Comp: Medal },
    { key: "shield", Comp: Shield },
    { key: "droplets", Comp: Droplets },
    { key: "car", Comp: Car },
    { key: "wrench", Comp: Wrench },
    { key: "zap", Comp: Zap },
];
const ICON_MAP = Object.fromEntries(ICON_CHOICES.map(({ key, Comp }) => [key, Comp]));

// Compteur de clés stables pour les lignes de prestation (les prestations sont
// de simples chaînes en base ; on leur associe une clé stable en mémoire pour
// le rendu React et le glisser-déposer).
let featKeyCounter = 0;
function nextFeatKey() {
    featKeyCounter += 1;
    return `f${featKeyCounter}`;
}

/**
 * Décompose une durée stockée (« ≈ 1h45 ») en heures et minutes.
 * @param {string} duration Durée au format texte (peut être vide).
 * @returns {{ hours: string, minutes: string }} Parties h/min (chaînes).
 */
function parseDuration(duration) {
    const match = (duration || "").match(/(\d+)\s*h\s*(\d*)/i);
    if (!match) {
        return { hours: "", minutes: "" };
    }
    return { hours: match[1], minutes: match[2] || "" };
}

/**
 * Reconstruit la durée stockée (« ≈ 4h » sans minutes, « ≈ 1h45 » avec).
 * @param {string|number} hours Heures saisies.
 * @param {string|number} minutes Minutes saisies.
 * @returns {string} Durée formatée (vide si rien).
 */
function formatDuration(hours, minutes) {
    const h = String(hours ?? "").trim();
    const m = String(minutes ?? "").trim();
    if (!h && !m) {
        return "";
    }
    const minutesPart = m && Number(m) > 0 ? `${String(Number(m)).padStart(2, "0")}` : "";
    return `≈ ${h || 0}h${minutesPart}`;
}

/**
 * Section « Forfaits » du Dashboard.
 *
 * Modèle en deux temps, pensé pour un artisan :
 *  - une BANDE « Vos niveaux » (Platine, Premium…) définit l'identité de chaque
 *    niveau UNE seule fois : nom, icône, couleur ;
 *  - des ONGLETS par famille (Intérieur, Extérieur…) où l'on ne saisit que le
 *    PRIX et le CONTENU (durée, prestations, « complète »).
 *
 * Ajouter un niveau le fait apparaître dans toutes les familles. Tout s'enregistre
 * automatiquement (pas de bouton « Enregistrer »).
 * @returns {JSX.Element} La section Forfaits.
 */
export default function ForfaitsSection() {
    // Niveaux partagés (triés), et familles avec leurs forfaits.
    const [levels, setLevels] = useState([]);
    const [groups, setGroups] = useState([]);
    // Famille affichée (onglet actif).
    const [activeKey, setActiveKey] = useState(null);
    // Message discret (« ✓ Enregistré » / erreur) et confirmation de suppression.
    const [feedback, setFeedback] = useState("");
    const [confirmState, setConfirmState] = useState(null);
    // Menus déroulants ouverts : icône (id de niveau) et « complète » (id de forfait).
    const [iconMenuFor, setIconMenuFor] = useState(null);
    const [includesMenuFor, setIncludesMenuFor] = useState(null);
    // Sélecteur « ajouter un niveau existant à cette famille » ouvert ?
    const [addPickerOpen, setAddPickerOpen] = useState(false);
    // Feedback de sauvegarde : quel élément vient d'être enregistré (clé) + un
    // « nonce » qui incrémente à chaque save pour relancer l'animation.
    const [saved, setSaved] = useState({ key: null, nonce: 0 });

    /**
     * Recharge niveaux + familles depuis Directus.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    const loadAll = useCallback(async () => {
        try {
            const [levelData, groupData] = await Promise.all([
                apiFetch("/items/formula_levels?fields=id,name,icon,color,sort&sort=sort&limit=-1"),
                apiFetch(`/items/formula_groups?${GROUP_QUERY}`),
            ]);
            setLevels(levelData || []);
            // On dote chaque ligne de prestation d'une clé stable (les prestations
            // sont des chaînes en base → objets {key, text} en mémoire).
            const withFeatureKeys = (groupData || []).map((group) => ({
                ...group,
                tiers: (group.tiers || []).map((tier) => ({
                    ...tier,
                    features: (tier.features || []).map((text) => ({ key: nextFeatKey(), text })),
                })),
            }));
            setGroups(withFeatureKeys);
            setActiveKey((current) => current ?? (groupData || [])[0]?.key ?? null);
        } catch (error) {
            setFeedback(error.message || "Impossible de charger les forfaits.");
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    /**
     * Signale qu'un élément vient d'être enregistré : déclenche le feedback vert
     * (bordure + toast) sur l'élément identifié par `key`.
     * @param {string} key Clé de l'élément enregistré (ex. `tier-12`).
     * @returns {void} Aucune valeur de retour.
     */
    function markSaved(key) {
        setSaved((current) => ({ key, nonce: current.nonce + 1 }));
    }

    // Efface le feedback ~1,5 s après la dernière sauvegarde (relancé à chaque save).
    useEffect(() => {
        if (!saved.key) {
            return undefined;
        }
        const timer = setTimeout(() => setSaved((current) => ({ key: null, nonce: current.nonce })), 1500);
        return () => clearTimeout(timer);
    }, [saved.key, saved.nonce]);

    /**
     * Rend le feedback vert (bordure + toast « Enregistré ») si `key` correspond
     * à l'élément fraîchement enregistré. Remonté par `nonce` pour rejouer l'anim.
     * @param {string} key Clé de l'élément.
     * @returns {JSX.Element|null} Le feedback, ou null.
     */
    function savedFx(key) {
        if (saved.key !== key) {
            return null;
        }
        return (
            <span className="save-feedback" key={saved.nonce} aria-hidden="true">
                <span className="save-flash" />
                <span className="save-toast">Enregistré</span>
            </span>
        );
    }

    /**
     * Rend l'identité d'un niveau (icône déroulante + nom coloré), éditable et
     * synchronisée partout où le niveau apparaît. Utilisé à la fois dans la bande
     * du haut et dans l'en-tête des cartes de forfait.
     *
     * IMPORTANT : c'est une fonction de rendu (pas un composant) pour que les
     * champs ne perdent pas le focus à chaque frappe.
     * @param {object} level Niveau à afficher/éditer.
     * @param {object} opts Options : menuKey (unique par emplacement), withColor,
     *   withDelete, onDelete.
     * @returns {JSX.Element} Les contrôles du niveau.
     */
    function levelControls(level, { menuKey, withColor = false, withDelete = false, onDelete }) {
        const IconComp = ICON_MAP[level.icon] || Sparkles;
        return (
            <>
                {/* Icône : menu déroulant. */}
                <div className="forfait-icon-dd save-anchor">
                    <button
                        type="button"
                        className="forfait-icon-dd__trigger"
                        onClick={() => setIconMenuFor(iconMenuFor === menuKey ? null : menuKey)}
                        aria-label="Choisir une icône"
                        aria-expanded={iconMenuFor === menuKey}
                        title="Choisir une icône"
                    >
                        <IconComp className="forfait-card__icon" />
                        <ChevronDown className="forfait-icon-dd__caret" />
                    </button>
                    {iconMenuFor === menuKey && (
                        <div className="forfait-icon-dd__menu" role="listbox">
                            {ICON_CHOICES.map(({ key, Comp }) => (
                                <button
                                    key={key}
                                    type="button"
                                    className={`forfait-icon-choice${level.icon === key ? " is-active" : ""}`}
                                    onClick={() => {
                                        patchLevelLocal(level.id, { icon: key });
                                        saveLevel(level.id, { icon: key }, `level-${level.id}-icon`);
                                        setIconMenuFor(null);
                                    }}
                                    aria-label={`Icône ${key}`}
                                    title={key}
                                >
                                    <Comp />
                                </button>
                            ))}
                        </div>
                    )}
                    {savedFx(`level-${level.id}-icon`)}
                </div>

                {/* Nom du niveau (coloré). */}
                <span className="save-anchor level-chip__name-wrap">
                    <input
                        className="level-chip__name"
                        style={{ color: level.color || DEFAULT_COLOR }}
                        value={level.name ?? ""}
                        placeholder="Nom du niveau"
                        aria-label="Nom du niveau"
                        onChange={(event) => patchLevelLocal(level.id, { name: event.target.value })}
                        onBlur={() => saveLevel(level.id, { name: level.name }, `level-${level.id}-name`)}
                    />
                    {savedFx(`level-${level.id}-name`)}
                </span>

                {/* Couleur (optionnelle : uniquement dans la bande). */}
                {withColor && (
                    <span className="save-anchor">
                        <input
                            type="color"
                            className="forfait-card__color"
                            value={level.color || DEFAULT_COLOR}
                            aria-label="Couleur du niveau"
                            title="Couleur du niveau et du titre"
                            onChange={(event) => patchLevelLocal(level.id, { color: event.target.value })}
                            onBlur={() => saveLevel(level.id, { color: level.color || DEFAULT_COLOR }, `level-${level.id}-color`)}
                        />
                        {savedFx(`level-${level.id}-color`)}
                    </span>
                )}

                {/* Suppression (optionnelle : uniquement dans la bande). */}
                {withDelete && (
                    <button
                        type="button"
                        className="delete-badge delete-badge--sm"
                        onClick={onDelete}
                        aria-label="Supprimer ce niveau"
                        title="Supprimer ce niveau (dans toutes les familles)"
                    >
                        <Trash2 />
                    </button>
                )}
            </>
        );
    }

    /* ============================ Niveaux (bande) ============================= */

    /**
     * Met à jour un niveau localement (champ contrôlé réactif).
     * @param {number} levelId Identifiant du niveau.
     * @param {object} patch Champs modifiés.
     * @returns {void} Aucune valeur de retour.
     */
    function patchLevelLocal(levelId, patch) {
        setLevels((current) => current.map((level) => (level.id === levelId ? { ...level, ...patch } : level)));
    }

    /**
     * Enregistre un niveau (nom / icône / couleur).
     * @param {number} levelId Identifiant du niveau.
     * @param {object} patch Champs à enregistrer.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function saveLevel(levelId, patch, feedbackKey) {
        try {
            await apiFetch(`/items/formula_levels/${levelId}`, { method: "PATCH", body: JSON.stringify(patch) });
            markSaved(feedbackKey || `level-${levelId}`);
        } catch (error) {
            setFeedback(error.message || "Enregistrement impossible.");
            await loadAll();
        }
    }

    /**
     * Crée un forfait (cellule) reliant un niveau à une famille.
     * @param {number} groupId Famille cible.
     * @param {number} levelId Niveau à rattacher.
     * @param {number} sort Position dans la famille.
     * @returns {Promise<object>} Le forfait créé.
     */
    function createTier(groupId, levelId, sort) {
        return apiFetch("/items/formula_tiers", {
            method: "POST",
            body: JSON.stringify({ group: groupId, level: levelId, price: null, duration: "", features: [], sort }),
        });
    }

    /**
     * Crée un nouveau niveau (identité) et le rend visible immédiatement en
     * l'ajoutant à la famille actuellement affichée.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function addLevel() {
        try {
            const level = await apiFetch("/items/formula_levels", {
                method: "POST",
                body: JSON.stringify({ name: "Nouveau niveau", icon: "sparkles", color: DEFAULT_COLOR, sort: levels.length }),
            });
            // On l'attribue à la famille en cours (sinon on ne verrait rien).
            const current = groups.find((group) => group.key === activeKey);
            if (current) {
                await createTier(current.id, level.id, (current.tiers || []).length);
            }
            await loadAll();
        } catch (error) {
            setFeedback(error.message || "Ajout du niveau impossible.");
        }
    }

    /**
     * Attribue un niveau EXISTANT à la famille active (crée le forfait vide).
     * @param {object} group Famille cible.
     * @param {number} levelId Niveau à ajouter.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function addLevelToGroup(group, levelId) {
        try {
            await createTier(group.id, levelId, (group.tiers || []).length);
            setAddPickerOpen(false);
            await loadAll();
        } catch (error) {
            setFeedback(error.message || "Ajout impossible.");
        }
    }

    /**
     * Retire un niveau de CETTE famille uniquement (supprime le forfait, garde
     * l'identité du niveau et ses forfaits dans les autres familles).
     * @param {object} tier Forfait à retirer.
     * @param {object} level Niveau concerné (pour le message).
     * @returns {void} Aucune valeur de retour.
     */
    function removeTierFromFamily(tier, level) {
        setConfirmState({
            title: "Retirer de cette famille",
            message: `Retirer « ${level.name || "ce niveau"} » de la famille « ${activeGroup?.title} » ? Le niveau et ses autres familles sont conservés.`,
            confirmLabel: "Retirer",
            danger: true,
            onConfirm: async () => {
                try {
                    await apiFetch(`/items/formula_tiers/${tier.id}`, { method: "DELETE" });
                    await loadAll();
                } catch (error) {
                    setFeedback(error.message || "Retrait impossible.");
                }
            },
        });
    }

    /**
     * Supprime un niveau (et tous ses forfaits, dans toutes les familles).
     * @param {object} level Niveau à supprimer.
     * @returns {void} Aucune valeur de retour.
     */
    function removeLevel(level) {
        setConfirmState({
            title: "Supprimer ce niveau",
            message: `Supprimer « ${level.name || "sans nom"} » ? Il disparaîtra de TOUTES les familles, avec ses prix et contenus. Action irréversible.`,
            confirmLabel: "Supprimer",
            danger: true,
            onConfirm: async () => {
                try {
                    // Retire d'abord les forfaits liés, puis le niveau.
                    const linked = groups.flatMap((group) =>
                        (group.tiers || []).filter((tier) => tier.level === level.id).map((tier) => tier.id),
                    );
                    await Promise.all(linked.map((id) => apiFetch(`/items/formula_tiers/${id}`, { method: "DELETE" })));
                    await apiFetch(`/items/formula_levels/${level.id}`, { method: "DELETE" });
                    await loadAll();
                } catch (error) {
                    setFeedback(error.message || "Suppression impossible.");
                }
            },
        });
    }

    /* ============================ Forfaits (cartes) =========================== */

    /**
     * Met à jour un forfait localement.
     * @param {number} tierId Identifiant du forfait.
     * @param {object} patch Champs modifiés.
     * @returns {void} Aucune valeur de retour.
     */
    function patchTierLocal(tierId, patch) {
        setGroups((current) =>
            current.map((group) => ({
                ...group,
                tiers: (group.tiers || []).map((tier) => (tier.id === tierId ? { ...tier, ...patch } : tier)),
            })),
        );
    }

    /**
     * Enregistre un forfait (prix / durée / prestations / complète).
     * @param {number} tierId Identifiant du forfait.
     * @param {object} patch Champs à enregistrer.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function saveTier(tierId, patch, feedbackKey) {
        try {
            await apiFetch(`/items/formula_tiers/${tierId}`, { method: "PATCH", body: JSON.stringify(patch) });
            markSaved(feedbackKey || `tier-${tierId}`);
        } catch (error) {
            setFeedback(error.message || "Enregistrement impossible.");
            await loadAll();
        }
    }

    /**
     * Enregistre les réductions combinées d'une famille.
     * @param {number} groupId Identifiant de la famille.
     * @param {object} discounts Pourcentages par nom de niveau.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function saveDiscounts(groupId, discounts, feedbackKey) {
        try {
            await apiFetch(`/items/formula_groups/${groupId}`, { method: "PATCH", body: JSON.stringify({ discounts }) });
            markSaved(feedbackKey || `discounts-${groupId}`);
        } catch (error) {
            setFeedback(error.message || "Enregistrement impossible.");
            await loadAll();
        }
    }

    function patchGroupLocal(groupId, patch) {
        setGroups((current) => current.map((group) => (group.id === groupId ? { ...group, ...patch } : group)));
    }

    /* ------------------------------- Prestations -------------------------------- */

    // Prestations = objets {key, text} en mémoire ; en base = tableau de chaînes.
    function featureTexts(tier) {
        return (tier.features || []).map((feature) => feature.text);
    }

    function editFeatureLocal(tier, key, value) {
        const features = (tier.features || []).map((feature) =>
            feature.key === key ? { ...feature, text: value } : feature,
        );
        patchTierLocal(tier.id, { features });
    }

    async function addFeature(tier) {
        const features = [...(tier.features || []), { key: nextFeatKey(), text: "" }];
        patchTierLocal(tier.id, { features });
        // La ligne ajoutée peut être vide : on ancre le feedback sur la liste.
        await saveTier(tier.id, { features: features.map((f) => f.text) }, `tier-${tier.id}-features`);
    }

    async function removeFeature(tier, key) {
        const features = (tier.features || []).filter((feature) => feature.key !== key);
        patchTierLocal(tier.id, { features });
        // La ligne disparaît : on ancre le feedback sur la liste des prestations.
        await saveTier(tier.id, { features: features.map((f) => f.text) }, `tier-${tier.id}-features`);
    }

    /* -------------------------- Glisser-déposer (ordre) ------------------------- */

    // Réfs vers l'ordre courant (lues au relâchement pour persister).
    const levelsRef = useRef(levels);
    levelsRef.current = levels;
    const groupsRef = useRef(groups);
    groupsRef.current = groups;

    /**
     * Réordonne un tableau d'objets par id (clé stable) et réaligne `sort`.
     * @param {Array} list Liste actuelle.
     * @param {string} fromKey Id de l'élément tiré.
     * @param {string} overKey Id de l'élément survolé.
     * @returns {Array} Liste réordonnée (sort = index), ou l'originale si introuvable.
     */
    function reorderById(list, fromKey, overKey) {
        const from = list.findIndex((item) => String(item.id) === fromKey);
        const over = list.findIndex((item) => String(item.id) === overKey);
        if (from < 0 || over < 0) {
            return list;
        }
        const next = [...list];
        const [moved] = next.splice(from, 1);
        next.splice(over, 0, moved);
        return next.map((item, index) => ({ ...item, sort: index }));
    }

    // Drag « façon Galerie » des NIVEAUX (ordre global : pastilles + cartes).
    const levelsDrag = useDragReorder({
        scope: "level",
        onReorder: (fromKey, overKey) => setLevels((current) => reorderById(current, fromKey, overKey)),
        onDrop: async () => {
            try {
                await Promise.all(
                    levelsRef.current.map((level, index) =>
                        apiFetch(`/items/formula_levels/${level.id}`, { method: "PATCH", body: JSON.stringify({ sort: index }) }),
                    ),
                );
                markSaved("levels-order");
            } catch (error) {
                setFeedback(error.message || "Réordonnancement impossible.");
                await loadAll();
            }
        },
    });

    // Drag « façon Galerie » des FAMILLES (onglets).
    const familiesDrag = useDragReorder({
        scope: "family",
        onReorder: (fromKey, overKey) => setGroups((current) => reorderById(current, fromKey, overKey)),
        onDrop: async () => {
            try {
                await Promise.all(
                    groupsRef.current.map((group, index) =>
                        apiFetch(`/items/formula_groups/${group.id}`, { method: "PATCH", body: JSON.stringify({ sort: index }) }),
                    ),
                );
                markSaved("families-order");
            } catch (error) {
                setFeedback(error.message || "Réordonnancement impossible.");
                await loadAll();
            }
        },
    });

    // Drag « façon Galerie » des LIGNES de prestation (dans un même forfait).
    const featDragTierRef = useRef(null);
    const featuresDrag = useDragReorder({
        scope: "feat",
        onReorder: (fromKey, overKey) =>
            setGroups((current) =>
                current.map((group) => ({
                    ...group,
                    tiers: (group.tiers || []).map((tier) => {
                        const from = (tier.features || []).findIndex((f) => f.key === fromKey);
                        const over = (tier.features || []).findIndex((f) => f.key === overKey);
                        // Les deux lignes doivent appartenir au MÊME forfait.
                        if (from < 0 || over < 0) {
                            return tier;
                        }
                        featDragTierRef.current = tier.id;
                        const next = [...tier.features];
                        const [moved] = next.splice(from, 1);
                        next.splice(over, 0, moved);
                        return { ...tier, features: next };
                    }),
                })),
            ),
        onDrop: async () => {
            const tierId = featDragTierRef.current;
            const tier = groupsRef.current.flatMap((g) => g.tiers || []).find((t) => t.id === tierId);
            if (tier) {
                await saveTier(tierId, { features: tier.features.map((f) => f.text) }, `tier-${tierId}-features`);
            }
        },
    });

    /* ---------------------------------- Rendu ----------------------------------- */

    // Accès rapide à un niveau par son id (pour l'identité affichée sur les cartes).
    const levelById = Object.fromEntries(levels.map((level) => [level.id, level]));
    // Famille active + ses forfaits triés selon l'ordre des niveaux.
    const activeGroup = groups.find((group) => group.key === activeKey) || null;
    const orderedTiers = activeGroup
        ? [...(activeGroup.tiers || [])].sort(
              (a, b) => (levelById[a.level]?.sort ?? 99) - (levelById[b.level]?.sort ?? 99),
          )
        : [];
    // Niveaux existants pas encore présents dans la famille active (proposés à l'ajout).
    const presentLevelIds = new Set(orderedTiers.map((tier) => tier.level));
    const availableLevels = levels.filter((level) => !presentLevelIds.has(level.id));

    return (
        <div className="dashboard-section">
            <div className="dashboard-section__head">
                <div>
                    <h2>Forfaits</h2>
                    <p className="dashboard-section__subtitle">
                        Définissez vos niveaux en haut, puis leurs prix et contenus par famille. Tout s’enregistre tout seul.
                    </p>
                </div>
            </div>

            <ErrorToast message={feedback} onClose={() => setFeedback("")} />

            {/* ===================== Bande « Vos niveaux » ====================== */}
            <div className="level-strip">
                <span className="level-strip__title">Vos niveaux</span>
                <div className="level-strip__items">
                    {levels.map((level) => (
                        <div
                            className={`level-chip deletable${levelsDrag.draggingKey === String(level.id) ? " is-dnd-ghost" : ""}`}
                            key={level.id}
                            data-dnd-scope="level"
                            data-dnd-key={level.id}
                            style={{ "--tier-color": level.color || DEFAULT_COLOR }}
                        >
                            {/* Poignée de glissement « façon Galerie » (clone flottant). */}
                            <span
                                className="drag-grip"
                                onPointerDown={(event) => levelsDrag.startDrag(event, level.id)}
                                title="Glisser pour réordonner"
                                aria-label="Réordonner ce niveau"
                            >
                                <GripVertical />
                            </span>
                            {levelControls(level, {
                                menuKey: `strip-${level.id}`,
                                withColor: true,
                                withDelete: true,
                                onDelete: () => removeLevel(level),
                            })}
                        </div>
                    ))}

                    <button type="button" className="level-strip__add" onClick={addLevel} title="Ajouter un niveau (apparaît dans toutes les familles)">
                        <Plus /> Ajouter un niveau
                    </button>
                </div>
            </div>

            {/* ======================= Onglets des familles ===================== */}
            {groups.length > 0 && (
                <div className="forfait-tabs">
                    {groups.map((group) => (
                        <button
                            key={group.id}
                            type="button"
                            data-dnd-scope="family"
                            data-dnd-key={group.id}
                            className={`forfait-tab${group.key === activeKey ? " is-active" : ""}${familiesDrag.draggingKey === String(group.id) ? " is-dnd-ghost" : ""}`}
                            onClick={() => {
                                setActiveKey(group.key);
                                setAddPickerOpen(false);
                            }}
                            title={`Voir les forfaits : ${group.title} (glisser la poignée pour réordonner)`}
                        >
                            <span
                                className="forfait-tab__grip drag-grip"
                                onPointerDown={(event) => familiesDrag.startDrag(event, group.id)}
                                title="Glisser pour réordonner"
                                aria-label="Réordonner cette famille"
                            >
                                <GripVertical />
                            </span>
                            {group.title}
                        </button>
                    ))}
                </div>
            )}

            {/* ===================== Cartes prix + contenu ====================== */}
            {activeGroup && (
                <>
                    <div className="forfait-grid">
                        {orderedTiers.map((tier) => {
                            const level = levelById[tier.level] || {};
                            const color = level.color || DEFAULT_COLOR;
                            const { hours, minutes } = parseDuration(tier.duration);
                            return (
                                <article
                                    className={`forfait-card deletable${levelsDrag.draggingKey === String(tier.level) ? " is-dnd-ghost" : ""}`}
                                    key={tier.id}
                                    data-dnd-scope="level"
                                    data-dnd-key={tier.level}
                                    style={{ "--tier-color": color }}
                                >
                                    {/* En-tête = même pastille que la bande (icône + nom),
                                        SANS le choix de couleur ni la corbeille. Éditable et
                                        synchronisé avec la bande. */}
                                    <div className="forfait-card__head level-chip" style={{ "--tier-color": color }}>
                                        {/* Poignée : réordonne le niveau « façon Galerie ». */}
                                        <span
                                            className="drag-grip"
                                            onPointerDown={(event) => levelsDrag.startDrag(event, tier.level)}
                                            title="Glisser pour réordonner le niveau"
                                            aria-label="Réordonner ce niveau"
                                        >
                                            <GripVertical />
                                        </span>
                                        {levelControls(level, { menuKey: `card-${tier.id}` })}
                                    </div>

                                    {/* Prix. */}
                                    <label className="forfait-card__price save-anchor" title="Prix du forfait, en euros">
                                        <input
                                            type="number"
                                            min="0"
                                            value={tier.price ?? ""}
                                            onChange={(event) =>
                                                patchTierLocal(tier.id, {
                                                    price: event.target.value === "" ? null : Number(event.target.value),
                                                })
                                            }
                                            onBlur={() => saveTier(tier.id, { price: tier.price }, `tier-${tier.id}-price`)}
                                        />
                                        <span className="forfait-card__euro">€</span>
                                        {savedFx(`tier-${tier.id}-price`)}
                                    </label>

                                    {/* Durée : « ≈ » fixe + heures / minutes. */}
                                    <div className="forfait-card__duration save-anchor" title="Durée indicative de la prestation">
                                        <span className="forfait-card__approx" aria-hidden="true">≈</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={hours}
                                            aria-label="Heures"
                                            onChange={(event) => patchTierLocal(tier.id, { duration: formatDuration(event.target.value, minutes) })}
                                            onBlur={() => saveTier(tier.id, { duration: tier.duration }, `tier-${tier.id}-duration`)}
                                        />
                                        <span className="forfait-card__unit">h</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="59"
                                            value={minutes}
                                            aria-label="Minutes"
                                            onChange={(event) => patchTierLocal(tier.id, { duration: formatDuration(hours, event.target.value) })}
                                            onBlur={() => saveTier(tier.id, { duration: tier.duration }, `tier-${tier.id}-duration`)}
                                        />
                                        <span className="forfait-card__unit">min</span>
                                        {savedFx(`tier-${tier.id}-duration`)}
                                    </div>

                                    {/* « Complète » : dropdown personnalisé (niveau courant exclu). */}
                                    <div className="forfait-card__includes save-anchor">
                                        <span className="forfait-card__includes-label">Complète la formule</span>
                                        {savedFx(`tier-${tier.id}-includes`)}
                                        <div className="forfait-dd">
                                            <button
                                                type="button"
                                                className={`forfait-dd__trigger${includesMenuFor === tier.id ? " is-open" : ""}`}
                                                onClick={() => setIncludesMenuFor(includesMenuFor === tier.id ? null : tier.id)}
                                                aria-expanded={includesMenuFor === tier.id}
                                                title="Choisir la formule que celle-ci complète"
                                            >
                                                {/* Le déclencheur reprend l'icône + la couleur de la formule choisie. */}
                                                {(() => {
                                                    const sel = levels.find((l) => l.name === tier.includes);
                                                    if (!sel) {
                                                        return <span>Aucune</span>;
                                                    }
                                                    const SelIcon = ICON_MAP[sel.icon] || Sparkles;
                                                    return (
                                                        <span className="forfait-dd__value" style={{ color: sel.color || DEFAULT_COLOR }}>
                                                            <SelIcon />
                                                            {sel.name}
                                                        </span>
                                                    );
                                                })()}
                                                <ChevronDown className="forfait-dd__caret" />
                                            </button>
                                            {includesMenuFor === tier.id && (
                                                <div className="forfait-dd__menu" role="listbox">
                                                    <button
                                                        type="button"
                                                        className={`forfait-dd__option${!tier.includes ? " is-active" : ""}`}
                                                        onClick={() => {
                                                            patchTierLocal(tier.id, { includes: null });
                                                            saveTier(tier.id, { includes: null }, `tier-${tier.id}-includes`);
                                                            setIncludesMenuFor(null);
                                                        }}
                                                    >
                                                        <Check className="forfait-dd__check" style={{ visibility: !tier.includes ? "visible" : "hidden" }} />
                                                        Aucune
                                                    </button>
                                                    {levels
                                                        .filter((other) => other.id !== tier.level && other.name)
                                                        .map((other) => {
                                                            const OtherIcon = ICON_MAP[other.icon] || Sparkles;
                                                            return (
                                                                <button
                                                                    key={other.id}
                                                                    type="button"
                                                                    className={`forfait-dd__option${tier.includes === other.name ? " is-active" : ""}`}
                                                                    style={{ color: other.color || DEFAULT_COLOR }}
                                                                    onClick={() => {
                                                                        patchTierLocal(tier.id, { includes: other.name });
                                                                        saveTier(tier.id, { includes: other.name }, `tier-${tier.id}-includes`);
                                                                        setIncludesMenuFor(null);
                                                                    }}
                                                                >
                                                                    <Check className="forfait-dd__check" style={{ visibility: tier.includes === other.name ? "visible" : "hidden" }} />
                                                                    <OtherIcon />
                                                                    {other.name}
                                                                </button>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Prestations. */}
                                    <ul className="forfait-features save-anchor">
                                        {(tier.features || []).map((feature) => (
                                            <li
                                                className={`forfait-feature deletable${featuresDrag.draggingKey === feature.key ? " is-dnd-ghost" : ""}`}
                                                key={feature.key}
                                                data-dnd-scope="feat"
                                                data-dnd-key={feature.key}
                                            >
                                                {/* Poignée « façon Galerie » (clone flottant + fantôme). */}
                                                <span
                                                    className="drag-grip"
                                                    onPointerDown={(event) => featuresDrag.startDrag(event, feature.key)}
                                                    title="Glisser pour réordonner"
                                                    aria-label="Réordonner cette ligne"
                                                >
                                                    <GripVertical />
                                                </span>
                                                <Check className="forfait-feature__check" />
                                                <input
                                                    value={feature.text}
                                                    placeholder="Décrire la prestation…"
                                                    onChange={(event) => editFeatureLocal(tier, feature.key, event.target.value)}
                                                    onBlur={() => saveTier(tier.id, { features: featureTexts(tier) }, `tier-${tier.id}-features`)}
                                                />
                                                <button
                                                    type="button"
                                                    className="delete-badge delete-badge--sm"
                                                    onClick={() => removeFeature(tier, feature.key)}
                                                    aria-label="Supprimer cette ligne"
                                                    title="Supprimer cette prestation"
                                                >
                                                    <Trash2 />
                                                </button>
                                            </li>
                                        ))}
                                        {/* Feedback d'ajout/suppression de ligne (la ligne
                                            elle-même ayant disparu). */}
                                        {savedFx(`tier-${tier.id}-features`)}
                                    </ul>

                                    <button
                                        type="button"
                                        className="forfait-add-line"
                                        onClick={() => addFeature(tier)}
                                        title="Ajouter une prestation à ce forfait"
                                    >
                                        <Plus /> Ajouter une ligne
                                    </button>

                                    {/* Retrait du niveau de CETTE famille seulement (corbeille
                                        en bas à droite, débordante ; survol = bordure rouge). */}
                                    <button
                                        type="button"
                                        className="delete-badge delete-badge--corner"
                                        onClick={() => removeTierFromFamily(tier, level)}
                                        aria-label="Retirer ce niveau de cette famille"
                                        title={`Retirer « ${level.name || "ce niveau"} » de la famille « ${activeGroup.title} »`}
                                    >
                                        <Trash2 />
                                    </button>
                                </article>
                            );
                        })}

                        {/* Carte d'ajout : attribuer un niveau existant à cette famille. */}
                        <div className="forfait-add-tier-card">
                            {addPickerOpen && availableLevels.length > 0 ? (
                                <div className="forfait-add-tier-menu" role="listbox">
                                    <span className="forfait-add-tier-menu__title">Ajouter à « {activeGroup.title} »</span>
                                    {availableLevels.map((level) => {
                                        const IconComp = ICON_MAP[level.icon] || Sparkles;
                                        return (
                                            <button
                                                key={level.id}
                                                type="button"
                                                className="forfait-add-tier-menu__option"
                                                style={{ color: level.color || DEFAULT_COLOR }}
                                                onClick={() => addLevelToGroup(activeGroup, level.id)}
                                            >
                                                <IconComp />
                                                {level.name || "Sans nom"}
                                            </button>
                                        );
                                    })}
                                    <button type="button" className="forfait-add-tier-menu__cancel" onClick={() => setAddPickerOpen(false)}>
                                        Annuler
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="forfait-add-tier"
                                    onClick={() =>
                                        availableLevels.length > 0 ? setAddPickerOpen(true) : addLevel()
                                    }
                                    title={
                                        availableLevels.length > 0
                                            ? "Ajouter un niveau existant à cette famille"
                                            : "Créer un nouveau niveau (ajouté à cette famille)"
                                    }
                                >
                                    <Plus />
                                    {availableLevels.length > 0 ? "Ajouter un niveau" : "Créer un niveau"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Réductions combinées de la famille (un % par niveau). */}
                    <div className="forfait-discounts">
                        <p className="forfait-discounts__label">
                            💡 {activeGroup.bonus_label || "Réduction si un autre forfait est pris"}
                        </p>
                        <div className="forfait-discounts__fields">
                            {orderedTiers.map((tier) => {
                                const level = levelById[tier.level] || {};
                                const discounts = activeGroup.discounts || {};
                                const name = level.name || "";
                                return (
                                    <label className="forfait-discount save-anchor" key={tier.id} title={`Réduction sur le niveau ${name}`}>
                                        <span>{name}</span>
                                        <div className="forfait-discount__input">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={discounts[name] ?? ""}
                                                onChange={(event) =>
                                                    patchGroupLocal(activeGroup.id, {
                                                        discounts: {
                                                            ...discounts,
                                                            [name]: event.target.value === "" ? null : Number(event.target.value),
                                                        },
                                                    })
                                                }
                                                onBlur={() => saveDiscounts(activeGroup.id, activeGroup.discounts || {}, `discounts-${activeGroup.id}-${name}`)}
                                            />
                                            <span>%</span>
                                        </div>
                                        {savedFx(`discounts-${activeGroup.id}-${name}`)}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Confirmation (suppression d'un niveau). */}
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

            {/* Clone flottant du NIVEAU tiré (suit le curseur, soulevé). */}
            {levelsDrag.draggingKey && (() => {
                const level = levels.find((l) => String(l.id) === levelsDrag.draggingKey);
                if (!level) {
                    return null;
                }
                const IconComp = ICON_MAP[level.icon] || Sparkles;
                return (
                    <div
                        className="drag-clone"
                        style={levelsDrag.cloneStyle}
                        aria-hidden="true"
                    >
                        <div className="level-chip" style={{ "--tier-color": level.color || DEFAULT_COLOR }}>
                            <IconComp className="forfait-card__icon" />
                            <strong style={{ color: level.color || DEFAULT_COLOR }}>{level.name || "—"}</strong>
                        </div>
                    </div>
                );
            })()}

            {/* Clone flottant de la FAMILLE tirée. */}
            {familiesDrag.draggingKey && (() => {
                const group = groups.find((g) => String(g.id) === familiesDrag.draggingKey);
                if (!group) {
                    return null;
                }
                return (
                    <div
                        className="drag-clone"
                        style={familiesDrag.cloneStyle}
                        aria-hidden="true"
                    >
                        <div className="forfait-tab is-active">{group.title}</div>
                    </div>
                );
            })()}

            {/* Clone flottant de la LIGNE de prestation tirée. */}
            {featuresDrag.draggingKey && (() => {
                const feature = (activeGroup?.tiers || [])
                    .flatMap((t) => t.features || [])
                    .find((f) => f.key === featuresDrag.draggingKey);
                if (!feature) {
                    return null;
                }
                return (
                    <div
                        className="drag-clone"
                        style={featuresDrag.cloneStyle}
                        aria-hidden="true"
                    >
                        <div className="forfait-feature forfait-feature--clone">
                            <GripVertical className="drag-grip" />
                            <Check className="forfait-feature__check" />
                            <span>{feature.text || "…"}</span>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
