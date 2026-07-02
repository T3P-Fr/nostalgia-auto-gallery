import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { icons, site } from "../data.js";
import { useEmail } from "../utils/useEmail.js";
import { Brand } from "./Brand.jsx";

/**
 * Pied de page commun : présentation, navigation secondaire et coordonnées.
 *
 * Les textes et coordonnées proviennent de content.json (via `site`) ; seuls les
 * liens de navigation restent ici, étant structurels.
 * @returns {JSX.Element} Le pied de page du site.
 */
export function FooterPage() {
    const email = useEmail();

    return (
        <footer className="site-footer bluredBackground--card">
            <div className="footer-grid container">
                <div>
                    <h3>Navigation</h3>
                    <Link to="/">Accueil</Link>
                    <Link to="/negoce">Négoce</Link>
                    <Link to="/detailing">Detailing</Link>
                    <Link to="/realisations">Réalisations</Link>
                    <Link to="/contact">Contact</Link>
                    <Link to="/informations">Informations</Link>
                </div>
                <div>
                    <h3>Contact</h3>
                    <a className="footer-social" href={site.phoneHref}>
                        <Phone size={16} aria-hidden="true" />
                        {site.phone}
                    </a>
                    {email ? (
                        <a className="footer-social" href={email.href}>
                            <Mail size={16} aria-hidden="true" />
                            {email.address}
                        </a>
                    ) : (
                        <span className="footer-social">
                            <Mail size={16} aria-hidden="true" />
                            Écrire un e-mail
                        </span>
                    )}
                    {site.socials?.map((social) => {
                        const Icon = icons[social.icon];
                        return (
                            <a
                                key={social.label}
                                className="footer-social"
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {Icon ? <Icon size={16} aria-hidden="true" /> : null}
                                {social.label}
                            </a>
                        );
                    })}
                    <span className="footer-social">
                        <MapPin size={16} aria-hidden="true" />
                        {site.location}
                    </span>
                </div>
                <div className="footer-about">
                    <Brand footer />
                    <p>{site.footerTagline}</p>
                    <small>{site.address}</small>
                    <small>SIRET {site.siret}</small>
                </div>
            </div>
            <div className="footer-bottom">{site.copyright}</div>
        </footer>
    );
}
