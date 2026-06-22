import { Link } from "react-router-dom";
import { site } from "../data.js";
import { Brand } from "./Brand.jsx";

/**
 * Pied de page commun : présentation, navigation secondaire et coordonnées.
 *
 * Les textes et coordonnées proviennent de content.json (via `site`) ; seuls les
 * liens de navigation restent ici, étant structurels.
 * @returns {JSX.Element} Le pied de page du site.
 */
export function FooterPage() {
    return (
        <footer className="site-footer">
            <div className="footer-grid container">
                <div className="footer-about">
                    <Brand footer />
                    <p>{site.footerTagline}</p>
                    <small>{site.siret}</small>
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
                    <a href={site.phoneHref}>{site.phone}</a>
                    <a href={site.emailHref}>{site.email}</a>
                    <span>{site.social}</span>
                    <span>{site.location}</span>
                </div>
            </div>
            <div className="footer-bottom">{site.copyright}</div>
        </footer>
    );
}
