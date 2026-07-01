import { AlertTriangle, X } from "lucide-react";

/**
 * Toast d'erreur rouge, PERSISTANT : il reste affiché tant que l'utilisateur ne
 * clique pas sur la petite croix (aucune fermeture automatique). Réutilisable
 * dans toutes les sections du Dashboard pour signaler un échec.
 * @param {object} props Propriétés.
 * @param {string} props.message Message d'erreur (rien n'est rendu si vide).
 * @param {() => void} props.onClose Ferme le toast (croix).
 * @returns {JSX.Element|null} Le toast, ou null s'il n'y a pas de message.
 */
export default function ErrorToast({ message, onClose }) {
    if (!message) {
        return null;
    }
    return (
        <div className="error-toast" role="alert">
            <AlertTriangle className="error-toast__icon" />
            <span className="error-toast__msg">{message}</span>
            <button type="button" className="error-toast__close" onClick={onClose} aria-label="Fermer" title="Fermer">
                <X />
            </button>
        </div>
    );
}
