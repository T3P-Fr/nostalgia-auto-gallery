import {Mail, MapPin, Phone} from "lucide-react";
import {useEffect, useMemo, useState} from "react";
import {useSearchParams} from "react-router-dom";
import {PageHero, ZonePanel} from "../components/Ui.jsx";
import BookPanel from "../components/booking/BookPanel.jsx";
import FormulaCategory from "../components/booking/FormulaCategory.jsx";
import {ContactPanel, PiecesSection, ProjetSection} from "../components/booking/LeadForms.jsx";
import NeedTabs from "../components/booking/NeedTabs.jsx";
import ResumePanel from "../components/booking/ResumePanel.jsx";
import {SlotModal, SlotNoticeModal} from "../components/booking/SlotModal.jsx";
import SuccessState from "../components/booking/SuccessState.jsx";
import {
    detailingOptions,
    formulaCategories,
    formulaLevels,
    pages,
    site,
} from "../data.js";
import {
    buildCalendar,
    canStartAt,
    computePricing,
    emptyFormula,
    formatDuration,
    getMecaOfferedLevel,
    initialForm,
    maxComboDiscount,
    mecaCategory,
    minutesToTime,
    needKeys,
    parseDurationMinutes,
    slotToMinutes,
    washCategories,
} from "../utils/bookingHelpers.js";

/*
 * Page de rendez-vous : contact, zone d'intervention et parcours complet de réservation.
 *
 * Ce composant ne porte plus que l'ORCHESTRATION — état, effets, calculs dérivés et
 * handlers — puis assemble des composants présentationnels (cf. components/booking/*)
 * et des helpers purs (cf. utils/bookingHelpers.js). Le parcours « lavage » se fait en
 * cinq étapes : 1. coordonnées, 2. lavages, 3. révision, 4. options, 5. date & créneau.
 * @returns {JSX.Element} La page de rendez-vous.
 */
export default function BookingPage() {
    // Besoins cochés (mode radio : un seul actif). Le lavage est le seul à requérir
    // un créneau ; il est actif par défaut au chargement.
    const [besoins, setBesoins] = useState({
        lavage: true,
        "achat-vente": false,
        pieces: false,
    });
    const [searchParams] = useSearchParams();
    const [visibleMonth, setVisibleMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [slots, setSlots] = useState([]);
    const [formula, setFormula] = useState(emptyFormula);
    const [options, setOptions] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [feedback, setFeedback] = useState("");
    const [createdAppointment, setCreatedAppointment] = useState(null);
    // Demande sans créneau confirmée (achat/vente ou pièces) : écran de remerciement.
    const [createdLead, setCreatedLead] = useState(null);
    // Pop-up affichée quand un changement de formule invalide le créneau déjà choisi.
    const [slotNotice, setSlotNotice] = useState(false);
    // Popup de sélection du créneau (ouvert via le bouton « Date & créneau »).
    const [slotModalOpen, setSlotModalOpen] = useState(false);
    const calendarCells = useMemo(() => buildCalendar(visibleMonth), [visibleMonth]);

    // Demande envoyée (rendez-vous ou lead) : on remonte en haut en douceur pour que
    // l'écran de confirmation soit visible sans que l'utilisateur ait à scroller.
    useEffect(() => {
        if (createdAppointment || createdLead) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [createdAppointment, createdLead]);

    // Pré-cochage d'un besoin depuis l'URL : ?besoin=achat-vente|pieces|lavage, ou
    // ?service=… (liens des pages Tarifs/Detailing) qui ciblent forcément un lavage.
    useEffect(() => {
        const requested = searchParams.get("besoin");
        // Sélection exclusive (radio) : on n'active que le besoin demandé.
        if (requested && needKeys.includes(requested)) {
            setBesoins({lavage: false, "achat-vente": false, pieces: false, [requested]: true});
        } else if (searchParams.get("service")) {
            setBesoins({lavage: true, "achat-vente": false, pieces: false});
        }
    }, [searchParams]);

    // Au moins un besoin coché : conditionne l'affichage des coordonnées et l'envoi.
    const hasNeed = besoins.lavage || besoins["achat-vente"] || besoins.pieces;

    // Un « lavage complet » = un intérieur ET un extérieur ; il débloque la remise
    // combinée et rend la méca offerte.
    const isCompleteWash = Boolean(formula.interieur && formula.exterieur);

    // Les options ne sont disponibles qu'avec un lavage (intérieur OU extérieur).
    const hasWash = Boolean(formula.interieur || formula.exterieur);

    // Niveau de méca OFFERT (gratuit) en lavage complet = le plus bas des deux lavages.
    const mecaOfferedLevel = getMecaOfferedLevel(formula, isCompleteWash);

    // Le backend reste la source de vérité des créneaux (anti double réservation).
    useEffect(() => {
        if (!selectedDate) {
            setSlots([]);
            return;
        }
        fetch(`/api/availability?date=${selectedDate}`)
            .then((response) => response.json())
            .then((data) => setSlots(data.slots || []))
            .catch(() => setFeedback("Impossible de charger les créneaux."));
    }, [selectedDate]);

    // Sans lavage sélectionné, options ET révision (méca) ne sont plus disponibles :
    // la méca est un complément qui exige au moins un lavage. On les vide donc.
    useEffect(() => {
        if (!hasWash) {
            setOptions([]);
            setFormula((current) => (current.meca ? {...current, meca: ""} : current));
        }
    }, [hasWash]);

    // Cohérence de la méca selon les lavages :
    // - aucun lavage → méca retirée (non disponible seule) ;
    // - lavage complet → la méca ne peut pas rester sous le niveau offert (on remonte).
    useEffect(() => {
        setFormula((current) => {
            if (!current.interieur && !current.exterieur) {
                return current.meca ? {...current, meca: ""} : current;
            }
            if (current.interieur && current.exterieur && current.meca) {
                const offered =
                    formulaLevels.indexOf(current.interieur) <= formulaLevels.indexOf(current.exterieur)
                        ? current.interieur
                        : current.exterieur;
                if (formulaLevels.indexOf(current.meca) < formulaLevels.indexOf(offered)) {
                    return {...current, meca: offered};
                }
            }
            return current;
        });
    }, [formula.interieur, formula.exterieur]);

    // Total barré, économie et prix de vente, recalculés à chaque choix.
    const pricing = useMemo(
        () => computePricing(formula, options, isCompleteWash),
        [formula, options, isCompleteWash],
    );

    // Résumé lisible de la formule, envoyé comme « prestation » au backend.
    const serviceSummary = useMemo(() => {
        return formulaCategories
            .filter((category) => formula[category.key])
            .map((category) =>
                category.key === "meca" && isCompleteWash
                    ? `${category.label} ${formula.meca} (remisé)`
                    : `${category.label} ${formula[category.key]}`,
            )
            .join(" · ");
    }, [formula, isCompleteWash]);

    const hasFormula = Boolean(formula.interieur || formula.exterieur || formula.meca);

    // Facture détaillée du résumé, REGROUPÉE par thématique (Lavages, Révision,
    // Options). Chaque groupe porte ses lignes (niveau + prix), sa remise éventuelle
    // et un sous-total net — de quoi alimenter l'accordéon du résumé.
    const invoiceGroups = useMemo(() => {
        const groups = [];

        // Groupe LAVAGES : intérieur/extérieur + remise lavage complet.
        const washItems = [];
        let washSubtotal = 0;
        washCategories.forEach((category) => {
            const level = formula[category.key];
            if (level) {
                const price = category.prices[level];
                washSubtotal += price;
                washItems.push({
                    key: category.key,
                    label: `${category.label} ${level}`,
                    value: `${price} €`,
                });
            }
        });
        if (pricing.washEconomy > 0) {
            washSubtotal -= pricing.washEconomy;
            washItems.push({
                key: "wash-economy",
                label: "Remise lavage complet",
                value: `−${pricing.washEconomy} €`,
                discount: true,
            });
        }
        if (washItems.length > 0) {
            groups.push({ key: "lavages", title: "Lavages", items: washItems, total: washSubtotal });
        }

        // Groupe RÉVISION : la méca seule. En lavage complet, on n'offre QUE le
        // niveau offert (mecaEconomy) : une montée en gamme reste donc facturée à
        // hauteur de sa différence. Le prix de ligne est toujours celui du niveau
        // RÉELLEMENT sélectionné, pour rester cohérent avec le total.
        if (mecaCategory && formula.meca) {
            // Ligne 1 : la méca à son prix plein. Ligne 2 (si lavage complet) : la
            // remise du palier (−X %), déduite. Le sous-total = prix net.
            const revisionItems = [
                {
                    key: "meca",
                    label: `Révision ${formula.meca}`,
                    value: `${mecaCategory.prices[formula.meca]} €`,
                },
            ];
            if (pricing.mecaEconomy > 0) {
                const rate = Math.round((mecaCategory.tierDiscounts[formula.meca] || 0) * 100);
                revisionItems.push({
                    key: "meca-economy",
                    label: `Remise révision −${rate} %`,
                    value: `−${pricing.mecaEconomy} €`,
                    discount: true,
                });
            }
            groups.push({
                key: "revision",
                title: "Révision",
                items: revisionItems,
                total: pricing.mecaNet,
            });
        }

        // Groupe OPTIONS : une ligne par option + remise progressive.
        const optionItems = [];
        options.forEach((label) => {
            const option = detailingOptions.find((entry) => entry.label === label);
            if (option) {
                optionItems.push({ key: `opt-${label}`, label, value: `+${option.price} €` });
            }
        });
        if (pricing.optionsDiscount > 0) {
            optionItems.push({
                key: "opt-discount",
                label: `Remise options −${Math.round(pricing.optionsRate * 100)} %`,
                value: `−${pricing.optionsDiscount} €`,
                discount: true,
            });
        }
        if (optionItems.length > 0) {
            groups.push({
                key: "options",
                title: "Options",
                items: optionItems,
                total: pricing.optionsNet,
            });
        }

        return groups;
    }, [formula, options, isCompleteWash, pricing]);

    // Durée estimée du rendez-vous = somme des durées des formules choisies.
    const durationMinutes = useMemo(() => {
        return formulaCategories.reduce((total, category) => {
            const level = formula[category.key];
            return level ? total + parseDurationMinutes(category.durations[level]) : total;
        }, 0);
    }, [formula]);

    // Plage horaire affichée dans le résumé : « début — fin », la fin (début + durée)
    // étant arrondie à l'heure supérieure. Sans durée connue, on n'affiche que le début.
    const slotRange = useMemo(() => {
        if (!selectedSlot) {
            return "—";
        }
        if (durationMinutes <= 0) {
            return selectedSlot;
        }
        const endMinutes = slotToMinutes(selectedSlot) + durationMinutes;
        const endRoundedToHour = Math.ceil(endMinutes / 60) * 60;
        return `${selectedSlot} — ${minutesToTime(endRoundedToHour)}`;
    }, [selectedSlot, durationMinutes]);

    // Si un changement de formule (durée) rend le créneau déjà choisi impossible
    // (débordement de journée ou chevauchement), on le remet à zéro et on invite,
    // via une pop-up, à en choisir un nouveau parmi les créneaux désormais compatibles.
    useEffect(() => {
        if (selectedSlot && !canStartAt(selectedSlot, slots, durationMinutes)) {
            setSelectedSlot("");
            setSlotNotice(true);
        }
    }, [durationMinutes, slots, selectedSlot]);

    /*
     * Met à jour un champ du formulaire sans modifier les autres.
     * @param {string} field Nom du champ.
     * @param {string} value Nouvelle valeur.
     * @returns {void} Aucune valeur de retour.
     */
    function updateField(field, value) {
        setForm((current) => ({...current, [field]: value}));
    }

    /*
     * Sélectionne un niveau pour une catégorie ; re-cliquer le même le désélectionne.
     * La méca est gérée automatiquement quand un lavage complet est pris (cf. effet).
     * @param {string} categoryKey Clé de la catégorie (interieur/exterieur/meca).
     * @param {string} level Niveau cliqué (Platine/Premium/Deluxe).
     * @returns {void} Aucune valeur de retour.
     */
    function toggleFormula(categoryKey, level) {
        setFormula((current) => ({
            ...current,
            [categoryKey]: current[categoryKey] === level ? "" : level,
        }));
    }

    /*
     * Coche/décoche une option (impacte le total).
     * @param {string} label Libellé de l'option.
     * @returns {void} Aucune valeur de retour.
     */
    function toggleOption(label) {
        setOptions((current) =>
            current.includes(label)
                ? current.filter((entry) => entry !== label)
                : [...current, label],
        );
    }

    /*
     * Réinitialise tout le parcours après une demande envoyée.
     * @returns {void} Aucune valeur de retour.
     */
    function resetBooking() {
        setCreatedAppointment(null);
        setCreatedLead(null);
        setBesoins({lavage: true, "achat-vente": false, pieces: false});
        setSelectedDate("");
        setSelectedSlot("");
        setForm(initialForm);
        setFormula(emptyFormula);
        setOptions([]);
        setFeedback("");
    }

    /*
     * Sélectionne un besoin en mode RADIO : un seul actif à la fois. Re-cliquer
     * l'onglet actif le désactive. Nettoie l'erreur résiduelle.
     * @param {string} key Clé du besoin (lavage/achat-vente/pieces).
     * @returns {void} Aucune valeur de retour.
     */
    function toggleBesoin(key) {
        setBesoins((current) => ({
            lavage: false,
            "achat-vente": false,
            pieces: false,
            // Re-clic sur l'actif = désélection ; sinon on active uniquement celui-ci.
            [key]: !current[key],
        }));
        setFeedback("");
    }

    /*
     * Construit un résumé texte des besoins HORS lavage (projet, pièces) pour les
     * joindre au message lorsqu'un rendez-vous lavage porte aussi ces demandes.
     * @returns {string} Les blocs de détails non vides, un par ligne.
     */
    function extraNeedsMessage() {
        const blocks = [];
        if (besoins["achat-vente"]) {
            const details = [
                form.projet === "vente" ? "Vente" : "Achat",
                form.vehicle,
                form.annee,
                form.modele,
                form.budget && `budget ${form.budget}`,
                form.etat,
                form.delai,
            ].filter(Boolean).join(", ");
            blocks.push(`Projet véhicule : ${details}`);
        }
        if (besoins.pieces) {
            const details = [
                form.vehicle,
                form.piece,
                form.reference && `réf. ${form.reference}`,
                form.urgence,
            ].filter(Boolean).join(", ");
            blocks.push(`Recherche pièces : ${details}`);
        }
        return blocks.join("\n");
    }

    /*
     * Envoie une demande SANS créneau (lavage non coché) : un ou plusieurs besoins
     * parmi achat/vente et pièces, vers l'endpoint dédié.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function postRequest() {
        const needsList = ["achat-vente", "pieces"].filter((key) => besoins[key]);
        try {
            const response = await fetch("/api/requests", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                // Le backend ne retient que les champs pertinents selon les besoins.
                body: JSON.stringify({...form, needs: needsList, type: needsList[0]}),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setCreatedLead(data);
        } catch (error) {
            setFeedback(error.message || "La demande n’a pas pu être envoyée.");
        }
    }

    /*
     * Envoie un rendez-vous (lavage coché) : la prestation et le créneau, en
     * joignant au message les éventuels autres besoins (projet, pièces).
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function postAppointment() {
        // Message = attentes du client + options choisies + autres besoins joints.
        const message = [
            form.message,
            options.length ? `Options : ${options.join(", ")}` : "",
            extraNeedsMessage(),
        ].filter(Boolean).join("\n").trim();

        try {
            const response = await fetch("/api/appointments", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    ...form,
                    // La « prestation » résume la formule + le prix de vente.
                    service: `${serviceSummary} — ${pricing.sale} €`,
                    message,
                    date: selectedDate,
                    slot: selectedSlot,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setCreatedAppointment(data);
        } catch (error) {
            setFeedback(error.message || "La demande n’a pas pu être envoyée.");
        }
    }

    /*
     * Aiguille l'envoi unique : si le lavage est coché, on crée un rendez-vous
     * (avec créneau) qui porte aussi les autres besoins ; sinon une demande à rappeler.
     * @param {React.FormEvent<HTMLFormElement>} event Soumission du formulaire.
     * @returns {void} Aucune valeur de retour.
     */
    function handleSubmit(event) {
        event.preventDefault();
        setFeedback("");
        if (besoins.lavage) {
            postAppointment();
        } else {
            postRequest();
        }
    }

    /*
     * Sélectionne une date dans le calendrier et réinitialise le créneau associé.
     * @param {string} iso Date au format ISO.
     * @returns {void} Aucune valeur de retour.
     */
    function selectDate(iso) {
        setSelectedDate(iso);
        setSelectedSlot("");
    }

    /*
     * Traite un clic sur un créneau incompatible : on réinitialise et on avertit.
     * @returns {void} Aucune valeur de retour.
     */
    function handleInvalidSlot() {
        setSelectedSlot("");
        setSlotNotice(true);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const canGoBack =
        visibleMonth.getFullYear() > today.getFullYear() ||
        visibleMonth.getMonth() > today.getMonth();

    // Le lavage exige date + créneau + formule ; les autres besoins non.
    const lavageReady = !besoins.lavage || (selectedDate && selectedSlot && hasFormula);
    const canSubmit =
        hasNeed && Boolean(form.name.trim()) && Boolean(form.phone.trim()) && Boolean(lavageReady);
    // Libellé d'envoi : un rendez-vous si lavage coché, sinon une demande à rappeler.
    const submitLabel = besoins.lavage ? "Demander ce rendez-vous" : "Envoyer ma demande";

    // Date sélectionnée formatée pour le bouton déclencheur de l'agenda.
    const agendaDateLabel = selectedDate
        ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString("fr-FR")
        : "";

    // Carte résumé partagée entre l'emplacement desktop et l'emplacement mobile.
    const resume = (
        <ResumePanel
            hasFormula={hasFormula}
            selectedDate={selectedDate}
            slotRange={slotRange}
            pricing={pricing}
            groups={invoiceGroups}
        />
    );

    return (
        <>
            <PageHero {...pages.booking.hero} />

            <section className="booking-layout container">
                {/* Calque givré UNIQUE englobant tabs + carte : un seul backdrop-filter
                    pour éviter la jointure entre deux flous calculés séparément. */}
                <div className="booking-frost">
                    {/* Onglets de besoins (multi-sélection radio). Masqués une fois la
                        demande envoyée. */}
                    {!createdAppointment && !createdLead && (
                        <NeedTabs besoins={besoins} onToggle={toggleBesoin} />
                    )}

                    <div className="card booking-card">
                        {createdAppointment || createdLead ? (
                            <SuccessState
                                appointment={createdAppointment}
                                lead={createdLead}
                                onReset={resetBooking}
                            />
                        ) : (
                            <form className="booking-form" onSubmit={handleSubmit}>
                                {/* Colonne gauche : contact + adresse, puis résumé. */}
                                <div className="calendar-panel">
                                    {hasNeed && (
                                        <ContactPanel
                                            form={form}
                                            isLavage={besoins.lavage}
                                            onUpdate={updateField}
                                        />
                                    )}

                                    {/* Résumé (carte rouge) : uniquement pour le lavage. */}
                                    {besoins.lavage && (
                                        <div className="montant-slot montant-slot--desktop">{resume}</div>
                                    )}
                                </div>

                                {/* Colonne droite : champs propres au besoin choisi. */}
                                <div className="details-panel">
                                    {/* Aucun besoin coché : invite à choisir un onglet. */}
                                    {!hasNeed && (
                                        <div className="details-placeholder">
                                            Choisissez un besoin ci-dessus pour afficher le formulaire.
                                        </div>
                                    )}

                                    {/* Lavage : lavages → révision → options → date & créneau. */}
                                    {besoins.lavage && (
                                        <>
                                            {/* Lavages : Intérieur/Extérieur + prix. L'incitation
                                                (statique, atténuée) est posée à droite du titre. */}
                                            <BookPanel
                                                id="panel-lavages"
                                                step={2}
                                                title="Lavages"
                                                aside={`Économisez jusqu’à ${maxComboDiscount} € pour un lavage complet`}
                                            >
                                                <div className="formula-grid">
                                                    {washCategories.map((category) => (
                                                        <FormulaCategory
                                                            key={category.key}
                                                            category={category}
                                                            formula={formula}
                                                            hasWash={hasWash}
                                                            isCompleteWash={isCompleteWash}
                                                            mecaOfferedLevel={mecaOfferedLevel}
                                                            onToggle={toggleFormula}
                                                        />
                                                    ))}
                                                </div>
                                            </BookPanel>

                                            {/* Révision de base (méca) : grille toujours visible,
                                                grisée tant qu'aucun lavage n'est sélectionné. */}
                                            {mecaCategory && (
                                                <BookPanel
                                                    id="panel-revision"
                                                    step={3}
                                                    title="Révision de base"
                                                    aside="Jusqu’à −70 % avec un lavage complet."
                                                >
                                                    <div className={`formula-grid${hasWash ? "" : " is-disabled"}`}>
                                                        <FormulaCategory
                                                            category={mecaCategory}
                                                            formula={formula}
                                                            hasWash={hasWash}
                                                            isCompleteWash={isCompleteWash}
                                                            mecaOfferedLevel={mecaOfferedLevel}
                                                            onToggle={toggleFormula}
                                                        />
                                                    </div>
                                                </BookPanel>
                                            )}

                                            {/* Options : cases à cocher, actives seulement avec un lavage. */}
                                            <BookPanel
                                                id="panel-options"
                                                step={4}
                                                title="Options"
                                                aside="Cumulez-les : la remise grandit à chaque ajout."
                                            >
                                                <div className="formula-options">
                                                    {detailingOptions.map((option) => (
                                                        <label
                                                            className={`formula-option${hasWash ? "" : " is-disabled"}`}
                                                            key={option.label}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                disabled={!hasWash}
                                                                checked={options.includes(option.label)}
                                                                onChange={() => toggleOption(option.label)}
                                                            />
                                                            <span>{option.label}</span>
                                                            <strong>+{option.price} €</strong>
                                                        </label>
                                                    ))}
                                                </div>
                                            </BookPanel>

                                            {/* Date & créneau : ouvre le popup agenda. */}
                                            <BookPanel
                                                id="panel-date"
                                                step={5}
                                                title="Date & créneau"
                                                aside={
                                                    durationMinutes > 0
                                                        ? `Durée estimée : ${formatDuration(durationMinutes)}`
                                                        : "Je me déplace, vous n’avez rien à préparer."
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    className="button button--secondary button--block"
                                                    onClick={() => setSlotModalOpen(true)}
                                                >
                                                    {selectedDate && selectedSlot
                                                        ? `${agendaDateLabel} · ${slotRange}`
                                                        : "Choisir la date et le créneau"}
                                                </button>
                                            </BookPanel>
                                        </>
                                    )}

                                    {/* Projet achat/vente (si coché). */}
                                    {besoins["achat-vente"] && (
                                        <ProjetSection form={form} onUpdate={updateField} />
                                    )}

                                    {/* Recherche de pièces (si coché). */}
                                    {besoins.pieces && <PiecesSection form={form} onUpdate={updateField} />}

                                    {/* Message libre + envoi unique, dès qu'au moins un besoin est coché.
                                        Le message devient un panneau numéroté : étape 6 en lavage
                                        (après date & créneau), étape 3 sinon (après le besoin). */}
                                    {hasNeed && (
                                        <>
                                            <BookPanel
                                                step={besoins.lavage ? 6 : 3}
                                                title="Votre message"
                                                aside="Précisions, attentes : tout ce qui peut m’aider."
                                            >
                                                <textarea value={form.message} onChange={(event) => updateField("message", event.target.value)} placeholder="Écrivez-ci." rows="3" />
                                            </BookPanel>
                                            <div className="lead-submit">
                                                {feedback && <p className="form-error">{feedback}</p>}
                                                <button className="button button--block" type="submit" disabled={!canSubmit}>
                                                    {submitLabel}
                                                </button>
                                                <small>Demande sans engagement. Je vous recontacte pour confirmer.</small>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Résumé (carte rouge) en bas, sticky (mobile) : lavage uniquement. */}
                                {besoins.lavage && (
                                    <div className="montant-slot montant-slot--mobile">{resume}</div>
                                )}
                            </form>
                        )}
                    </div>
                </div>

                <aside className="card contact-card">
                    <span className="overline">Contact direct</span>
                    <a href={site.phoneHref}>
                        <Phone />
                        <span><small>Téléphone</small>{site.phone}</span>
                    </a>
                    <a href={site.emailHref}>
                        <Mail />
                        <span><small>Email</small>{site.email}</span>
                    </a>
                    <div>
                        <MapPin />
                        <span><small>Atelier mobile</small>{site.location}</span>
                    </div>
                    <p>Sur rendez-vous<br />Service itinérant</p>
                </aside>
            </section>

            {/* Popup de sélection du créneau (lavage). */}
            {slotModalOpen && (
                <SlotModal
                    calendarCells={calendarCells}
                    visibleMonth={visibleMonth}
                    canGoBack={canGoBack}
                    today={today}
                    selectedDate={selectedDate}
                    selectedSlot={selectedSlot}
                    slots={slots}
                    durationMinutes={durationMinutes}
                    onMonthChange={setVisibleMonth}
                    onSelectDate={selectDate}
                    onSelectSlot={setSelectedSlot}
                    onInvalidSlot={handleInvalidSlot}
                    onClose={() => setSlotModalOpen(false)}
                />
            )}

            {/* Pop-up : la formule a changé et le créneau choisi ne rentre plus. */}
            {slotNotice && (
                <SlotNoticeModal
                    onChooseSlot={() => {
                        setSlotNotice(false);
                        setSlotModalOpen(true);
                    }}
                />
            )}

            <ZonePanel />
        </>
    );
}
