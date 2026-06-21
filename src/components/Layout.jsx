import {Menu, X} from "lucide-react";
import {useEffect, useLayoutEffect, useRef, useState} from "react";
import {Link, NavLink, Outlet, useLocation} from "react-router-dom";
import {HeroBackground, HeroBackgroundProvider} from "./HeroBackground.jsx";
import {ButtonLink} from "./Ui.jsx";

/**
 * Affiche le logo typographique et son emblème.
 * @param {{ footer?: boolean }} props Options d'affichage.
 * @returns {JSX.Element} Le logo de la marque.
 */
function Brand({footer = false}) {
    return (
        <Link className="brand" to="/">
            <img
                src="/assets/logo.webp"
                alt="Nostalgia Auto Gallery"
                className={footer ? "brand__image brand__image--footer" : "brand__image"}
            />
            <span className="brand__words">
                <span className="brand__name">
                    nostalgia<span>.</span>
                </span>
                <span className="brand__subtitle">AUTO GALLERY</span>
            </span>
        </Link>
    );
}

/**
 * Fournit la navigation et le pied de page communs à toutes les pages.
 * @returns {JSX.Element} La mise en page globale.
 */
export default function Layout() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [navIndicator, setNavIndicator] = useState({left: 0, right: 0});
    const navRef = useRef(null);
    const navIndicatorRef = useRef({left: 0, right: 0, initialized: false});
    const navAnimationTimerRef = useRef(null);
    const isNavIndicatorAnimatingRef = useRef(false);
    const location = useLocation();

    // Chaque changement de page repart du haut : React Router ne réinitialise pas
    // le défilement seul, et l'état du fond fixe (flou/zoom/parallaxe) en dépend.
    useEffect(() => {
        window.scrollTo({top: 0, left: 0, behavior: "instant"});
    }, [location.pathname]);

    // Driver de défilement global : publie les mesures brutes (--scroll-position,
    // --page-height) sur l'élément racine, dont tout le système de variables CSS
    // dérive ses facteurs (--scroll-factor, flou/zoom, parallaxe du héros…). Monté au
    // niveau du Layout pour rester actif sur toutes les pages, fond du héros compris.
    useEffect(() => {
        const root = document.documentElement;
        let animationFrame = 0;

        /**
         * Publie la hauteur de page (nombre sans unité, px sous-entendu).
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

        window.addEventListener("scroll", requestUpdate, {passive: true});
        window.addEventListener("resize", remeasure);

        return () => {
            window.cancelAnimationFrame(animationFrame);
            resizeObserver.disconnect();
            window.removeEventListener("scroll", requestUpdate);
            window.removeEventListener("resize", remeasure);
        };
    }, []);

    // useLayoutEffect : l'indicateur est positionné avant la peinture, évitant
    // qu'il apparaisse sur toute la largeur le temps d'un rendu à l'ouverture.
    useLayoutEffect(() => {
        const navigation = navRef.current;

        if (!navigation) {
            return undefined;
        }

        /**
         * Place immédiatement l'indicateur sur le lien actif.
         * @returns {void} Aucune valeur de retour.
         */
        function alignNavIndicator() {
            // Un redimensionnement ne doit pas interrompre l'animation en deux temps.
            if (isNavIndicatorAnimatingRef.current) {
                return;
            }

            // À défaut de lien actif (ex. page d'accueil), on cadre l'indicateur
            // sur le premier lien plutôt que de le laisser couvrir toute la barre.
            const activeLink =
                navigation.querySelector("a.active") ||
                navigation.querySelector("a");

            if (!activeLink) {
                return;
            }

            const navigationBounds = navigation.getBoundingClientRect();
            const activeLinkBounds = activeLink.getBoundingClientRect();
            const nextIndicator = {
                left: activeLinkBounds.left - navigationBounds.left,
                right: navigationBounds.right - activeLinkBounds.right,
                initialized: true,
            };

            navIndicatorRef.current = nextIndicator;
            setNavIndicator({
                left: nextIndicator.left,
                right: nextIndicator.right,
            });
        }

        /**
         * Étire la barre jusqu'au nouveau lien, puis la resserre sous celui-ci.
         * @returns {void} Aucune valeur de retour.
         */
        function animateNavIndicator() {
            // À défaut de lien actif (ex. page d'accueil), on cadre l'indicateur
            // sur le premier lien plutôt que de le laisser couvrir toute la barre.
            const activeLink =
                navigation.querySelector("a.active") ||
                navigation.querySelector("a");

            if (!activeLink) {
                return;
            }

            const navigationBounds = navigation.getBoundingClientRect();
            const activeLinkBounds = activeLink.getBoundingClientRect();
            const targetIndicator = {
                left: activeLinkBounds.left - navigationBounds.left,
                right: navigationBounds.right - activeLinkBounds.right,
                initialized: true,
            };
            const currentIndicator = navIndicatorRef.current;

            // Au premier affichage, la barre apparaît directement sous le lien actif.
            if (!currentIndicator.initialized) {
                navIndicatorRef.current = targetIndicator;
                setNavIndicator({
                    left: targetIndicator.left,
                    right: targetIndicator.right,
                });
                return;
            }

            const movesLeft = targetIndicator.left < currentIndicator.left;

            // Un bord reste fixe pendant que l'autre rejoint le nouvel élément.
            const stretchedIndicator = movesLeft
                ? {
                    left: targetIndicator.left,
                    right: currentIndicator.right,
                    initialized: true,
                }
                : {
                    left: currentIndicator.left,
                    right: targetIndicator.right,
                    initialized: true,
                };

            window.clearTimeout(navAnimationTimerRef.current);
            isNavIndicatorAnimatingRef.current = true;
            navIndicatorRef.current = stretchedIndicator;
            setNavIndicator({
                left: stretchedIndicator.left,
                right: stretchedIndicator.right,
            });

            // Le bord opposé se referme ensuite sur la largeur exacte du lien choisi.
            navAnimationTimerRef.current = window.setTimeout(() => {
                isNavIndicatorAnimatingRef.current = false;
                navIndicatorRef.current = targetIndicator;
                setNavIndicator({
                    left: targetIndicator.left,
                    right: targetIndicator.right,
                });
            }, 320);
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
        <HeroBackgroundProvider>
            <div className="app-shell">
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
                        <NavLink to="/prestations" onClick={closeMenu}>
                            Prestations
                        </NavLink>
                        <NavLink to="/negoce-auto" onClick={closeMenu}>
                            Négoce auto
                        </NavLink>
                        <NavLink to="/galerie" onClick={closeMenu}>
                            Galerie
                        </NavLink>
                        <NavLink to="/tarifs" onClick={closeMenu}>
                            Tarifs
                        </NavLink>
                        <NavLink to="/a-propos" onClick={closeMenu}>
                            À propos
                        </NavLink>
                        <NavLink to="/rendez-vous" onClick={closeMenu}>
                            Contact
                        </NavLink>
                    </nav>
                    <div className="header-actions">
                        <a className="header-phone" href="tel:+33636372210">
                            06 36 37 22 10
                        </a>
                        <ButtonLink size="small" to="/rendez-vous">
                            Prendre RDV
                        </ButtonLink>
                    </div>
                </header>
                <HeroBackground />
                <main>
                    {/* La clé de route relance l'animation d'entrée à chaque navigation. */}
                    <div className="page-transition" key={location.pathname}>
                        <Outlet />
                    </div>
                </main>
                <footer className="site-footer">
                    <div className="footer-grid container">
                        <div className="footer-about">
                            <Brand footer />
                            <p>
                                Le soin, la passion, l’excellence pour chaque voiture.
                                Detailing, négoce de véhicules d’occasion et pièces
                                automobiles.
                            </p>
                            <small>
                                SIRET 105 175 756 · Ouverture officielle · 6 juillet 2026
                            </small>
                        </div>
                        <div>
                            <h3>Navigation</h3>
                            <Link to="/prestations">Prestations</Link>
                            <Link to="/negoce-auto">Négoce auto</Link>
                            <Link to="/vehicules">Véhicules</Link>
                            <Link to="/pieces-automobiles">Pièces automobiles</Link>
                            <Link to="/galerie">Galerie</Link>
                            <Link to="/tarifs">Tarifs</Link>
                            <Link to="/a-propos">À propos</Link>
                            <Link to="/rendez-vous">Contact & rendez-vous</Link>
                        </div>
                        <div>
                            <h3>Contact</h3>
                            <a href="tel:+33636372210">06 36 37 22 10</a>
                            <a href="mailto:jammesmeca.auto@gmail.com">
                                jammesmeca.auto@gmail.com
                            </a>
                            <span>@nostalgia_auto_galery</span>
                            <span>Parignargues · Gard (30)</span>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        © 2026 Nostalgia Auto Gallery — Corentin Jammes.
                    </div>
                </footer>
            </div>
        </HeroBackgroundProvider>
    );
}
