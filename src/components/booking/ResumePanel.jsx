import { ChevronDown } from "lucide-react";
import { useState } from "react";

/**
 * Carte « résumé » (rouge), présentée comme une FACTURE : date + créneau, puis le
 * détail des prestations REGROUPÉ par thématique (Lavages, Révision, Options) sous
 * forme d'accordéon, et enfin le total à payer. Rendue à DEUX emplacements (desktop
 * sous le créneau, mobile en bas), un seul visible à la fois via CSS.
 * @param {object} props Propriétés du résumé.
 * @param {boolean} props.hasFormula Vrai si au moins une formule est choisie.
 * @param {string} props.selectedDate Date sélectionnée au format ISO (ou "").
 * @param {string} props.slotRange Plage horaire lisible « début — fin » (ou "—").
 * @param {object} props.pricing Détail tarifaire (cf. computePricing).
 * @param {Array<{key: string, title: string, total: number, items: Array<object>}>} props.groups
 *   Groupes « facture » par thématique, chacun avec ses lignes et son sous-total.
 * @returns {JSX.Element} La carte résumé.
 */
export default function ResumePanel({ hasFormula, selectedDate, slotRange, pricing, groups }) {
    // Groupes repliés (accordéon). Tout est ouvert par défaut : on ne mémorise que les
    // clés explicitement refermées par l'utilisateur.
    const [collapsed, setCollapsed] = useState({});

    /**
     * Ouvre/replie un groupe de la facture.
     * @param {string} key Clé du groupe basculé.
     * @returns {void} Aucune valeur de retour.
     */
    function toggleGroup(key) {
        setCollapsed((current) => ({ ...current, [key]: !current[key] }));
    }

    return (
        <div className="panel-resume">
            {/* En-tête : titre à gauche, date · créneau à droite (sur la même ligne). */}
            <div className="panel-resume__header">
                <h3 className="panel-resume__title">
                    Résumé<span className="panel-resume__dot">.</span>
                </h3>
                {selectedDate && (
                    <span className="panel-resume__when">
                        <span>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("fr-FR")}</span>
                        <span>{slotRange}</span>
                    </span>
                )}
            </div>
            {!hasFormula && !selectedDate ? (
                // Mode attente : aucune date ni formule encore choisie.
                <p className="panel-resume__wait">En attente de votre sélection…</p>
            ) : (
                <>
                    {/* Corps de la facture : un accordéon par thématique. */}
                    {hasFormula &&
                        groups.map((group) => {
                            const isOpen = !collapsed[group.key];
                            return (
                                <section className="resume-group" key={group.key}>
                                    <button
                                        type="button"
                                        className="resume-group__head"
                                        aria-expanded={isOpen}
                                        onClick={() => toggleGroup(group.key)}
                                    >
                                        <ChevronDown
                                            className={`resume-group__chevron${isOpen ? " is-open" : ""}`}
                                        />
                                        <span className="resume-group__title">{group.title}</span>
                                        <span className="resume-group__total">{group.total} €</span>
                                    </button>
                                    {isOpen && (
                                        <ul className="formula-recap__lines">
                                            {group.items.map((item) => (
                                                <li
                                                    key={item.key}
                                                    className={[
                                                        item.discount ? "is-discount" : "",
                                                        item.offered ? "is-offered" : "",
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" ")}
                                                >
                                                    <span>{item.label}</span>
                                                    <span>{item.value}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            );
                        })}

                    {hasFormula && (
                        <div className="formula-total">
                            {pricing.economy > 0 && (
                                <s className="formula-total__strike">{pricing.base} €</s>
                            )}
                            <span className="formula-total__label">À payer</span>
                            <strong className="formula-total__sale">{pricing.sale} €</strong>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
