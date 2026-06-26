import { useEffect, useSyncExternalStore } from "react";

// Petit store d'abonnement à l'image de fond de la page COURANTE. usePageBackgroundImage
// le met à jour ; le Layout s'y abonne pour alimenter le fond animé (LiquidShineImage)
// sans avoir à faire remonter l'image depuis chaque page.
let currentImage = "";
const listeners = new Set();

/**
 * Notifie les abonnés du changement d'image de fond courante.
 * @param {string} image Nouveau chemin d'image.
 * @returns {void} Aucune valeur de retour.
 */
function setCurrentImage(image) {
    if (image === currentImage) {
        return;
    }

    currentImage = image;
    listeners.forEach((listener) => listener());
}

/**
 * Hook React : renvoie le chemin de l'image de fond de la page courante et se
 * re-rend quand elle change.
 * @returns {string} Chemin de l'image courante (chaîne vide si aucune).
 */
export function useCurrentPageImage() {
    return useSyncExternalStore(
        (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        () => currentImage,
    );
}

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
        // Publie aussi le chemin brut pour le fond animé (cf. useCurrentPageImage).
        setCurrentImage(image || "");
    }, [image]);
}
