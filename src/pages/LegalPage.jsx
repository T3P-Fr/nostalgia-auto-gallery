import { PageHero } from "../components/Ui.jsx";
import { pages } from "../data.js";

/**
 * Page légale générique (mentions légales, confidentialité, conditions). Le contenu
 * est sélectionné par `slug` dans content.json → pages.legal.
 * @param {{ slug: string }} props Identifiant du document légal à afficher.
 * @returns {JSX.Element} La page légale demandée.
 */
export default function LegalPage({ slug }) {
    const document = pages.legal[slug];

    return (
        <>
            <PageHero
                image="/assets/hero-night.jpg"
                eyebrow={document.eyebrow}
                title={document.title}
                description={document.intro}
            />

            <section className="container legal-page">
                {document.blocks.map((block) => (
                    <article className="legal-block" key={block.title}>
                        <h2>{block.title}</h2>
                        <p>{block.text}</p>
                    </article>
                ))}
            </section>
        </>
    );
}
