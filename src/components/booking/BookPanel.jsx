// Tagline de remplacement quand un panneau n'en fournit pas encore : un lorem ipsum
// court occupe la 2e ligne pour que le gros numéro garde sa hauteur sur deux lignes.
const PLACEHOLDER_TAGLINE = "Lorem ipsum dolor sit amet consectetur.";

/**
 * Panneau d'étape du formulaire de réservation. Classe commune `.panel` ; en-tête avec
 * le numéro à gauche et, à droite, une colonne titre + tagline (sous le titre).
 * @param {object} props Propriétés du panneau.
 * @param {string} [props.id] Identifiant unique du panneau (ciblage/ancrage).
 * @param {number} [props.step] Numéro d'étape affiché devant le titre.
 * @param {string} props.title Titre de l'étape.
 * @param {React.ReactNode} [props.aside] Tagline sous le titre. À défaut, un lorem ipsum.
 * @param {string} [props.className] Classes additionnelles.
 * @param {React.ReactNode} props.children Contenu du panneau.
 * @returns {JSX.Element} Le panneau d'étape.
 */
export default function BookPanel({ id, step, title, aside, className = "", children }) {
    // Tagline effective : celle fournie, sinon le lorem ipsum de remplacement.
    const tagline = aside ?? PLACEHOLDER_TAGLINE;
    return (
        <section id={id} className={`panel ${className}`.trim()}>
            <div className="panel__head">
                {/* En-tête : à gauche le gros numéro (display blanc + point rouge),
                    à droite une COLONNE empilant le titre puis la tagline. Le numéro
                    est dimensionné pour couvrir la hauteur de ces deux lignes. */}
                <h3 className="panel__heading-row">
                    {step != null && (
                        <span className="panel__step">
                            <span className="panel__num">{step}</span>
                            <span className="panel__dot">.</span>
                        </span>
                    )}
                    <span className="panel__heading">
                        <span className="panel__title">{title}</span>
                        <span className="panel__aside">{tagline}</span>
                    </span>
                </h3>
            </div>
            {children}
        </section>
    );
}
