import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FooterPage } from "./FooterPage.jsx";
import { HeaderPage } from "./HeaderPage.jsx";
import { MainPage } from "./MainPage.jsx";

/**
 * Squelette commun à toutes les pages : en-tête, contenu, pied de page.
 *
 * Le Layout ne porte que les préoccupations GLOBALES (transverses aux pages) :
 *   1. le retour en haut à chaque changement de route ;
 *   2. le « driver » de défilement qui publie les mesures brutes du scroll en
 *      variables CSS, dont tout le reste (fond, voile…) dérive ses facteurs.
 * La structure visuelle est déléguée à HeaderPage / MainPage / FooterPage.
 * @returns {JSX.Element} La mise en page globale.
 */
export default function Layout() {
    const location = useLocation();

    // Avis « site en finalisation » : popup rouvert à CHAQUE page (changement de
    // route), refermé par le bouton « COMPRIS ».
    const [noticeOpen, setNoticeOpen] = useState(true);
    useEffect(() => {
        setNoticeOpen(true);
    }, [location.pathname]);

    // Chaque changement de page repart du haut : React Router ne réinitialise pas
    // le défilement seul, et l'état du fond fixe (flou/zoom) en dépend.
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, [location.pathname]);

    // Driver de défilement global : publie deux mesures brutes (--scroll-position,
    // --page-height) sur l'élément racine ; tout le système de variables CSS en
    // dérive ses facteurs (--scroll-factor, flou/zoom du fond…). Monté ici pour
    // rester actif sur toutes les pages.
    useEffect(() => {
        const root = document.documentElement;
        let animationFrame = 0;

        /**
         * Publie la hauteur totale de la page (nombre sans unité, px sous-entendu).
         * @returns {void} Aucune valeur de retour.
         */
        function measure() {
            root.style.setProperty("--page-height", `${root.scrollHeight}`);
        }

        /**
         * Publie la position du scroll (nombre sans unité, px sous-entendu).
         * @returns {void} Aucune valeur de retour.
         */
        function updateScrollPosition() {
            animationFrame = 0;
            root.style.setProperty("--scroll-position", `${window.scrollY}`);
        }

        /**
         * Limite les recalculs à une frame d'animation par évènement de scroll.
         * @returns {void} Aucune valeur de retour.
         */
        function requestUpdate() {
            if (animationFrame) {
                return;
            }

            animationFrame = window.requestAnimationFrame(updateScrollPosition);
        }

        /**
         * Remesure puis recalcule (la hauteur de page change selon la page affichée).
         * @returns {void} Aucune valeur de retour.
         */
        function remeasure() {
            measure();
            requestUpdate();
        }

        measure();
        updateScrollPosition();

        // La hauteur de page varie d'une page à l'autre : on remesure quand elle change.
        const resizeObserver = new ResizeObserver(remeasure);
        resizeObserver.observe(document.body);

        window.addEventListener("scroll", requestUpdate, { passive: true });
        window.addEventListener("resize", remeasure);

        return () => {
            window.cancelAnimationFrame(animationFrame);
            resizeObserver.disconnect();
            window.removeEventListener("scroll", requestUpdate);
            window.removeEventListener("resize", remeasure);
        };
    }, []);

    return (
        <>
            <HeaderPage />
            <MainPage />
            <FooterPage />

            {/* Popup d'avis (même modal que partout) : rouvert à chaque page. */}
            {noticeOpen && (
                <div className="slot-modal" role="dialog" aria-modal="true">
                    <div className="slot-modal__box">
                        <h3>Site en cours de finalisation</h3>
                        <p>
                            Ce site est en cours de finalisation. Pour les informations et
                            les tarifs exacts, contactez Corentin au{" "}
                            <a href="tel:+33636372210">06&nbsp;36&nbsp;37&nbsp;22&nbsp;10</a>.
                        </p>
                        <button
                            className="button button--block"
                            type="button"
                            onClick={() => setNoticeOpen(false)}
                        >
                            COMPRIS
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
