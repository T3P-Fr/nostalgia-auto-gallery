import { useState } from "react";

/**
 * Curseur comparatif « avant / après » en direct : l'image « avant » est affichée
 * en base, l'image « après » est superposée et révélée de la droite selon la
 * position du curseur. Occupe le même cadre qu'une photo simple, pour conserver
 * une identité visuelle homogène dans la galerie.
 * @param {object} props Propriétés du composant.
 * @param {string} props.beforeUrl URL de l'image avant.
 * @param {string} props.afterUrl URL de l'image après.
 * @param {string} [props.beforeAlt] Texte alternatif de l'image avant.
 * @param {string} [props.afterAlt] Texte alternatif de l'image après.
 * @returns {JSX.Element} Le curseur comparatif.
 */
export default function BeforeAfterSlider({ beforeUrl, afterUrl, beforeAlt = "Avant", afterAlt = "Après" }) {
    // Position du curseur en pourcentage (0 = tout « après », 100 = tout « avant »).
    const [position, setPosition] = useState(50);

    return (
        <div className="ba-slider" title="Glissez le curseur pour comparer avant / après">
            {/* Image AVANT en base, occupe tout le cadre. */}
            <img className="ba-slider__base" src={beforeUrl} alt={beforeAlt} draggable={false} />

            {/* Image APRÈS superposée, rognée pour ne montrer que la partie droite.
                clip-path en % reste responsive sans calcul de largeur en pixels. */}
            <img
                className="ba-slider__overlay"
                src={afterUrl}
                alt={afterAlt}
                draggable={false}
                style={{ clipPath: `inset(0 0 0 ${position}%)` }}
            />

            {/* Trait de séparation positionné sur le curseur. */}
            <div className="ba-slider__divider" style={{ left: `${position}%` }} aria-hidden="true" />

            {/* Étiquettes des deux côtés. */}
            <span className="ba-slider__tag ba-slider__tag--before">Avant</span>
            <span className="ba-slider__tag ba-slider__tag--after">Après</span>

            {/* Curseur natif (accessible au clavier) piloté à la souris/au doigt. */}
            <input
                className="ba-slider__range"
                type="range"
                min="0"
                max="100"
                value={position}
                onChange={(event) => setPosition(Number(event.target.value))}
                aria-label="Comparer avant et après"
            />
        </div>
    );
}
