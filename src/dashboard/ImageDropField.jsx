import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { assetUrl, uploadFile } from "./directusClient.js";

/**
 * Zone de dépôt/sélection d'UNE image, réutilisée pour « avant », « après » et la
 * galerie. À la sélection d'un fichier (clic ou glisser-déposer), l'image est
 * téléversée vers Directus, et l'identifiant du fichier obtenu est remonté au
 * parent via onChange. L'aperçu s'affiche ensuite depuis Directus.
 * @param {object} props Propriétés du composant.
 * @param {string} props.label Libellé affiché au-dessus de la zone (ex. "Avant").
 * @param {string|null} props.fileId Identifiant Directus de l'image actuelle (ou null).
 * @param {(fileId: string|null) => void} props.onChange Notifie le nouvel identifiant (null si retirée).
 * @returns {JSX.Element} Le champ image.
 */
export default function ImageDropField({ label, fileId, onChange }) {
    // Référence vers l'input fichier caché, déclenché au clic sur la zone.
    const inputRef = useRef(null);
    // Indique qu'un upload est en cours (affiche un indicateur de chargement).
    const [uploading, setUploading] = useState(false);
    // Surbrillance pendant un survol de glisser-déposer.
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState("");

    /**
     * Téléverse le fichier choisi puis remonte l'identifiant Directus au parent.
     * @param {File} file Fichier image sélectionné.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function handleFile(file) {
        // On ignore tout fichier qui n'est pas une image (sécurité côté interface).
        if (!file || !file.type.startsWith("image/")) {
            setError("Veuillez choisir une image.");
            return;
        }
        setError("");
        setUploading(true);
        try {
            const uploaded = await uploadFile(file);
            onChange(uploaded.id);
        } catch (uploadError) {
            setError(uploadError.message || "Échec de l’envoi de l’image.");
        } finally {
            setUploading(false);
        }
    }

    /**
     * Gère le dépôt d'un fichier par glisser-déposer.
     * @param {React.DragEvent} event Événement de drop.
     * @returns {void} Aucune valeur de retour.
     */
    function handleDrop(event) {
        // On empêche le navigateur d'ouvrir l'image dans un nouvel onglet.
        event.preventDefault();
        setDragActive(false);
        const file = event.dataTransfer.files?.[0];
        handleFile(file);
    }

    return (
        <div className="image-drop">
            <span className="image-drop__label">{label}</span>

            {/* Zone cliquable + cible de glisser-déposer. */}
            <div
                className={`image-drop__zone${dragActive ? " is-drag" : ""}${fileId ? " has-image" : ""}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                    // Indispensable pour autoriser le drop sur la zone.
                    event.preventDefault();
                    setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
            >
                {uploading ? (
                    // Indicateur pendant l'envoi.
                    <span className="image-drop__hint"><Loader2 className="spin" /> Envoi…</span>
                ) : fileId ? (
                    // Aperçu de l'image déjà téléversée (miniature redimensionnée par Directus).
                    <img src={assetUrl(fileId, { width: 480, height: 360, fit: "cover" })} alt={label} />
                ) : (
                    // État vide : invitation à déposer ou cliquer.
                    <span className="image-drop__hint"><ImagePlus /> Glissez une photo ou cliquez</span>
                )}
            </div>

            {/* Bouton pour retirer l'image courante (réinitialise le champ). */}
            {fileId && !uploading && (
                <button
                    type="button"
                    className="image-drop__remove"
                    onClick={() => onChange(null)}
                >
                    <X /> Retirer
                </button>
            )}

            {/* Input fichier caché, piloté par le clic sur la zone. */}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => handleFile(event.target.files?.[0])}
            />

            {error && <p className="form-error">{error}</p>}
        </div>
    );
}
