import { Check } from "lucide-react";

/**
 * Écran de remerciement affiché après l'envoi d'une demande. Deux variantes selon
 * la présence d'un rendez-vous daté :
 *   - avec `appointment` (lavage) : on récapitule prestation, date et créneau ;
 *   - avec `lead` seul (achat/vente ou pièces) : simple message de rappel.
 * @param {object} props Propriétés de l'écran.
 * @param {object|null} props.appointment Rendez-vous créé (service/date/slot) ou null.
 * @param {object|null} props.lead Demande sans créneau créée (name) ou null.
 * @param {() => void} props.onReset Relance un nouveau parcours vierge.
 * @returns {JSX.Element} L'écran de succès adapté au type de demande.
 */
export default function SuccessState({ appointment, lead, onReset }) {
    // Le nom à remercier provient de l'objet renvoyé par le backend (l'un ou l'autre).
    const name = appointment?.name ?? lead?.name;

    return (
        <div className="success-state">
            <span>
                <Check />
            </span>
            <h2>demande envoyée</h2>
            {appointment ? (
                <p>
                    Merci {name} ! Je vous recontacte au plus vite pour confirmer.
                </p>
            ) : (
                <p>
                    Merci {name} ! J’étudie votre demande et je vous rappelle au plus vite.
                </p>
            )}

            {/* Récapitulatif daté : uniquement pour un rendez-vous lavage. */}
            {appointment && (
                <dl>
                    <div>
                        <dt>Prestation</dt>
                        <dd>{appointment.service}</dd>
                    </div>
                    <div>
                        <dt>Date</dt>
                        <dd>
                            {new Date(`${appointment.date}T12:00:00`).toLocaleDateString("fr-FR", {
                                dateStyle: "full",
                            })}
                        </dd>
                    </div>
                    <div>
                        <dt>Créneau</dt>
                        <dd>{appointment.slot}</dd>
                    </div>
                </dl>
            )}

            <button className="button button--secondary" type="button" onClick={onReset}>
                Nouvelle demande
            </button>
        </div>
    );
}
