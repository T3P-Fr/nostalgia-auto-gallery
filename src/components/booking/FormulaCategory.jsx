import { formulaLevels } from "../../data.js";
import { collectFeatures } from "../../utils/bookingHelpers.js";
import { TierBadges } from "../TierBadges.jsx";

/**
 * Rend une catégorie de la grille : titre, 3 prix cliquables et ses prestations
 * incluses (pills) juste en dessous. La méca est sélectionnable librement dès qu'un
 * lavage est pris ; elle est offerte (gratuite) lorsque le lavage est complet.
 * @param {object} props Propriétés de la catégorie.
 * @param {object} props.category Catégorie issue de formulaCategories.
 * @param {object} props.formula État de sélection { interieur, exterieur, meca }.
 * @param {boolean} props.hasWash Vrai si au moins un lavage (intérieur OU extérieur) est pris.
 * @param {boolean} props.isCompleteWash Vrai si un intérieur ET un extérieur sont pris.
 * @param {string|null} props.mecaOfferedLevel Niveau de méca offert (lavage complet) ou null.
 * @param {(categoryKey: string, level: string) => void} props.onToggle Sélection d'un niveau.
 * @returns {JSX.Element} Le bloc de la catégorie.
 */
export default function FormulaCategory({
    category,
    formula,
    hasWash,
    isCompleteWash,
    mecaOfferedLevel,
    onToggle,
}) {
    const isMeca = category.key === "meca";
    // Prestations incluses propres à CETTE catégorie, sous ses boutons.
    const features = collectFeatures([category], formula);

    return (
        <div className="formula-cat">
            {/* Le label de catégorie est masqué pour la méca : son intitulé
                « Révision de base » est déjà porté par le titre du panneau parent
                (on évite ainsi un titre affiché en double). */}
            {!isMeca && <span className="formula-cat__label">{category.label}</span>}
            <div className="formula-grid__line">
                {formulaLevels.map((level) => {
                    const selected = formula[category.key] === level;
                    // Le flag « Offert » se place toujours sur la méca la moins chère
                    // disponible (le niveau offert), quelle que soit la sélection.
                    const offered = isMeca && isCompleteWash && level === mecaOfferedLevel;
                    // Méca : indisponible sans lavage ; et sous le niveau offert
                    // (lavage complet) seuls les niveaux supérieurs sont sélectionnables.
                    const disabled =
                        isMeca &&
                        (!hasWash ||
                            (mecaOfferedLevel &&
                                formulaLevels.indexOf(level) <
                                    formulaLevels.indexOf(mecaOfferedLevel)));
                    return (
                        <button
                            type="button"
                            key={level}
                            disabled={disabled}
                            aria-pressed={selected}
                            className={`formula-price ${level.toLowerCase()}${selected ? " is-selected" : ""}${offered ? " is-offered" : ""}`}
                            onClick={() => onToggle(category.key, level)}
                        >
                            {/* Icônes + qualité puis prix. Le prix reste affiché même
                                quand le palier est OFFERT (barré via .is-offered) afin que
                                le bouton garde la même taille que les autres. */}
                            <TierBadges tier={level} small />
                            <span className="formula-price__level">{level}</span>
                            <span className="formula-price__amount">{category.prices[level]} €</span>
                        </button>
                    );
                })}
            </div>

            {/* Prestations incluses de la catégorie, en pleine largeur sous ses prix. */}
            {features.length > 0 && (
                <div className="formula-pills">
                    {features.map((feature) => (
                        <span
                            className={`pill ${feature.level.toLowerCase()}`}
                            key={feature.key}
                        >
                            {feature.label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
