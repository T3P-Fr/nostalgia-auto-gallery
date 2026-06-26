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
                    <Link to="/">Accueil</Link>
                    <Link to="/detailing">Detailing</Link>
                    <Link to="/realisations">Réalisations</Link>
                    <Link to="/a-propos">À propos</Link>
                    <Link to="/contact">Contact et rendez-vous</Link>
                    {/* Activité secondaire : renvoyée vers la section dédiée d'À propos. */}
                    <Link to="/a-propos">{site.secondaryActivity}</Link>
                </div>
                <div>
                    <h3>Contact</h3>
                    <a href={site.phoneHref}>{site.phone}</a>
                    <a href={site.emailHref}>{site.email}</a>
                    <span>{site.social}</span>
                    <span>{site.location}</span>
                </div>
                <div>
                    <h3>Informations</h3>
                    {site.legalLinks.map((link) => (
                        <Link key={link.to} to={link.to}>
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
            <div className="footer-bottom">{site.copyright}</div>
        </footer>
    );
}
