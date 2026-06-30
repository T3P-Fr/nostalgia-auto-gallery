import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Modale générique réutilisable : fond assombri/flouté, fermeture au clic sur le
 * fond ou à la touche Échap. Le contenu est libre (formulaire, confirmation…).
 * @param {object} props Propriétés du composant.
 * @param {() => void} props.onClose Appelé pour fermer la modale.
 * @param {string} [props.className] Classe additionnelle sur la boîte (.modal).
 * @param {React.ReactNode} props.children Contenu de la modale.
 * @returns {JSX.Element} La modale.
 */
export default function Modal({ onClose, className = "", children }) {
    // Fermeture au clavier (Échap) : pratique et attendu pour une modale.
    useEffect(() => {
        function handleKey(event) {
            if (event.key === "Escape") {
                onClose();
            }
        }
        window.addEventListener("keydown", handleKey);
        // Nettoyage à la fermeture pour ne pas empiler les écouteurs.
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    return (
        // Clic sur le fond = fermeture ; on stoppe la propagation sur la boîte.
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className={`modal ${className}`.trim()}
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
            >
                {/* Croix de fermeture commune à toutes les modales (rouge, blanche au survol). */}
                <button type="button" className="modal__close" onClick={onClose} aria-label="Fermer" title="Fermer">
                    <X />
                </button>
                {children}
            </div>
        </div>
    );
}
