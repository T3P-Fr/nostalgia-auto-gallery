import { Link } from "react-router-dom";
import { Brand } from "./Brand.jsx";

/**
 * Pied de page commun : présentation, navigation secondaire et coordonnées.
 *
 * Posé au-dessus du fond fixe (z-index dédié côté CSS) pour ne pas être masqué en
 * bas de page.
 * @returns {JSX.Element} Le pied de page du site.
 */
export function FooterPage() {
    return (
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
    );
}
