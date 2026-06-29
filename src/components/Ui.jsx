import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Fragment, useEffect, useRef, useState } from "react";
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
 * @param {{ to: string, children: React.ReactNode, variant?: string, size?: string, block?: boolean, className?: string, onClick?: () => void }} props Propriétés du bouton.
 * @returns {JSX.Element} Un lien stylé comme un bouton.
 */
export function ButtonLink({
    to,
    children,
    variant = "primary",
    size = "normal",
    block = false,
    className = "",
    onClick,
}) {
    const classNames = [
        "button",
        `button--${variant}`,
        size === "small" ? "button--small" : "",
        block ? "button--block" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <Link className={classNames} to={to} onClick={onClick}>
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
        <article className="card bluredBackground--card service-card">
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
                    to={service.to ?? `/contact?service=${encodeURIComponent(service.title)}`}
                >
                    Réserver
                </ButtonLink>
            </div>
        </article>
    );
}

/**
 * Compare deux photos avant/après avec un curseur. Les sources sont paramétrables
 * pour afficher différents exemples (cf. page Réalisations) ; valeurs par défaut =
 * le couple de démonstration livré dans les assets.
 * @param {{ before?: string, after?: string, label?: string }} props Sources avant/après.
 * @returns {JSX.Element} Le comparateur interactif.
 */
export function BeforeAfterComparison({
    before = "/assets/comparison--before.webp",
    after = "/assets/comparison--after.webp",
    label = "",
}) {
    const [comparison, setComparison] = useState(50);

    return (
        <div className="comparison">
            <img
                className="comparison__before"
                src={before}
                alt={`Avant rénovation${label ? ` — ${label}` : ""}`}
            />
            <div
                className="comparison__after"
                style={{ clipPath: `inset(0 0 0 ${comparison}%)` }}
            >
                <img
                    src={after}
                    alt={`Après rénovation${label ? ` — ${label}` : ""}`}
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
// Base de l'activité : Parignargues (30730). Centre de la carte et du cercle 15 km.
const ZONE_CENTER = [43.8175, 4.2192];
const ZONE_RADIUS_M = 15000;

// Communes desservies, en coordonnées réelles (placées logiquement sur la carte).
const zoneTowns = [
    { name: "Caveirac", coords: [43.8186, 4.2733] },
    { name: "Nîmes", coords: [43.8367, 4.3601] },
    { name: "Calvisson", coords: [43.7944, 4.1936] },
    { name: "Sommières", coords: [43.7847, 4.0892] },
    { name: "Vauvert", coords: [43.6944, 4.2767] },
    { name: "Saint-Gilles", coords: [43.6772, 4.4319] },
    { name: "Uzès", coords: [44.0122, 4.4197] },
];

/**
 * Carte Leaflet (OpenStreetMap) de la zone d'intervention : Parignargues au centre,
 * cercle des 15 km offerts et communes desservies. Initialisée une fois au montage.
 * @returns {JSX.Element} Le conteneur de la carte.
 */
function ZoneMap() {
    const containerRef = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
        if (mapRef.current || !containerRef.current) {
            return undefined;
        }

        const map = L.map(containerRef.current, {
            scrollWheelZoom: false,
            attributionControl: true,
        });
        mapRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap",
            maxZoom: 18,
        }).addTo(map);

        // Cercle des 15 km offerts, centré sur Parignargues.
        const circle = L.circle(ZONE_CENTER, {
            radius: ZONE_RADIUS_M,
            color: "#e11d2a",
            weight: 2,
            fillColor: "#e11d2a",
            fillOpacity: 0.1,
        }).addTo(map);

        // Marqueur central + libellé permanent.
        L.circleMarker(ZONE_CENTER, {
            radius: 7,
            color: "#fff",
            weight: 2,
            fillColor: "#e11d2a",
            fillOpacity: 1,
        })
            .addTo(map)
            .bindTooltip("Parignargues", { permanent: true, direction: "top" });

        // Communes desservies (petits points + libellé au survol).
        zoneTowns.forEach((town) => {
            L.circleMarker(town.coords, {
                radius: 4,
                color: "#fff",
                weight: 1,
                fillColor: "#14181d",
                fillOpacity: 0.9,
            })
                .addTo(map)
                .bindTooltip(town.name, { direction: "top" });
        });

        // Cadre la vue sur le cercle des 15 km (avec une marge).
        map.fitBounds(circle.getBounds(), { padding: [20, 20] });

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    return <div ref={containerRef} className="zone-map" aria-label="Carte de la zone d’intervention" />;
}

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
            {/* Vraie carte (OpenStreetMap) avec le cercle des 15 km offerts. */}
            <ZoneMap />
        </section>
    );
}
