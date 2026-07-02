import "./SaveFeedback.css";

/**
 * Feedback d'enregistrement réussi : bordure verte (flash) + toast « Enregistré »
 * qui monte en fondu. Animation 1.4s puis disparition. À placer sur l'élément
 * modifié (champ, carte, etc.) qui a `.save-anchor` en position:relative.
 * @param {object} props Propriétés du composant.
 * @param {boolean} props.show Affiche le feedback si vrai.
 * @param {string} [props.message] Message du toast (défaut : « Enregistré »).
 * @returns {JSX.Element|null} Le feedback, ou null si caché.
 */
export default function SaveFeedback({ show, message = "Enregistré" }) {
    if (!show) {
        return null;
    }
    return (
        <span className="save-feedback">
            <span className="save-flash" />
            <span className="save-toast">{message}</span>
        </span>
    );
}
