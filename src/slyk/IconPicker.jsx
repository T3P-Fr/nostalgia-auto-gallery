import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import "./IconPicker.css";

/**
 * @typedef {object} SlykIconOption
 * @property {string} key                 Clé stable de l'icône (valeur stockée).
 * @property {React.ComponentType} icon   Composant icône à rendre (ex. lucide).
 */

/**
 * Sélecteur d'icône Slyk : un déclencheur montrant l'icône courante (dans une
 * couleur optionnelle) + un menu flottant en GRILLE de pastilles. Comportements
 * communs à Slyk : fermeture au clic extérieur et à Échap, chevron animé,
 * l'icône déjà active n'est pas re-cliquée inutilement. Agnostique du jeu
 * d'icônes (on lui passe les composants).
 *
 * Thème via variables CSS du contexte (`--acc`, `--line`, `--bg`, `--surface`,
 * `--radius-button`) avec des valeurs de repli.
 *
 * @param {object} props Propriétés.
 * @param {SlykIconOption[]} props.options       Palette d'icônes proposées.
 * @param {string} props.value                   Clé de l'icône sélectionnée.
 * @param {(key: string) => void} props.onChange Appelé avec la clé choisie.
 * @param {string} [props.color]                 Couleur de l'icône du déclencheur.
 * @param {string} [props.ariaLabel="Choisir une icône"] Libellé accessible.
 * @returns {JSX.Element} Le sélecteur d'icône.
 * @example
 * <IconPicker
 *   value="star"
 *   color="#e11d48"
 *   onChange={setIcon}
 *   options={[{ key: "star", icon: Star }, { key: "crown", icon: Crown }]}
 * />
 */
export default function IconPicker({ options, value, onChange, color, ariaLabel = "Choisir une icône" }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    // Fermeture au clic extérieur + Échap.
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

    const current = options.find((option) => option.key === value) || options[0];
    const CurrentIcon = current?.icon;

    return (
        <div className="slyk-iconpicker" ref={rootRef}>
            <button
                type="button"
                className={`slyk-iconpicker__trigger${open ? " is-open" : ""}`}
                onClick={() => setOpen((current) => !current)}
                aria-label={ariaLabel}
                aria-expanded={open}
            >
                {CurrentIcon ? <CurrentIcon className="slyk-iconpicker__current" style={color ? { color } : undefined} /> : null}
                <ChevronDown className="slyk-iconpicker__caret" />
            </button>

            {open && (
                <div className="slyk-iconpicker__menu" role="listbox">
                    {options.map(({ key, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            role="option"
                            aria-selected={key === value}
                            className={`slyk-iconpicker__choice${key === value ? " is-active" : ""}`}
                            onClick={() => {
                                if (key !== value) {
                                    onChange(key);
                                }
                                setOpen(false);
                            }}
                            aria-label={key}
                            title={key}
                        >
                            <Icon />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
