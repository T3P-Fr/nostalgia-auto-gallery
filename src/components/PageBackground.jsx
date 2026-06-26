import { useEffect } from "react";

/**
 * Déclare l'image de fond de la page courante via une variable CSS sur la racine.
 *
 * Le fond n'est pas un composant rendu : il est porté par les pseudo-éléments de
 * `<main>` (`main::before` lit `var(--page-image)` pour l'image, `main::after` pour
 * le voile). Ce hook se contente donc de publier le chemin de l'image sur
 * `:root`. On ne réinitialise PAS la variable au démontage : pendant une navigation,
 * l'ancienne page se démonte avant que la nouvelle ne pose son image ; conserver la
 * dernière valeur évite un bref clignotement vers le vide.
 * @param {string} image Chemin de l'image de fond à afficher.
 * @returns {void} Aucune valeur de retour.
 */
export function usePageBackgroundImage(image) {
    useEffect(() => {
        document.documentElement.style.setProperty(
            "--page-image",
            image ? `url("${image}")` : "none",
        );
    }, [image]);
}
