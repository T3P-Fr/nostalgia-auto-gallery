import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
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

// Léger décalage du libellé selon son côté, pour l'écarter du point et des voisins.
const TOOLTIP_OFFSETS = {
    top: [0, -5],
    bottom: [0, 5],
    left: [-5, 0],
    right: [5, 0],
};

// Communes desservies (villes notables réparties dans les 15 & 25 km), en
// coordonnées réelles. `dir` = côté du libellé, choisi pour éviter qu'ils se
// chevauchent (on pousse chaque étiquette vers l'extérieur).
const zoneTowns = [
    // Dans les 15 km.
    { name: "Nîmes", coords: [43.8367, 4.3601], dir: "right" },
    { name: "Caveirac", coords: [43.8186, 4.2733], dir: "top" },
    { name: "Milhaud", coords: [43.7858, 4.3061], dir: "right" },
    { name: "Calvisson", coords: [43.7944, 4.1936], dir: "left" },
    { name: "Sommières", coords: [43.7847, 4.0892], dir: "left" },
    { name: "Vergèze", coords: [43.7428, 4.2261], dir: "bottom" },
    // Nord (15–25 km).
    { name: "Saint-Mamert-du-Gard", coords: [43.8783, 4.1933], dir: "left" },
    { name: "Saint-Geniès-de-Malgoirès", coords: [43.9089, 4.2206], dir: "left" },
    { name: "La Calmette", coords: [43.9131, 4.2622], dir: "top" },
    { name: "Saint-Chaptes", coords: [43.9394, 4.305], dir: "right" },
    { name: "Sauve", coords: [43.9375, 3.9469], dir: "left" },
    // Est / sud (15–25 km).
    { name: "Uzès", coords: [44.0122, 4.4197], dir: "top" },
    { name: "Marguerittes", coords: [43.8489, 4.4308], dir: "right" },
    { name: "Saint-Gilles", coords: [43.6772, 4.4319], dir: "right" },
    { name: "Vauvert", coords: [43.6944, 4.2767], dir: "bottom" },
    { name: "Aimargues", coords: [43.69, 4.2058], dir: "bottom" },
    { name: "Lunel", coords: [43.6772, 4.1372], dir: "left" },
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
        const container = containerRef.current;
        // Garde anti double-initialisation : en dev (StrictMode), l'effet tourne deux
        // fois ; on ne recrée pas la carte si le conteneur en porte déjà une.
        if (mapRef.current || !container || container._leaflet_id) {
            return undefined;
        }

        // Carte décorative de fond : toutes les interactions sont désactivées (on ne
        // doit pas pouvoir la déplacer/zoomer sous le texte). Vue initiale OBLIGATOIRE
        // avant toute projection (sinon « layerPointToLatLng of undefined »).
        const map = L.map(container, {
            scrollWheelZoom: false,
            dragging: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            touchZoom: false,
            zoomControl: false,
            attributionControl: true,
            // Autorise un zoom fractionnaire (sinon paliers entiers seulement).
            zoomSnap: 0,
        }).setView(ZONE_CENTER, 11);
        mapRef.current = map;

        // Fond sombre SANS libellés (CartoDB Dark Matter « nolabels ») : on évite
        // ainsi le doublon avec NOS communes (seuls nos marqueurs portent un nom).
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
            attribution: "© OpenStreetMap © CARTO",
            subdomains: "abcd",
            maxZoom: 19,
        }).addTo(map);

        // Cercle des 15 km offerts (plein), centré sur Parignargues.
        const circle = L.circle(ZONE_CENTER, {
            radius: ZONE_RADIUS_M,
            color: "#e11d2a",
            weight: 2,
            fillColor: "#e11d2a",
            fillOpacity: 0.1,
        }).addTo(map);

        // Cercle central à 22,5 km (pointillé, sans remplissage), trait plus fin.
        const circleOuter = L.circle(ZONE_CENTER, {
            radius: 22500,
            color: "#e11d2a",
            weight: 1.5,
            dashArray: "5 6",
            fill: false,
            opacity: 0.9,
        }).addTo(map);

        // Troisième cercle à 30 km : trait fin, rouge foncé, limite maximale.
        L.circle(ZONE_CENTER, {
            radius: 30000,
            color: "#7a0f15",
            weight: 1,
            fill: false,
            opacity: 0.9,
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
                .bindTooltip(town.name, {
                    permanent: true,
                    direction: town.dir || "top",
                    offset: TOOLTIP_OFFSETS[town.dir || "top"],
                });
        });

        // Place Parignargues + ses cercles dans le tiers DROIT (~76 % de la largeur).
        // Calcul géométrique : on choisit le zoom qui cadre le cercle 25 km, puis on
        // déprojette un centre décalé pour que Parignargues tombe à droite. Plus fiable
        // que panBy (qui dépendait d'une largeur parfois nulle au montage).
        const frame = () => {
            // +0.4 niveau de zoom ≈ +30 % d'échelle (« au moins 25 % de plus »).
            const zoom = map.getBoundsZoom(circleOuter.getBounds(), false, [24, 24]) + 0.4;
            const width = map.getSize().x || 600;
            const centerPoint = map.project(ZONE_CENTER, zoom);
            const shiftedCenter = map.unproject(
                [centerPoint.x - width * 0.3, centerPoint.y],
                zoom,
            );
            map.setView(shiftedCenter, zoom, { animate: false });
        };
        frame();

        // Recale une fois la mise en page stabilisée (sinon tuiles grises / mauvais
        // décalage si le conteneur est dimensionné après l'init).
        const sizeTimer = window.setTimeout(() => {
            map.invalidateSize();
            frame();
        }, 0);

        return () => {
            window.clearTimeout(sizeTimer);
            map.remove();
            mapRef.current = null;
        };
    }, []);

    return <div ref={containerRef} className="zone-map" aria-label="Carte de la zone d’intervention" />;
}

export function ZonePanel() {
    return (
        <section className="zone-panel container">
            {/* Carte sombre en FOND de la card ; le contenu passe par-dessus un voile. */}
            <ZoneMap />
            <div className="zone-panel__content">
                <SectionHeading
                    overline="Zone d’intervention"
                    title="je viens à vous"
                    description="Basé à Parignargues (30730), je me déplace dans le Gard et selon le projet dans les départements voisins. Le déplacement est offert jusqu’à 15 km, puis un supplément carburant s’applique."
                />
            </div>
        </section>
    );
}
