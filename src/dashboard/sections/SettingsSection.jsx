import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, ImagePlus, Loader2, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { apiFetch, assetUrl, uploadFile } from "../directusClient.js";
import Modal from "../Modal.jsx";
import ConfirmDialog from "../ConfirmDialog.jsx";

// Réglages SERVEUR partagés (singleton mail_config) : serveur + port seulement.
// L'identifiant et le mot de passe sont propres à CHAQUE compte (voir mail_accounts).
const TECH_FIELDS = [
    { key: "smtp_host", label: "Serveur SMTP", type: "text", placeholder: "mail.mondomaine.fr" },
    { key: "smtp_port", label: "Port", type: "number", placeholder: "465" },
];

/**
 * Petite pastille d'avatar cliquable : téléverse une image et remonte son id.
 * (Composant séparé sans champ texte : pas de souci de focus.)
 * @param {object} props fileId courant + callback onChange(fileId).
 * @returns {JSX.Element} La pastille.
 */
function AccountAvatar({ fileId, onChange }) {
    const inputRef = useRef(null);
    const [busy, setBusy] = useState(false);

    async function handle(file) {
        if (!file || !file.type.startsWith("image/")) {
            return;
        }
        setBusy(true);
        try {
            const uploaded = await uploadFile(file);
            onChange(uploaded.id);
        } finally {
            setBusy(false);
        }
    }

    return (
        <button
            type="button"
            className="mail-account__avatar"
            onClick={() => inputRef.current?.click()}
            title="Ajouter / changer la photo"
            aria-label="Photo du contact"
        >
            {busy ? (
                <Loader2 className="spin" />
            ) : fileId ? (
                <img src={assetUrl(fileId, { width: 96, height: 96, fit: "cover" })} alt="" />
            ) : (
                <ImagePlus />
            )}
            <input ref={inputRef} type="file" accept="image/*" hidden onChange={(event) => handle(event.target.files?.[0])} />
        </button>
    );
}

/**
 * Section « Paramètres · Mail ». Vue principale = cartes courtes des comptes
 * (avatar + nom personnalisable ; futures fiches contact). Les réglages
 * techniques SMTP sont dans un MODAL « Paramètres avancés » (bouton en haut à
 * droite du titre). L'attribution d'un rôle à chaque compte viendra plus tard.
 * @returns {JSX.Element} La section.
 */
export default function SettingsSection() {
    const [accounts, setAccounts] = useState([]);
    const [config, setConfig] = useState({});
    const [techOpen, setTechOpen] = useState(false);
    // Compte dont le mot de passe est affiché en clair (œil), ou null.
    const [showId, setShowId] = useState(null);
    const [confirmState, setConfirmState] = useState(null);
    const [saved, setSaved] = useState({ key: null, nonce: 0 });
    const [feedback, setFeedback] = useState("");

    /** Recharge les comptes + la config SMTP. */
    const load = useCallback(async () => {
        try {
            const [acc, cfg] = await Promise.all([
                apiFetch("/items/mail_accounts?fields=id,name,email,avatar,sort&sort=sort&limit=-1"),
                apiFetch("/items/mail_config"),
            ]);
            setAccounts(acc || []);
            setConfig(cfg || {});
        } catch (error) {
            setFeedback(error.message || "Impossible de charger les paramètres.");
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!saved.key) {
            return undefined;
        }
        const timer = setTimeout(() => setSaved((current) => ({ key: null, nonce: current.nonce })), 1500);
        return () => clearTimeout(timer);
    }, [saved.key, saved.nonce]);

    /** Feedback vert (bordure + toast) sur l'élément fraîchement enregistré. */
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

    function markSaved(key) {
        setSaved((current) => ({ key, nonce: current.nonce + 1 }));
    }

    /* ------------------------------- Comptes ---------------------------------- */

    function patchAccountLocal(id, patch) {
        setAccounts((current) => current.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    }

    async function saveAccount(id, patch, feedbackKey) {
        try {
            await apiFetch(`/items/mail_accounts/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
            markSaved(feedbackKey);
        } catch (error) {
            setFeedback(error.message || "Enregistrement impossible.");
            await load();
        }
    }

    async function addAccount() {
        try {
            await apiFetch("/items/mail_accounts", {
                method: "POST",
                body: JSON.stringify({ name: "Nouveau contact", email: "", sort: accounts.length }),
            });
            await load();
        } catch (error) {
            setFeedback(error.message || "Ajout impossible.");
        }
    }

    function removeAccount(account) {
        setConfirmState({
            title: "Supprimer ce contact",
            message: `Supprimer « ${account.name || "ce contact"} » ? Action irréversible.`,
            confirmLabel: "Supprimer",
            danger: true,
            onConfirm: async () => {
                try {
                    await apiFetch(`/items/mail_accounts/${account.id}`, { method: "DELETE" });
                    await load();
                } catch (error) {
                    setFeedback(error.message || "Suppression impossible.");
                }
            },
        });
    }

    /* ------------------------------ SMTP (modal) ------------------------------- */

    async function saveConfig(key) {
        try {
            const value = key === "smtp_port" ? Number(config[key]) || null : config[key] ?? null;
            await apiFetch("/items/mail_config", { method: "PATCH", body: JSON.stringify({ [key]: value }) });
            markSaved(`cfg-${key}`);
        } catch (error) {
            setFeedback(error.message || "Enregistrement impossible.");
            await load();
        }
    }

    return (
        <div className="dashboard-section">
            {/* Titre + bouton « Paramètres avancés » au bout de la ligne, à droite. */}
            <div className="dashboard-section__head">
                <div>
                    <h2>Paramètres · Mail</h2>
                    <p className="dashboard-section__subtitle">Vos comptes email.</p>
                </div>
                <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => setTechOpen(true)}
                    title="Réglages techniques (serveur, port, mot de passe)"
                >
                    <SlidersHorizontal /> Paramètres avancés
                </button>
            </div>

            {feedback && <p className="dashboard-feedback">{feedback}</p>}

            {/* Cartes courtes : avatar + nom (+ email discret). */}
            <div className="mail-cards">
                {accounts.map((account) => (
                    <div className="mail-card deletable" key={account.id}>
                        <AccountAvatar
                            fileId={account.avatar}
                            onChange={(fileId) => {
                                patchAccountLocal(account.id, { avatar: fileId });
                                saveAccount(account.id, { avatar: fileId }, `acct-${account.id}-avatar`);
                            }}
                        />
                        <div className="mail-card__body save-anchor">
                            <input
                                className="mail-card__name"
                                value={account.name ?? ""}
                                placeholder="Nom"
                                aria-label="Nom du contact"
                                onChange={(event) => patchAccountLocal(account.id, { name: event.target.value })}
                                onBlur={() => saveAccount(account.id, { name: account.name }, `acct-${account.id}-name`)}
                            />
                            <input
                                className="mail-card__email"
                                value={account.email ?? ""}
                                placeholder="adresse@domaine.fr"
                                aria-label="Adresse email"
                                onChange={(event) => patchAccountLocal(account.id, { email: event.target.value })}
                                onBlur={() => saveAccount(account.id, { email: account.email }, `acct-${account.id}-email`)}
                            />
                            {/* Mot de passe de la boîte, dans la carte, lisible/masquable. */}
                            <div className="password-field mail-card__pass">
                                <input
                                    type={showId === account.id ? "text" : "password"}
                                    value={account.password ?? ""}
                                    placeholder="mot de passe"
                                    aria-label="Mot de passe de la boîte"
                                    autoComplete="new-password"
                                    onChange={(event) => patchAccountLocal(account.id, { password: event.target.value })}
                                    onBlur={() => saveAccount(account.id, { password: account.password }, `acct-${account.id}-pass`)}
                                />
                                <button
                                    type="button"
                                    className="password-field__toggle"
                                    onClick={() => setShowId((id) => (id === account.id ? null : account.id))}
                                    title={showId === account.id ? "Masquer" : "Afficher"}
                                    aria-label={showId === account.id ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                >
                                    {showId === account.id ? <EyeOff /> : <Eye />}
                                </button>
                            </div>
                            {savedFx(`acct-${account.id}-name`)}
                            {savedFx(`acct-${account.id}-email`)}
                            {savedFx(`acct-${account.id}-avatar`)}
                            {savedFx(`acct-${account.id}-pass`)}
                        </div>
                        <button
                            type="button"
                            className="delete-badge delete-badge--corner"
                            onClick={() => removeAccount(account)}
                            aria-label="Supprimer ce contact"
                            title="Supprimer ce contact"
                        >
                            <Trash2 />
                        </button>
                    </div>
                ))}

                {/* Ajouter un compte. */}
                <button type="button" className="mail-card mail-card--add" onClick={addAccount} title="Ajouter un compte">
                    <Plus />
                    Ajouter un compte
                </button>
            </div>

            {/* Modal des réglages techniques SMTP. */}
            {techOpen && (
                <Modal onClose={() => setTechOpen(false)} className="modal--settings">
                    <h3>Paramètres avancés (SMTP)</h3>
                    <p className="settings-card__intro">
                        Fournis par votre hébergeur. À ne modifier qu’en connaissance de cause.
                    </p>
                    <div className="settings-grid">
                        {TECH_FIELDS.map((field) => (
                            <label className="dashboard-field save-anchor" key={field.key} title={field.label}>
                                <span>{field.label}</span>
                                <input
                                    type={field.type}
                                    value={config[field.key] ?? ""}
                                    placeholder={field.placeholder}
                                    autoComplete="off"
                                    onChange={(event) => setConfig((c) => ({ ...c, [field.key]: event.target.value }))}
                                    onBlur={() => saveConfig(field.key)}
                                />
                                {savedFx(`cfg-${field.key}`)}
                            </label>
                        ))}
                    </div>
                </Modal>
            )}

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
