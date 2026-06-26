import { Menu, X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { site } from "../data.js";
import { Brand } from "./Brand.jsx";
import { ButtonLink } from "./Ui.jsx";

/*
 * Durée (ms) de la seconde phase de l'indicateur : le temps que le bord « étiré »
 * reste tendu avant de se resserrer sous le lien choisi. Doit suivre la durée de
 * transition CSS de .site-nav__indicator.
 */
const INDICATOR_SETTLE_MS = 320;

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
    const [navIndicator, setNavIndicator] = useState({ left: 0, right: 0 });
    const navRef = useRef(null);
    const navIndicatorRef = useRef({ left: 0, right: 0, initialized: false });
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
         * Mesure la position du lien à cibler, avec repli sur le premier lien.
         * @returns {{ left: number, right: number, initialized: true } | null} Position, ou null si aucun lien.
         */
        function measureTarget() {
            // À défaut de lien actif (ex. page d'accueil), on cadre l'indicateur sur
            // le premier lien plutôt que de le laisser couvrir toute la barre.
            const activeLink =
                navigation.querySelector("a.active") || navigation.querySelector("a");

            if (!activeLink) {
                return null;
            }

            const navigationBounds = navigation.getBoundingClientRect();
            const activeLinkBounds = activeLink.getBoundingClientRect();

            return {
                left: activeLinkBounds.left - navigationBounds.left,
                right: navigationBounds.right - activeLinkBounds.right,
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
                return;
            }

            navIndicatorRef.current = target;
            setNavIndicator({ left: target.left, right: target.right });
        }

        /**
         * Étire la barre jusqu'au nouveau lien, puis la resserre sous celui-ci.
         * @returns {void} Aucune valeur de retour.
         */
        function animateNavIndicator() {
            const target = measureTarget();

            if (!target) {
                return;
            }

            const current = navIndicatorRef.current;

            // Au premier affichage, la barre apparaît directement sous le lien actif.
            if (!current.initialized) {
                navIndicatorRef.current = target;
                setNavIndicator({ left: target.left, right: target.right });
                return;
            }

            // Un bord reste fixe pendant que l'autre rejoint le nouvel élément.
            const movesLeft = target.left < current.left;
            const stretched = movesLeft
                ? { left: target.left, right: current.right, initialized: true }
                : { left: current.left, right: target.right, initialized: true };

            window.clearTimeout(navAnimationTimerRef.current);
            isNavIndicatorAnimatingRef.current = true;
            navIndicatorRef.current = stretched;
            setNavIndicator({ left: stretched.left, right: stretched.right });

            // Le bord opposé se referme ensuite sur la largeur exacte du lien choisi.
            navAnimationTimerRef.current = window.setTimeout(() => {
                isNavIndicatorAnimatingRef.current = false;
                navIndicatorRef.current = target;
                setNavIndicator({ left: target.left, right: target.right });
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
        <header className="site-header">
            <Brand />
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
                    className="site-nav__indicator"
                    style={{
                        left: `${navIndicator.left}px`,
                        right: `${navIndicator.right}px`,
                    }}
                    aria-hidden="true"
                />
                <NavLink to="/" end onClick={closeMenu}>
                    Accueil
                </NavLink>
                <NavLink to="/detailing" onClick={closeMenu}>
                    Detailing
                </NavLink>
                <NavLink to="/realisations" onClick={closeMenu}>
                    Réalisations
                </NavLink>
                <NavLink to="/a-propos" onClick={closeMenu}>
                    À propos
                </NavLink>
                <NavLink to="/contact" onClick={closeMenu}>
                    Contact
                </NavLink>
            </nav>
            <div className="header-actions">
                <a className="header-phone" href={site.phoneHref}>
                    {site.phone}
                </a>
                <ButtonLink size="small" to="/contact">
                    Prendre RDV
                </ButtonLink>
            </div>
        </header>
    );
}
