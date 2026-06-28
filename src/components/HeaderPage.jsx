import { Menu, X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Brand } from "./Brand.jsx";
import { ButtonLink } from "./Ui.jsx";

/*
 * Durée (ms) de la seconde phase de l'indicateur : le temps que le bord « étiré »
 * reste tendu avant de se resserrer sous le lien choisi. Doit suivre la durée de
 * transition CSS de .site-nav__indicator.
 */
const INDICATOR_SETTLE_MS = 320;

/*
 * Libellé de page affiché à côté du bouton menu en mode téléphone. La clé est le
 * chemin exact de l'URL ; un repli sur « Accueil » couvre la racine et l'inconnu.
 */
const PAGE_TITLES = {
    "/": "Accueil",
    "/negoce": "Négoce",
    "/detailing": "Detailing",
    "/realisations": "Réalisations",
    "/contact": "Prendre RDV",
};

/**
 * En-tête fixe : logo, navigation principale (avec indicateur animé) et actions.
 *
 * L'indicateur unique relie visuellement deux liens pendant la navigation : un bord
 * s'étire jusqu'au nouveau lien, puis l'autre le rejoint. Toute la logique de mesure
 * vit ici, l'en-tête étant le seul à en avoir besoin.
 * @returns {JSX.Element} L'en-tête du site.
 */
export function HeaderPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [navIndicator, setNavIndicator] = useState({
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    });
    // L'indicateur (pilule rouge) n'est visible que sur une page DU menu : sur les
    // pages absentes de la nav (Informations, Contact, Admin…), aucun lien n'est
    // actif → on le masque au lieu de le coller à tort sous le premier lien.
    const [isIndicatorVisible, setIsIndicatorVisible] = useState(false);
    const navRef = useRef(null);
    const navIndicatorRef = useRef({
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        initialized: false,
    });
    const navAnimationTimerRef = useRef(null);
    const isNavIndicatorAnimatingRef = useRef(false);
    const location = useLocation();

    // useLayoutEffect : l'indicateur est positionné AVANT la peinture, ce qui évite
    // qu'il apparaisse sur toute la largeur le temps d'un rendu à l'ouverture.
    useLayoutEffect(() => {
        const navigation = navRef.current;

        if (!navigation) {
            return undefined;
        }

        /**
         * Mesure la boîte du lien à cibler (les quatre côtés), avec repli sur le premier lien.
         *
         * On renvoie left/right ET top/bottom : la pilule épouse exactement la boîte du lien
         * sur les deux axes. En desktop (liens en ligne) seuls left/right varient → glissement
         * horizontal ; en mobile (liens en colonne) seuls top/bottom varient → glissement vertical.
         * @returns {{ left: number, right: number, top: number, bottom: number, initialized: true } | null} Position, ou null si aucun lien.
         */
        function measureTarget() {
            // Seul un lien réellement actif cible l'indicateur : sans lien actif
            // (page hors menu), on renvoie null et l'indicateur sera masqué.
            const activeLink = navigation.querySelector("a.active");

            if (!activeLink) {
                return null;
            }

            const navigationBounds = navigation.getBoundingClientRect();
            const activeLinkBounds = activeLink.getBoundingClientRect();

            return {
                left: activeLinkBounds.left - navigationBounds.left,
                right: navigationBounds.right - activeLinkBounds.right,
                top: activeLinkBounds.top - navigationBounds.top,
                bottom: navigationBounds.bottom - activeLinkBounds.bottom,
                initialized: true,
            };
        }

        /**
         * Recale l'indicateur sur le lien actif (sans animer), p. ex. au redimensionnement.
         * @returns {void} Aucune valeur de retour.
         */
        function alignNavIndicator() {
            // Un redimensionnement ne doit pas interrompre l'animation en deux temps.
            if (isNavIndicatorAnimatingRef.current) {
                return;
            }

            const target = measureTarget();

            if (!target) {
                setIsIndicatorVisible(false);
                return;
            }

            navIndicatorRef.current = target;
            setIsIndicatorVisible(true);
            setNavIndicator({
                left: target.left,
                right: target.right,
                top: target.top,
                bottom: target.bottom,
            });
        }

        /**
         * Étire la pilule jusqu'au nouveau lien, puis la resserre sur celui-ci.
         *
         * L'effet en deux temps s'applique sur l'axe du déplacement : horizontal en
         * desktop (left/right), vertical en mobile (top/bottom). On détecte l'axe en
         * comparant l'amplitude du mouvement sur chacun.
         * @returns {void} Aucune valeur de retour.
         */
        function animateNavIndicator() {
            const target = measureTarget();

            if (!target) {
                // Page hors menu : on masque l'indicateur et on « désinitialise » la
                // mémoire pour qu'il réapparaisse net sous le bon lien au retour.
                setIsIndicatorVisible(false);
                navIndicatorRef.current = { ...navIndicatorRef.current, initialized: false };
                return;
            }

            setIsIndicatorVisible(true);

            const current = navIndicatorRef.current;

            // Au premier affichage, la pilule apparaît directement sous le lien actif.
            if (!current.initialized) {
                navIndicatorRef.current = target;
                setNavIndicator({
                    left: target.left,
                    right: target.right,
                    top: target.top,
                    bottom: target.bottom,
                });
                return;
            }

            // L'axe dominant du déplacement décide quel couple de bords s'étire.
            const horizontalMove =
                Math.abs(target.left - current.left) +
                Math.abs(target.right - current.right);
            const verticalMove =
                Math.abs(target.top - current.top) +
                Math.abs(target.bottom - current.bottom);

            let stretched;

            if (verticalMove > horizontalMove) {
                // Glissement vertical (mobile) : un bord haut/bas reste fixe.
                const movesUp = target.top < current.top;
                stretched = movesUp
                    ? {
                          left: target.left,
                          right: target.right,
                          top: target.top,
                          bottom: current.bottom,
                          initialized: true,
                      }
                    : {
                          left: target.left,
                          right: target.right,
                          top: current.top,
                          bottom: target.bottom,
                          initialized: true,
                      };
            } else {
                // Glissement horizontal (desktop) : un bord gauche/droite reste fixe.
                const movesLeft = target.left < current.left;
                stretched = movesLeft
                    ? {
                          left: target.left,
                          right: current.right,
                          top: target.top,
                          bottom: target.bottom,
                          initialized: true,
                      }
                    : {
                          left: current.left,
                          right: target.right,
                          top: target.top,
                          bottom: target.bottom,
                          initialized: true,
                      };
            }

            window.clearTimeout(navAnimationTimerRef.current);
            isNavIndicatorAnimatingRef.current = true;
            navIndicatorRef.current = stretched;
            setNavIndicator({
                left: stretched.left,
                right: stretched.right,
                top: stretched.top,
                bottom: stretched.bottom,
            });

            // Le bord opposé se referme ensuite sur la boîte exacte du lien choisi.
            navAnimationTimerRef.current = window.setTimeout(() => {
                isNavIndicatorAnimatingRef.current = false;
                navIndicatorRef.current = target;
                setNavIndicator({
                    left: target.left,
                    right: target.right,
                    top: target.top,
                    bottom: target.bottom,
                });
            }, INDICATOR_SETTLE_MS);
        }

        animateNavIndicator();

        // L'indicateur reste aligné si les polices ou la fenêtre changent sa largeur.
        const resizeObserver = new ResizeObserver(alignNavIndicator);
        resizeObserver.observe(navigation);
        window.addEventListener("resize", alignNavIndicator);

        return () => {
            window.clearTimeout(navAnimationTimerRef.current);
            isNavIndicatorAnimatingRef.current = false;
            resizeObserver.disconnect();
            window.removeEventListener("resize", alignNavIndicator);
        };
    }, [isMenuOpen, location.pathname]);

    /**
     * Referme le menu après une navigation mobile.
     * @returns {void} Aucune valeur de retour.
     */
    function closeMenu() {
        setIsMenuOpen(false);
    }

    return (
        <header className={`header-nav ${isMenuOpen ? "header-nav--open" : ""}`}>
            <Brand />
            {/* Titre de la page active, visible seulement en mode téléphone près du menu. */}
            <span className="header-page-title" aria-hidden="true">
                {PAGE_TITLES[location.pathname] ?? "Accueil"}
            </span>
            <button
                className="menu-button"
                type="button"
                onClick={() => setIsMenuOpen((current) => !current)}
                aria-label="Ouvrir la navigation"
            >
                {isMenuOpen ? <X /> : <Menu />}
            </button>
            <nav
                ref={navRef}
                className={`site-nav ${isMenuOpen ? "site-nav--open" : ""}`}
            >
                <span
                    className={`site-nav__indicator${isIndicatorVisible ? "" : " is-hidden"}`}
                    style={{
                        left: `${navIndicator.left}px`,
                        right: `${navIndicator.right}px`,
                        top: `${navIndicator.top}px`,
                        bottom: `${navIndicator.bottom}px`,
                    }}
                    aria-hidden="true"
                />
                <NavLink to="/" end onClick={closeMenu}>
                    Accueil
                </NavLink>
                <NavLink to="/negoce" onClick={closeMenu}>
                    Négoce
                </NavLink>
                <NavLink to="/detailing" onClick={closeMenu}>
                    Detailing
                </NavLink>
                <NavLink to="/realisations" onClick={closeMenu}>
                    Réalisations
                </NavLink>
            </nav>
            {/* Bouton RDV unique : à droite en desktop, déplacé en bas du plein écran en mobile. */}
            <div className="header-actions">
                <ButtonLink size="small" to="/contact" onClick={closeMenu}>
                    Prendre RDV
                </ButtonLink>
            </div>
        </header>
    );
}
