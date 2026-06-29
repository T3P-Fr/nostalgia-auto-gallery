/*
 * LeadForms.jsx — Sections de SAISIE du parcours de réservation, hors logique métier :
 *   - ContactPanel   : contact commun + adresse propre au besoin ;
 *   - DelaiRadios    : échelle de délai/urgence réutilisable (4 boutons radio) ;
 *   - ProjetSection  : champs du projet achat/vente ;
 *   - PiecesSection  : champs de la recherche de pièces.
 *
 * Toutes pilotent l'unique objet `form` du parent via un seul callback `onUpdate`,
 * pour ne pas multiplier les props par champ.
 */

import { AlertTriangle } from "lucide-react";
import { delaiLevels } from "../../utils/bookingHelpers.js";
import BookPanel from "./BookPanel.jsx";

/**
 * Colonne contact : contact commun (nom, téléphone, email) empilé, puis les champs
 * d'adresse propres au besoin (adresse d'intervention complète pour le lavage).
 * @param {object} props Propriétés du panneau.
 * @param {object} props.form Valeurs courantes du formulaire.
 * @param {boolean} props.isLavage Vrai si le besoin « lavage » est actif (adresse complète).
 * @param {(field: string, value: string) => void} props.onUpdate Met à jour un champ.
 * @returns {JSX.Element} Le panneau contact + adresse.
 */
export function ContactPanel({ form, isLavage, onUpdate }) {
    return (
        <BookPanel
            id="panel-coordonnees"
            step={1}
            title="Vos coordonnées"
            aside="Réponse sous 24 h, sans engagement."
        >
            <div className="coord-grid">
                {/* Contact commun, en colonne (un champ par ligne). */}
                <input className="field-full" required value={form.name} onChange={(event) => onUpdate("name", event.target.value)} placeholder="Nom & prénom *" />
                <input className="field-full" required value={form.phone} onChange={(event) => onUpdate("phone", event.target.value)} placeholder="Téléphone *" inputMode="tel" />
                <input className="field-full" value={form.email} onChange={(event) => onUpdate("email", event.target.value)} placeholder="Email" type="email" />
                {/* Adresse, sous le contact : propre au besoin. */}
                {isLavage ? (
                    <>
                        <input className="field-full" value={form.address} onChange={(event) => onUpdate("address", event.target.value)} placeholder="Adresse d’intervention" />
                        <input className="field-third" value={form.postalCode} onChange={(event) => onUpdate("postalCode", event.target.value)} placeholder="Code postal" inputMode="numeric" />
                        <input className="field-twothird" value={form.city} onChange={(event) => onUpdate("city", event.target.value)} placeholder="Ville" />
                    </>
                ) : (
                    <input className="field-full" value={form.city} onChange={(event) => onUpdate("city", event.target.value)} placeholder="Ville" />
                )}
            </div>
            {/* Mention discrète (lavage) : les utilitaires d'entreprise sont sur devis. */}
            {isLavage && (
                <p className="coord-note">
                    <AlertTriangle className="coord-note__icon" aria-hidden="true" />
                    Les véhicules type utilitaires d’entreprise sont sur devis uniquement.
                </p>
            )}
        </BookPanel>
    );
}

/**
 * Groupe de vrais boutons radio pour l'échelle de délai (4 niveaux), partagé
 * entre le délai du projet et l'urgence des pièces. 4 colonnes desktop, 2 mobile.
 * @param {object} props Propriétés du groupe.
 * @param {string} props.field Champ du formulaire à piloter (delai / urgence).
 * @param {string} props.legend Intitulé affiché au-dessus du groupe.
 * @param {string} props.value Valeur sélectionnée du champ.
 * @param {(field: string, value: string) => void} props.onUpdate Met à jour le champ.
 * @returns {JSX.Element} Le groupe radio.
 */
export function DelaiRadios({ field, legend, value, onUpdate }) {
    return (
        <fieldset className="full radio-field">
            <legend className="radio-field__label">{legend}</legend>
            <div className="radio-group">
                {delaiLevels.map((level) => (
                    <label key={level} className="radio-group__btn">
                        <input
                            type="radio"
                            name={field}
                            value={level}
                            checked={value === level}
                            onChange={() => onUpdate(field, level)}
                        />
                        <span>{level}</span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

/**
 * Section « projet véhicule » (achat/vente) : bascule J'achète/Je vends puis champs
 * propres au besoin en 50/50. Les libellés s'adaptent au sens (achat vs vente).
 * @param {object} props Propriétés du panneau.
 * @param {object} props.form Valeurs courantes du formulaire.
 * @param {(field: string, value: string) => void} props.onUpdate Met à jour un champ.
 * @returns {JSX.Element} Le panneau du projet achat/vente.
 */
export function ProjetSection({ form, onUpdate }) {
    const isSale = form.projet === "vente";
    return (
        <BookPanel
            step={2}
            title="Votre projet véhicule"
            aside="Achat ou vente, je m’occupe de tout."
        >
            {/* Bascule J'achète / Je vends. */}
            <div className="need-toggle">
                {[
                    { key: "achat", label: "J’achète" },
                    { key: "vente", label: "Je vends" },
                ].map((choice) => (
                    <button
                        type="button"
                        key={choice.key}
                        aria-pressed={form.projet === choice.key}
                        className={`need-toggle__btn${form.projet === choice.key ? " is-selected" : ""}`}
                        onClick={() => onUpdate("projet", choice.key)}
                    >
                        {choice.label}
                    </button>
                ))}
            </div>

            <div className="fields-2col">
                <input className="full" value={form.vehicle} onChange={(event) => onUpdate("vehicle", event.target.value)} placeholder={isSale ? "Véhicule à vendre (marque, modèle)" : "Véhicule recherché (marque, modèle)"} />
                <input value={form.annee} onChange={(event) => onUpdate("annee", event.target.value)} placeholder="Année" inputMode="numeric" />
                <input value={form.modele} onChange={(event) => onUpdate("modele", event.target.value)} placeholder="Motorisation / finition" />
                <input value={form.budget} onChange={(event) => onUpdate("budget", event.target.value)} placeholder="Budget" />
                <input value={form.etat} onChange={(event) => onUpdate("etat", event.target.value)} placeholder={isSale ? "État du véhicule" : "État souhaité"} />
                <DelaiRadios field="delai" legend="Délai du projet" value={form.delai} onUpdate={onUpdate} />
            </div>
        </BookPanel>
    );
}

/**
 * Section « recherche de pièces » : champs propres au besoin en 50/50.
 * @param {object} props Propriétés du panneau.
 * @param {object} props.form Valeurs courantes du formulaire.
 * @param {(field: string, value: string) => void} props.onUpdate Met à jour un champ.
 * @returns {JSX.Element} Le panneau de recherche de pièces.
 */
export function PiecesSection({ form, onUpdate }) {
    return (
        <BookPanel
            step={2}
            title="Votre recherche de pièces"
            aside="Dites-moi ce qu’il vous faut, je cherche."
        >
            <div className="fields-2col">
                <input className="full" value={form.vehicle} onChange={(event) => onUpdate("vehicle", event.target.value)} placeholder="Véhicule concerné (marque, modèle, année)" />
                <input value={form.piece} onChange={(event) => onUpdate("piece", event.target.value)} placeholder="Pièce recherchée" />
                <input value={form.reference} onChange={(event) => onUpdate("reference", event.target.value)} placeholder="Référence (si connue)" />
                <DelaiRadios field="urgence" legend="Niveau d’urgence" value={form.urgence} onUpdate={onUpdate} />
            </div>
        </BookPanel>
    );
}
