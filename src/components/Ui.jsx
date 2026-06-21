import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { interventionTowns } from "../data.js";
import { useHeroBackgroundImage } from "./HeroBackground.jsx";

/**
 * Uniformise les liens d'action et leurs variantes visuelles.
 * @param {{ to: string, children: React.ReactNode, variant?: string, size?: string, block?: boolean }} props Propriétés du bouton.
 * @returns {JSX.Element} Un lien stylé comme un bouton.
 */
export function ButtonLink({
    to,
    children,
    variant = "primary",
    size = "normal",
    block = false,
}) {
    const classNames = [
        "button",
        `button--${variant}`,
        size === "small" ? "button--small" : "",
        block ? "button--block" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <Link className={classNames} to={to}>
            {children}
        </Link>
    );
}

/**
 * Affiche l'en-tête éditorial d'une page, posé par-dessus le fond fixe partagé.
 *
 * Le fond image n'appartient plus à la section : il est délégué au composant
 * `HeroBackground` monté dans le Layout. Cette section ne porte que le héros
 * « texte » et le dégradé de lisibilité, qui défilent donc avec la page.
 * @param {{ image: string, eyebrow: string, title: React.ReactNode, description: string, children?: React.ReactNode, large?: boolean }} props Contenu du héros.
 * @returns {JSX.Element} L'en-tête de page.
 */
export function PageHero({
    image,
    eyebrow,
    title,
    description,
    children,
    large = false,
}) {
    // Déclare l'image affichée par le fond fixe tant que cette page est montée.
    useHeroBackgroundImage(image);

    return (
        <header className={`hero ${large ? "hero--large" : ""}`}>
            <div className="hero__content container">
                <div className="eyebrow">
                    <span />
                    {eyebrow}
                </div>
                <h1>{title}</h1>
                <p>{description}</p>
                {children}
            </div>
        </header>
    );
}

/**
 * Uniformise les introductions des sections de contenu.
 * @param {{ overline: string, title: string, description?: string, split?: boolean }} props Contenu du titre.
 * @returns {JSX.Element} Le titre de section.
 */
export function SectionHeading({ overline, title, description, split = false }) {
    return (
        <div className={`section-heading ${split ? "section-heading--split" : ""}`}>
            <div>
                <span className="overline">{overline}</span>
                <h2>{title}</h2>
            </div>
            {description && <p>{description}</p>}
        </div>
    );
}

/**
 * Affiche une carte de prestation réutilisable.
 * @param {{ service: object }} props Prestation à présenter.
 * @returns {JSX.Element} Une carte de prestation.
 */
export function ServiceCard({ service }) {
    const Icon = service.icon;

    return (
        <article className="service-card">
            <span className="icon-tile">
                <Icon />
            </span>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <div className="service-card__footer">
                <strong>{service.from}</strong>
                <ButtonLink
                    size="small"
                    variant="secondary"
                    to={`/rendez-vous?service=${encodeURIComponent(service.title)}`}
                >
                    Réserver
                </ButtonLink>
            </div>
        </article>
    );
}

/**
 * Compare les deux photos avant et après fournies dans les assets.
 * @returns {JSX.Element} Le comparateur interactif.
 */
export function BeforeAfterComparison() {
    const [comparison, setComparison] = useState(50);

    return (
        <div className="comparison">
            <img
                className="comparison__before"
                src="/assets/comparison--before.webp"
                alt="Carrosserie avant rénovation"
            />
            <div
                className="comparison__after"
                style={{ clipPath: `inset(0 0 0 ${comparison}%)` }}
            >
                <img
                    src="/assets/comparison--after.webp"
                    alt="Carrosserie après rénovation"
                />
            </div>
            <span className="comparison__label comparison__label--before">Avant</span>
            <span className="comparison__label comparison__label--after">Après</span>
            <div className="comparison__handle" style={{ left: `${comparison}%` }}>
                ⇆
            </div>
            <input
                type="range"
                min="0"
                max="100"
                value={comparison}
                onChange={(event) => setComparison(Number(event.target.value))}
                aria-label="Comparateur avant après"
            />
        </div>
    );
}

/**
 * Présente la zone d'intervention dans la page de rendez-vous.
 * @returns {JSX.Element} Le bloc de zone et ses communes.
 */
export function ZonePanel() {
    return (
        <section className="zone-panel">
            <div>
                <SectionHeading
                    overline="Zone d’intervention"
                    title="je viens à vous"
                    description="Basé à Parignargues (30730), je me déplace dans le Gard et selon le projet dans les départements voisins. Le déplacement est offert jusqu’à 15 km, puis un supplément carburant s’applique."
                />
                <div className="town-list">
                    {interventionTowns.map((town) => (
                        <span key={town}>{town}</span>
                    ))}
                </div>
            </div>
            <div className="radius-map">
                <div className="radius-map__outer" />
                <div className="radius-map__middle" />
                <div className="radius-map__inner" />
                <div className="radius-map__center">
                    <Sparkles />
                    <strong>Parignargues</strong>
                    <span>Gard · 30730</span>
                </div>
                <span className="radius-map__label">15 km offerts</span>
            </div>
        </section>
    );
}
