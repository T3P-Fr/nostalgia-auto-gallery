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
    // Accordéon « Détail » : les prestations sont repliées par défaut (on les dévoile
    // au clic, façon résumé), pour garder la grille de prix compacte.
    const [detailOpen, setDetailOpen] = useState(false);

    return (
        <div className="formula-cat">
            {/* Le label de catégorie est masqué pour la méca : son intitulé
                « Révision de base » est déjà porté par le titre du panneau parent
                (on évite ainsi un titre affiché en double). */}
            {!isMeca && <span className="formula-cat__label">{category.label}</span>}
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
                    // Remise méca : en lavage complet, chaque palier sélectionnable est
                    // remisé de son propre taux (−50/−60/−70 %). Le prix n'est plus offert.
                    const discountRate =
                        isMeca && isCompleteWash && !disabled
                            ? category.tierDiscounts[level] || 0
                            : 0;
                    const netPrice = Math.round(category.prices[level] * (1 - discountRate));
                    return (
                        <button
                            type="button"
                            key={level}
                            disabled={disabled}
                            aria-pressed={selected}
                            className={`formula-price ${level.toLowerCase()}${selected ? " is-selected" : ""}${discountRate > 0 ? " is-discounted" : ""}`}
                            onClick={() => onToggle(category.key, level)}
                        >
                            {/* Pastille de remise (méca en lavage complet). */}
                            {discountRate > 0 && (
                                <span className="formula-price__deal">
                                    −{Math.round(discountRate * 100)}%
                                </span>
                            )}
                            {/* Icônes + qualité puis prix. En cas de remise, le prix plein
                                est barré et le prix net affiché à côté. */}
                            <TierBadges tier={level} small />
                            <span className="formula-price__level">{level}</span>
                            <span className="formula-price__amount">
                                {discountRate > 0 ? (
                                    <>
                                        <s>{category.prices[level]} €</s> {netPrice} €
                                    </>
                                ) : (
                                    `${category.prices[level]} €`
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Prestations incluses repliées dans un accordéon « Détail » (un œil en
                bout de ligne), présenté comme le détail de la carte résumé. */}
            {features.length > 0 && (
                <div className="formula-detail">
                    <button
                        type="button"
                        className="formula-detail__head"
                        aria-expanded={detailOpen}
                        onClick={() => setDetailOpen((open) => !open)}
                    >
                        <span className="formula-detail__title">Détail</span>
                        <Eye className="formula-detail__eye" />
                    </button>
                    {/* Corps animé : grille 0fr → 1fr pour un dépliage en douceur. */}
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
                </div>
            )}
        </div>
    );
}
