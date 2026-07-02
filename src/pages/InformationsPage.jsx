import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PageHero, SectionHeading } from "../components/Ui.jsx";
import { pages, site } from "../data.js";

// Contenu centralisé (cf. content.json → pages.informations + pages.legal).
const { hero } = pages.informations;
// Documents légaux, dans l'ordre d'insertion (mentions → confidentialité → conditions).
const documents = Object.entries(pages.legal);

/**
 * Injecte les données d'identité (adresse, SIRET) issues de `site` dans un texte
 * légal, via les marqueurs {address} / {siret}. Source unique : content.json → site.
 * @param {string} text Texte pouvant contenir des marqueurs.
 * @returns {string} Le texte avec les valeurs de `site` substituées.
 */
function fillIdentity(text) {
    return text
        .replaceAll("{address}", site.address)
        .replaceAll("{siret}", site.siret);
}

/**
 * Page Informations : réunit mentions légales, confidentialité et conditions de
 * réservation sur une seule page, chaque document étant une section ancrée.
 * @returns {JSX.Element} La page Informations.
 */
export default function InformationsPage() {
    const location = useLocation();

    // Si l'URL comporte une ancre (#conditions…), on défile vers la section visée.
    // Le Layout repart en haut à chaque navigation ; ce défilement le complète.
    useEffect(() => {
        if (!location.hash) {
            return;
        }
        const target = document.getElementById(location.hash.slice(1));
        if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [location.hash]);

    return (
        <>
            <PageHero {...hero} />

            <section className="container legal-page">
                {documents.map(([slug, doc]) => (
                    <article className="legal-section" id={slug} key={slug}>
                        <SectionHeading overline={doc.eyebrow} title={doc.label} />
                        <p className="legal-section__intro">{doc.intro}</p>
                        {doc.blocks.map((block) => (
                            <div className="legal-block" key={block.title}>
                                <h3>{block.title}</h3>
                                <p>{fillIdentity(block.text)}</p>
                            </div>
                        ))}
                    </article>
                ))}
            </section>
        </>
    );
}
