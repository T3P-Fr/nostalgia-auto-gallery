import { useCallback, useRef, useState } from "react";

/**
 * Glisser-déposer au pointeur « façon Galerie » : un clone soulevé suit le
 * curseur, la liste se réordonne en direct, et l'ordre est persisté au
 * relâchement. Réutilisable pour n'importe quelle liste.
 *
 * Les éléments réordonnables doivent porter `data-dnd-scope={scope}` et
 * `data-dnd-key={cléStable}`. Le glissement est amorcé par une poignée qui
 * appelle `startDrag(event, cléStable)` sur son `onPointerDown`.
 *
 * @param {object} opts Options.
 * @param {string} opts.scope Namespace pour ne cibler que les bons éléments.
 * @param {(fromKey: string, overKey: string) => void} opts.onReorder Réordonne
 *   l'état AFFICHÉ en direct (sans persister).
 * @param {() => void} opts.onDrop Persiste l'ordre final (au relâchement).
 * @returns {{ draggingKey: string|null, clonePos: {x:number,y:number},
 *   cloneWidth: number, startDrag: (e: React.PointerEvent, key: any) => void }}
 */
export default function useDragReorder({ scope, onReorder, onDrop }) {
    // Clé de l'élément tiré (null si aucun glissement actif).
    const [draggingKey, setDraggingKey] = useState(null);
    // Position à l'écran du clone flottant qui suit le curseur.
    const [clonePos, setClonePos] = useState({ x: 0, y: 0 });
    // Inclinaison (deg) du clone — physique de « sac tenu par la poignée » :
    // il balance selon la vitesse horizontale, puis revient à la verticale.
    const [tilt, setTilt] = useState(0);
    // Dernière abscisse (pour calculer la vitesse) + minuterie de retour vertical.
    const lastX = useRef(0);
    const tiltTimer = useRef(null);
    // Données transitoires du glissement (évitent les fermetures périmées).
    const drag = useRef({ key: null, active: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0, width: 0 });
    // Réfs vers les callbacks à jour (lues depuis les écouteurs globaux).
    const onReorderRef = useRef(onReorder);
    onReorderRef.current = onReorder;
    const onDropRef = useRef(onDrop);
    onDropRef.current = onDrop;

    /**
     * Pendant le glissement : déplace le clone et réordonne en direct selon
     * l'élément survolé (le clone est pointer-events:none, donc ignoré).
     * @param {PointerEvent} event Événement pointermove.
     * @returns {void} Aucune valeur de retour.
     */
    const onMove = useCallback(
        (event) => {
            const d = drag.current;
            if (!d.key) {
                return;
            }
            // Seuil de 5px avant d'amorcer réellement (sinon simple clic).
            if (!d.active) {
                if (Math.hypot(event.clientX - d.startX, event.clientY - d.startY) < 5) {
                    return;
                }
                d.active = true;
                setDraggingKey(d.key);
            }
            setClonePos({ x: event.clientX - d.offsetX, y: event.clientY - d.offsetY });

            // Physique du balancement : l'inclinaison suit la vitesse horizontale
            // (le bas « traîne » derrière la poignée), bornée, puis on programme un
            // retour à la verticale dès que le mouvement s'arrête.
            const dx = event.clientX - lastX.current;
            lastX.current = event.clientX;
            const angle = Math.max(-22, Math.min(22, -dx * 0.9));
            setTilt(angle);
            if (tiltTimer.current) {
                clearTimeout(tiltTimer.current);
            }
            tiltTimer.current = setTimeout(() => setTilt(0), 90);

            const element = document.elementFromPoint(event.clientX, event.clientY);
            const item = element && element.closest(`[data-dnd-scope="${scope}"]`);
            const overKey = item && item.getAttribute("data-dnd-key");
            if (overKey && overKey !== d.key) {
                onReorderRef.current(d.key, overKey);
            }
        },
        [scope],
    );

    /**
     * Fin du glissement : retire les écouteurs, persiste l'ordre, réinitialise.
     * @returns {void} Aucune valeur de retour.
     */
    const onUp = useCallback(() => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        const wasActive = drag.current.active;
        drag.current = { key: null, active: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0, width: 0 };
        if (tiltTimer.current) {
            clearTimeout(tiltTimer.current);
        }
        setTilt(0);
        if (wasActive) {
            setDraggingKey(null);
            onDropRef.current();
        }
    }, [onMove]);

    /**
     * Amorce un glissement depuis une poignée. Mesure l'élément réordonnable
     * (ancêtre `data-dnd-scope`) pour dimensionner le clone.
     * @param {React.PointerEvent} event Événement pointerdown (sur la poignée).
     * @param {any} key Clé stable de l'élément à déplacer.
     * @returns {void} Aucune valeur de retour.
     */
    const startDrag = useCallback(
        (event, key) => {
            if (event.button !== 0) {
                return;
            }
            event.preventDefault();
            lastX.current = event.clientX;
            setTilt(0);
            // L'élément mesuré = l'ancêtre réordonnable (la carte / la pastille…).
            const item = event.currentTarget.closest(`[data-dnd-scope="${scope}"]`) || event.currentTarget;
            const rect = item.getBoundingClientRect();
            drag.current = {
                key: String(key),
                active: false,
                startX: event.clientX,
                startY: event.clientY,
                offsetX: event.clientX - rect.left,
                offsetY: event.clientY - rect.top,
                width: rect.width,
            };
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
        },
        [scope, onMove, onUp],
    );

    // Style prêt à poser sur le clone : position + largeur + PIVOT à la poignée
    // (point de préhension) + inclinaison physique.
    const cloneStyle = {
        left: clonePos.x,
        top: clonePos.y,
        width: drag.current.width,
        transformOrigin: `${drag.current.offsetX}px ${drag.current.offsetY}px`,
        transform: `scale(1.06) rotate(${tilt}deg)`,
    };

    return { draggingKey, clonePos, cloneWidth: drag.current.width, cloneStyle, startDrag };
}
