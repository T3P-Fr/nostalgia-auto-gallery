import { createContext, useContext, useEffect, useRef, useState } from "react";

/*
 * Le fond fixe vit au niveau du Layout (juste après le Header) afin de rester
 * monté pendant toute la navigation. Chaque page déclare l'image à afficher via
 * ce contexte, ce qui évite de la transmettre manuellement à travers l'arbre.
 */
const HeroBackgroundContext = createContext(null);

/**
 * Fournit l'image de fond fixe courante à l'ensemble de l'application.
 * @param {{ children: React.ReactNode }} props Sous-arbre ayant accès au fond.
 * @returns {JSX.Element} Le fournisseur de contexte.
 */
export function HeroBackgroundProvider({ children }) {
    const [image, setImage] = useState(null);

    return (
        <HeroBackgroundContext.Provider value={{ image, setImage }}>
            {children}
        </HeroBackgroundContext.Provider>
    );
}

/**
 * Enregistre l'image de fond fixe d'une page tant que celle-ci est affichée.
 * @param {string} image Image de héros à afficher en fond fixe.
 * @returns {void} Aucune valeur de retour.
 */
export function useHeroBackgroundImage(image) {
    const context = useContext(HeroBackgroundContext);

    useEffect(() => {
        if (!context) {
            return undefined;
        }

        context.setImage(image);

        // Réinitialisé au démontage ; un null transitoire est ignoré côté fond.
        return () => context.setImage(null);
    }, [context, image]);
}

/**
 * Affiche les couches de fond fixe : les images (en fondu enchaîné) puis la surcouche.
 *
 * - Chaque nouvelle image apparaît en fondu par-dessus la précédente : c'est la
 *   transition de fond lors d'un changement de page (au lieu d'un saut brusque).
 * - L'ensemble des images se floute et s'agrandit, nul en haut de page et maximal
 *   en bas (`--scroll-factor` : 0 → 1).
 * - La surcouche est un dégradé fixe de la couleur de fond dont les stops glissent
 *   avec `--scroll-factor` : l'écran s'assombrit à mesure qu'on descend la page.
 *
 * Tous ces facteurs sont dérivés en CSS à partir des mesures brutes publiées par le
 * Layout (`--scroll-position`, `--page-height`) ; ce composant ne fait que rendre
 * et enchaîner les images.
 * @returns {JSX.Element|null} Les couches de fond, ou rien tant qu'aucune image n'a été définie.
 */
export function HeroBackground() {
    const context = useContext(HeroBackgroundContext);
    const image = context?.image ?? null;
    const layerIdRef = useRef(0);
    const [layers, setLayers] = useState([]);
    const hasBackground = layers.length > 0;

    // Empile une couche à chaque nouvelle image (pour le fondu enchaîné) en gardant
    // la précédente le temps de la transition. Un passage transitoire à null lors
    // d'une navigation est ignoré, pour éviter un clignotement vers le vide.
    useEffect(() => {
        if (!image) {
            return;
        }

        setLayers((previousLayers) => {
            const topLayer = previousLayers[previousLayers.length - 1];

            if (topLayer && topLayer.image === image) {
                return previousLayers;
            }

            layerIdRef.current += 1;
            return [...previousLayers, { id: layerIdRef.current, image }];
        });
    }, [image]);

    /**
     * Retire les couches masquées une fois le fondu de la plus récente terminé.
     * @param {number} finishedId Identifiant de la couche dont l'apparition s'achève.
     * @returns {void} Aucune valeur de retour.
     */
    function handleLayerEntered(finishedId) {
        setLayers((previousLayers) => {
            const index = previousLayers.findIndex((layer) => layer.id === finishedId);
            return index > 0 ? previousLayers.slice(index) : previousLayers;
        });
    }

    if (!hasBackground) {
        return null;
    }

    const topLayerIndex = layers.length - 1;

    return (
        <>
            <div className="hero-background" aria-hidden="true">
                {layers.map((layer, index) => {
                    // Seule la couche la plus récente s'anime ; les autres, déjà
                    // affichées en dessous, restent opaques jusqu'à leur retrait.
                    const isTopLayer = index === topLayerIndex;

                    return (
                        <div
                            key={layer.id}
                            className={`hero-background__layer${isTopLayer ? " hero-background__layer--enter" : ""}`}
                            style={{ backgroundImage: `url("${layer.image}")` }}
                            onAnimationEnd={
                                isTopLayer ? () => handleLayerEntered(layer.id) : undefined
                            }
                        />
                    );
                })}
            </div>
            <div className="hero-veil" aria-hidden="true" />
        </>
    );
}
