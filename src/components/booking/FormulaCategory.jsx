import { Eye } from "lucide-react";
import { useState } from "react";
import { formulaLevels, tierBadges } from "../../data.js";
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
    const hasFeatures = features.length > 0;
    // Accordéon « Détail » : les prestations sont repliées par défaut (on les dévoile
    // au clic, façon résumé), pour garder la grille de prix compacte.
    const [detailOpen, setDetailOpen] = useState(false);

    return (
        <div className="formula-cat">
            {/* Ligne de tête : label de catégorie à gauche (masqué pour la méca, dont
                le titre est porté par le panneau parent) et le toggle « Détail » + œil
                regroupés en bout de ligne, à droite. */}
            <div className="formula-cat__top">
                {!isMeca && <span className="formula-cat__label">{category.label}</span>}
                {hasFeatures && (
                    <button
                        type="button"
                        className="formula-detail__head"
                        aria-expanded={detailOpen}
                        onClick={() => setDetailOpen((open) => !open)}
                    >
                        <span className="formula-detail__title">Détail</span>
                        <Eye className="formula-detail__eye" />
                    </button>
                )}
            </div>
            <div className="formula-grid__line">
                {formulaLevels.map((level) => {
                    const selected = formula[category.key] === level;
                    // Méca : indisponible sans lavage ; et sous le niveau du lavage le
                    // plus bas (lavage complet) seuls les niveaux supérieurs restent
                    // sélectionnables (contrainte conservée).
                    const disabled =
                        isMeca &&
                        (!hasWash ||
                            (mecaOfferedLevel &&
                                formulaLevels.indexOf(level) <
                                    formulaLevels.indexOf(mecaOfferedLevel)));
                    // Offre méca (lavage complet) : la méca du NIVEAU du lavage est
                    // offerte ; au-dessus, on ne paie que la DIFFÉRENCE par rapport à
                    // ce niveau. (Les niveaux inférieurs sont déjà non cliquables.)
                    const offeredPrice =
                        isMeca && isCompleteWash && mecaOfferedLevel && !disabled
                            ? category.prices[mecaOfferedLevel]
                            : 0;
                    const hasOffer = offeredPrice > 0;
                    const netPrice = Math.max(0, category.prices[level] - offeredPrice);
                    const fullyOffered = hasOffer && netPrice === 0;
                    return (
                        <button
                            type="button"
                            key={level}
                            disabled={disabled}
                            aria-pressed={selected}
                            className={`formula-price ${level.toLowerCase()}${selected ? " is-selected" : ""}${hasOffer ? " is-discounted" : ""}`}
                            onClick={() => onToggle(category.key, level)}
                        >
                            {/* Pastille : montant offert déduit (le détail de la gratuité).
                                « Gratuit » + le montant au niveau du lavage ; au-dessus, le
                                même montant déduit, la différence restant due. */}
                            {hasOffer && (
                                <span className="formula-price__deal">
                                    {fullyOffered ? `Gratuit · −${offeredPrice} €` : `−${offeredPrice} €`}
                                </span>
                            )}
                            <TierBadges tier={level} small />
                            <span className="formula-price__level">{level}</span>
                            <span className="formula-price__amount">
                                {hasOffer ? (
                                    fullyOffered ? (
                                        <s>{category.prices[level]} €</s>
                                    ) : (
                                        <>
                                            <s>{category.prices[level]} €</s> {netPrice} €
                                        </>
                                    )
                                ) : (
                                    `${category.prices[level]} €`
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Corps animé de l'accordéon « Détail » : prestations incluses repliées,
                dépliées en douceur (grille 0fr → 1fr) par le toggle de la ligne de tête. */}
            {features.length > 0 && (
                <div className={`formula-detail__body${detailOpen ? " is-open" : ""}`}>
                    <div className="formula-pills">
                        {features.map((feature) => (
                            <span
                                className={`pill ${feature.level.toLowerCase()}`}
                                key={feature.key}
                            >
                                {/* Préfixe : 1 icône du niveau (étoile/diamant/couronne)
                                    pour identifier d'un coup d'œil le palier d'apparition. */}
                                {tierBadges[feature.level] && (
                                    <img
                                        className="pill__icon"
                                        src={tierBadges[feature.level].icon}
                                        alt=""
                                        loading="lazy"
                                    />
                                )}
                                {feature.label}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
