import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import "./Dropdown.css";

/**
 * @typedef {object} SlykDropdownOption
 * @property {string|number|null} value   Valeur renvoyée à la sélection.
 * @property {string} label               Texte affiché.
 * @property {React.ComponentType} [icon] Icône (composant, ex. lucide) devant le texte.
 * @property {string} [color]             Couleur du texte + icône (ex. couleur d'un niveau).
 */

/**
 * Menu déroulant Slyk — les conventions « human-friendly » sont intégrées, on ne
 * les réécrit jamais :
 *  - l'option SÉLECTIONNÉE porte une coche verte (pas de fond plein) et est INERTE
 *    (aucune re-sélection), tout en gardant le curseur main ;
 *  - au SURVOL, l'option est ENTOURÉE (contour), pas remplie ;
 *  - le menu est COLLÉ au champ (ils ne font qu'un), ombre portée vers le bas,
 *    légère animation d'ouverture ; le chevron pivote (gauche fermé → bas ouvert) ;
 *  - fermeture au clic extérieur et à la touche Échap.
 *
 * Thème via variables CSS du contexte : `--acc`, `--line`, `--bg`, `--surface`,
 * `--radius-button` (des valeurs de repli sont fournies).
 *
 * @param {object} props Propriétés.
 * @param {SlykDropdownOption[]} props.options   Les options proposées.
 * @param {string|number|null} props.value       Valeur courante (sélectionnée).
 * @param {(value: any) => void} props.onChange  Appelé avec la valeur choisie.
 * @param {string} [props.placeholder="—"]       Affiché quand rien n'est sélectionné.
 * @param {string} [props.ariaLabel]             Libellé accessible du champ.
 * @returns {JSX.Element} Le menu déroulant.
 * @example
 * <Dropdown
 *   value={color}
 *   onChange={setColor}
 *   ariaLabel="Choisir une couleur"
 *   options={[
 *     { value: null, label: "Aucune" },
 *     { value: "r", label: "Rouge", color: "#e11d48" },
 *     { value: "b", label: "Bleu", color: "#3b82f6" },
 *   ]}
 * />
 */
export default function Dropdown({ options, value, onChange, placeholder = "—", ariaLabel }) {
    // Ouverture du menu.
    const [open, setOpen] = useState(false);
    // Racine du composant : sert à détecter les clics extérieurs.
    const rootRef = useRef(null);

    // Fermeture au clic en dehors + à la touche Échap (attendu pour un menu).
    useEffect(() => {
        if (!open) {
            return undefined;
        }
        function handlePointer(event) {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        }
        function handleKey(event) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }
        document.addEventListener("pointerdown", handlePointer);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("pointerdown", handlePointer);
            document.removeEventListener("keydown", handleKey);
        };
    }, [open]);

    // Option correspondant à la valeur courante (pour l'affichage du champ).
    const selected = options.find((option) => option.value === value) || null;
    const SelectedIcon = selected?.icon;

    return (
        <div className="slyk-dd" ref={rootRef}>
            <button
                type="button"
                className={`slyk-dd__trigger${open ? " is-open" : ""}`}
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                aria-label={ariaLabel}
            >
                {selected ? (
                    <span className="slyk-dd__value" style={selected.color ? { color: selected.color } : undefined}>
                        {SelectedIcon ? <SelectedIcon /> : null}
                        {selected.label}
                    </span>
                ) : (
                    <span className="slyk-dd__value slyk-dd__value--empty">{placeholder}</span>
                )}
                <ChevronDown className="slyk-dd__caret" />
            </button>

            {open && (
                <div className="slyk-dd__menu" role="listbox">
                    {options.map((option) => {
                        const isActive = option.value === value;
                        const Icon = option.icon;
                        return (
                            <button
                                key={String(option.value)}
                                type="button"
                                role="option"
                                aria-selected={isActive}
                                className={`slyk-dd__option${isActive ? " is-active" : ""}`}
                                style={option.color ? { color: option.color } : undefined}
                                onClick={() => {
                                    // On ne re-sélectionne pas l'option déjà active (inerte),
                                    // mais on garde la main : on se contente de refermer.
                                    if (!isActive) {
                                        onChange(option.value);
                                    }
                                    setOpen(false);
                                }}
                            >
                                <Check className="slyk-dd__check" style={{ visibility: isActive ? "visible" : "hidden" }} />
                                {Icon ? <Icon /> : null}
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
