import { needs } from "../../utils/bookingHelpers.js";

/**
 * Bandeau d'onglets des trois besoins (lavage, achat/vente, pièces). Sélection en
 * mode RADIO côté parent (un seul actif). Bordures franches, sans radius.
 * @param {object} props Propriétés des onglets.
 * @param {object} props.besoins État coché de chaque besoin { [key]: boolean }.
 * @param {(key: string) => void} props.onToggle Bascule du besoin cliqué.
 * @returns {JSX.Element} Le bandeau d'onglets.
 */
export default function NeedTabs({ besoins, onToggle }) {
    return (
        <div className="need-tabs">
            {needs.map((need) => {
                const active = besoins[need.key];
                return (
                    <button
                        type="button"
                        key={need.key}
                        aria-pressed={active}
                        className={`need-tab${active ? " is-selected" : ""}`}
                        onClick={() => onToggle(need.key)}
                    >
                        {need.label}
                    </button>
                );
            })}
        </div>
    );
}
