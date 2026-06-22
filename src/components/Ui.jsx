import { Sparkles } from "lucide-react";
import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { interventionTowns } from "../data.js";
import { usePageBackgroundImage } from "./PageBackground.jsx";

/**
 * Rend un titre de héros écrit en texte : « \n » devient un retour à la ligne et
 * « *un mot* » devient ce mot en accent (em). Permet de stocker les titres dans le
 * JSON de contenu plutôt qu'en JSX.
 * @param {string} title Titre balisé.
 * @returns {React.ReactNode} Le titre rendu.
 */
function renderHeroTitle(title) {
    if (typeof title !== "string") {
        return title;
    }

    return title.split("\n").map((line, lineIndex) => (
        <Fragment key={lineIndex}>
            {lineIndex > 0 && <br />}
            {line.split(/(\*[^*]+\*)/).map((part, partIndex) =>
                part.startsWith("*") && part.endsWith("*") ? (
                    <em key={partIndex}>{part.slice(1, -1)}</em>
                ) : (
                    part
                ),
            )}
        </Fragment>
    ));
}

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
 * Affiche l'en-tête éditorial d'une page (le « héros texte »), centré sur le fond.
 *
 * Le fond image/voile est porté par les pseudo-éléments de <main> ; ce composant ne
 * fait que déclarer l'image de la page (via `usePageBackgroundImage`) et afficher le
 * texte. L'en-tête est un `.container` (largeur de lecture) centré verticalement.
 * Le `title` est une chaîne balisée (cf. renderHeroTitle) ; `actions` génère les
 * boutons d'appel à l'action ; `children` reste possible (ex. statistiques).
 * @param {{ image: string, eyebrow: string, title: string, description: string, actions?: Array<{label: string, to: string, variant?: string}>, children?: React.ReactNode }} props Contenu du héros.
 * @returns {JSX.Element} L'en-tête de page.
 */
export function PageHero({ image, eyebrow, title, description, actions, children }) {
    // Déclare l'image affichée par le fond (main::before) tant que la page est montée.
    usePageBackgroundImage(image);

    return (
        <header className="hero container">
            <div className="hero__content">
                <div className="eyebrow">
                    <span />
                    {eyebrow}
                </div>
                <h1>{renderHeroTitle(title)}</h1>
                <p>{description}</p>
                {actions && (
                    <div className="hero__actions">
                        {actions.map((action) => (
                            <ButtonLink
                                key={`${action.to}-${action.label}`}
                                to={action.to}
                                variant={action.variant}
                            >
                                {action.label}
                            </ButtonLink>
                        ))}
                    </div>
                )}
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
        <article className="card service-card">
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
        <section className="zone-panel container">
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
