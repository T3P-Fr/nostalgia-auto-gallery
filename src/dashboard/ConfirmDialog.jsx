import Modal from "./Modal.jsx";

/**
 * Boîte de confirmation réutilisable (remplace window.confirm), bâtie sur Modal.
 * @param {object} props Propriétés du composant.
 * @param {string} [props.title] Titre de la confirmation.
 * @param {string} props.message Message expliquant l'action à confirmer.
 * @param {string} [props.confirmLabel] Libellé du bouton de validation.
 * @param {string} [props.cancelLabel] Libellé du bouton d'annulation.
 * @param {boolean} [props.danger] Vrai pour une action destructive (bouton rouge).
 * @param {() => void} props.onConfirm Appelé si l'utilisateur confirme.
 * @param {() => void} props.onCancel Appelé si l'utilisateur annule/ferme.
 * @returns {JSX.Element} La boîte de confirmation.
 */
export default function ConfirmDialog({
    title = "Confirmer",
    message,
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    danger = false,
    onConfirm,
    onCancel,
}) {
    return (
        <Modal onClose={onCancel} className="modal--confirm">
            <div className="confirm">
                <h3>{title}</h3>
                <p>{message}</p>
                <div className="confirm__actions">
                    <button className="button button--ghost" onClick={onCancel} title="Annuler">{cancelLabel}</button>
                    <button
                        className={`button${danger ? " button--danger" : ""}`}
                        onClick={onConfirm}
                        title={confirmLabel}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
