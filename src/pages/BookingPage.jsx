import {
    Check,
    ChevronLeft,
    ChevronRight,
    Mail,
    MapPin,
    Phone,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHero, ZonePanel } from "../components/Ui.jsx";
import {
    comboDiscounts,
    detailingOptions,
    formulaCategories,
    formulaLevels,
    pages,
    site,
} from "../data.js";

const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

const initialForm = {
    name: "",
    phone: "",
    email: "",
    address: "",
    postalCode: "",
    city: "",
    vehicle: "",
    message: "",
};

// Aucune catégorie sélectionnée au départ (chaîne vide = aucun niveau pris).
const emptyFormula = { interieur: "", exterieur: "", meca: "" };

// Économie maximale en ajoutant le second lavage (remise du plus haut niveau).
const maxComboDiscount = Math.max(...Object.values(comboDiscounts));

// Lavages (Intérieur/Extérieur) et méca séparés : chacun a désormais son cadre.
const washCategories = formulaCategories.filter((category) => category.key !== "meca");
const mecaCategory = formulaCategories.find((category) => category.key === "meca");

/*
 * Plage de travail du prestataire. Sert à invalider un créneau dont la prestation
 * dépasserait l'heure de fermeture. Plage continue 08:00–19:00 : les créneaux
 * horaires (08:00 → 18:00, fournis par le backend) sont tous valides.
 */
const workingPeriods = [
    { start: "08:00", end: "19:00" },
];

/**
 * Convertit une date locale en chaîne ISO sans décalage de fuseau.
 * @param {Date} date Date locale à convertir.
 * @returns {string} Date au format AAAA-MM-JJ.
 */
function toLocalIso(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Construit les cellules du mois, lundi étant le premier jour.
 * @param {Date} monthDate Mois actuellement affiché.
 * @returns {Array<object|null>} Cellules du calendrier.
 */
function buildCalendar(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const leadingEmptyCells = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
        ...Array.from({ length: leadingEmptyCells }, () => null),
        ...Array.from({ length: daysInMonth }, (_, index) => {
            const date = new Date(year, month, index + 1);
            return { date, iso: toLocalIso(date) };
        }),
    ];
}

/**
 * Convertit une durée affichée (« ≈ 1h45 », « ≈ 4h ») en minutes.
 * @param {string} text Durée du palier.
 * @returns {number} Durée en minutes (0 si non reconnue).
 */
function parseDurationMinutes(text) {
    const match = /(\d+)\s*h\s*(\d*)/.exec(text || "");
    if (!match) {
        return 0;
    }
    return Number(match[1]) * 60 + (match[2] ? Number(match[2]) : 0);
}

/**
 * Formate une durée en minutes vers « 4h » ou « 4h15 ».
 * @param {number} minutes Durée en minutes.
 * @returns {string} Durée lisible.
 */
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours}h${String(rest).padStart(2, "0")}` : `${hours}h`;
}

/**
 * Convertit un horaire « HH:MM » en minutes depuis minuit.
 * @param {string} time Horaire du créneau.
 * @returns {number} Minutes depuis minuit.
 */
function slotToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

/**
 * Convertit des minutes depuis minuit en horaire « HH:MM ».
 * @param {number} minutes Minutes depuis minuit.
 * @returns {string} Horaire au format « HH:MM ».
 */
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

/**
 * Heure de fin (en minutes) de la plage de travail à laquelle appartient un créneau.
 * @param {string} time Horaire du créneau « HH:MM ».
 * @returns {number|null} Fin de la plage en minutes, ou null si hors plages de travail.
 */
function periodEndForSlot(time) {
    const minutes = slotToMinutes(time);
    const period = workingPeriods.find(
        (range) => minutes >= slotToMinutes(range.start) && minutes < slotToMinutes(range.end),
    );
    return period ? slotToMinutes(period.end) : null;
}

/**
 * Taux de remise progressif appliqué au SOUS-TOTAL des options : plus le client en
 * cumule, plus la remise grandit (1 → 6 %, 2 → 8 %, 3 → 10 %, toutes → 12 %).
 * @param {number} selectedCount Nombre d'options cochées.
 * @param {number} totalCount Nombre total d'options proposées.
 * @returns {number} Taux de remise (0 à 0.12).
 */
function optionsDiscountRate(selectedCount, totalCount) {
    if (selectedCount === 0) {
        return 0;
    }
    // Toutes les options choisies : remise maximale, quel que soit leur nombre.
    if (selectedCount >= totalCount) {
        return 0.12;
    }
    if (selectedCount === 1) {
        return 0.06;
    }
    if (selectedCount === 2) {
        return 0.08;
    }
    // 3 options ou plus (mais pas toutes).
    return 0.1;
}

/**
 * Liste cumulée et dédoublonnée des prestations incluses pour des catégories données.
 * Cumule les prestations du palier le plus bas jusqu'au niveau choisi de chaque catégorie.
 * @param {Array<object>} categories Catégories à parcourir (ex. lavages, ou méca seule).
 * @param {object} formula État de sélection { interieur, exterieur, meca }.
 * @returns {Array<{ key: string, label: string }>} Prestations triées alphabétiquement.
 */
function collectFeatures(categories, formula) {
    const seen = new Set();
    const list = [];
    categories.forEach((category) => {
        const level = formula[category.key];
        if (!level) {
            return;
        }
        const selectedRank = formulaLevels.indexOf(level);
        formulaLevels.forEach((currentLevel, rank) => {
            if (rank <= selectedRank) {
                category.features[currentLevel].forEach((label) => {
                    if (!seen.has(label)) {
                        seen.add(label);
                        list.push({ key: label, label });
                    }
                });
            }
        });
    });
    return list.sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

/**
 * Panneau d'étape du formulaire de réservation. Classe commune `.panel` ; en-tête avec
 * le numéro + le titre à gauche et, si fourni, un texte atténué (`aside`) à droite.
 * @param {object} props Propriétés du panneau.
 * @param {string} [props.id] Identifiant unique du panneau (ciblage/ancrage).
 * @param {number} [props.step] Numéro d'étape affiché devant le titre.
 * @param {string} props.title Titre de l'étape.
 * @param {React.ReactNode} [props.aside] Texte atténué optionnel, aligné à droite.
 * @param {string} [props.className] Classes additionnelles.
 * @param {React.ReactNode} props.children Contenu du panneau.
 * @returns {JSX.Element} Le panneau d'étape.
 */
function BookPanel({ id, step, title, aside, className = "", children }) {
    return (
        <section id={id} className={`panel ${className}`.trim()}>
            <div className="panel__head">
                <h3>
                    {step != null && <span>{step}.</span>} {title}
                </h3>
                {aside && <span className="panel__aside">{aside}</span>}
            </div>
            {children}
        </section>
    );
}

/**
 * Gère le contact, la zone et le parcours complet de réservation.
 *
 * Parcours en quatre étapes : 1. date, 2. formules (grille de prix à bascule +
 * prestations + options + total), 3. créneau, 4. coordonnées.
 * @returns {JSX.Element} La page de rendez-vous.
 */
export default function BookingPage() {
    const [visibleMonth, setVisibleMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [slots, setSlots] = useState([]);
    const [formula, setFormula] = useState(emptyFormula);
    const [options, setOptions] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [feedback, setFeedback] = useState("");
    const [createdAppointment, setCreatedAppointment] = useState(null);
    // Pop-up affichée quand un changement de formule invalide le créneau déjà choisi.
    const [slotNotice, setSlotNotice] = useState(false);
    const calendarCells = useMemo(() => buildCalendar(visibleMonth), [visibleMonth]);

    // Un « lavage complet » = un intérieur ET un extérieur ; il débloque la remise
    // combinée et rend la méca offerte.
    const isCompleteWash = Boolean(formula.interieur && formula.exterieur);

    // Les options ne sont disponibles qu'avec un lavage (intérieur OU extérieur).
    const hasWash = Boolean(formula.interieur || formula.exterieur);

    // Niveau de méca OFFERT (gratuit) en lavage complet = le plus bas des deux lavages.
    // En dessous de ce niveau, la méca n'est pas sélectionnable (cf. renderCategory).
    const mecaOfferedLevel = isCompleteWash
        ? formulaLevels.indexOf(formula.interieur) <= formulaLevels.indexOf(formula.exterieur)
            ? formula.interieur
            : formula.exterieur
        : null;

    useEffect(() => {
        if (!selectedDate) {
            setSlots([]);
            return;
        }

        // Le backend reste la source de vérité pour éviter les doubles réservations.
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
            setFormula((current) => (current.meca ? { ...current, meca: "" } : current));
        }
    }, [hasWash]);

    // Cohérence de la méca selon les lavages :
    // - aucun lavage → méca retirée (non disponible seule) ;
    // - lavage complet → la méca ne peut pas rester sous le niveau offert (on remonte).
    useEffect(() => {
        setFormula((current) => {
            if (!current.interieur && !current.exterieur) {
                return current.meca ? { ...current, meca: "" } : current;
            }
            if (current.interieur && current.exterieur && current.meca) {
                const offered =
                    formulaLevels.indexOf(current.interieur) <=
                        formulaLevels.indexOf(current.exterieur)
                        ? current.interieur
                        : current.exterieur;
                if (formulaLevels.indexOf(current.meca) < formulaLevels.indexOf(offered)) {
                    return { ...current, meca: offered };
                }
            }
            return current;
        });
    }, [formula.interieur, formula.exterieur]);

    // Total barré, économie et prix de vente, recalculés à chaque choix.
    const pricing = useMemo(() => {
        // Prix des lavages (Intérieur/Extérieur) et de la méca, comptés séparément.
        let washBase = 0;
        let mecaBase = 0;
        formulaCategories.forEach((category) => {
            const level = formula[category.key];
            if (!level) {
                return;
            }
            if (category.key === "meca") {
                // Méca OFFERTE avec un lavage complet : elle ne compte pas dans le total.
                if (!isCompleteWash) {
                    mecaBase += category.prices[level];
                }
                return;
            }
            washBase += category.prices[level];
        });

        // Sous-total des options choisies (la remise progressive s'y applique).
        let optionsBase = 0;
        options.forEach((label) => {
            const option = detailingOptions.find((entry) => entry.label === label);
            if (option) {
                optionsBase += option.price;
            }
        });

        const base = washBase + mecaBase + optionsBase;

        // Remise de combinaison sur les lavages : montant du niveau le plus bas des deux.
        let washEconomy = 0;
        if (isCompleteWash) {
            const lowerLevel =
                formulaLevels.indexOf(formula.interieur) <=
                    formulaLevels.indexOf(formula.exterieur)
                    ? formula.interieur
                    : formula.exterieur;
            washEconomy += comboDiscounts[lowerLevel];
        }

        // Remise progressive sur le seul sous-total des options.
        const optionsRate = optionsDiscountRate(options.length, detailingOptions.length);
        const optionsDiscount = Math.round(optionsBase * optionsRate);

        // Économie totale = remise lavage complet + remise options.
        const economy = washEconomy + optionsDiscount;

        return {
            base,
            economy,
            washBase,
            mecaBase,
            washEconomy,
            optionsBase,
            optionsDiscount,
            optionsRate,
            optionsNet: optionsBase - optionsDiscount,
            sale: base - economy,
        };
    }, [formula, options, isCompleteWash]);

    // Détail des prix des lavages (Intérieur/Extérieur), sous la grille LAVAGE.
    const washLines = useMemo(() => {
        return washCategories
            .filter((category) => formula[category.key])
            .map((category) => {
                const level = formula[category.key];
                return {
                    key: category.key,
                    label: `${category.label} ${level}`,
                    value: `${category.prices[level]} €`,
                };
            });
    }, [formula]);

    // Ligne de prix de la méca, sous la grille MÉCANIQUE (« Offert » si lavage complet).
    const mecaLine = useMemo(() => {
        if (!mecaCategory || !formula.meca) {
            return null;
        }
        return {
            label: `${mecaCategory.label} ${formula.meca}`,
            value: isCompleteWash ? "Offert" : `${mecaCategory.prices[formula.meca]} €`,
            offered: isCompleteWash,
        };
    }, [formula.meca, isCompleteWash]);

    // Résumé lisible de la formule, envoyé comme « prestation » au backend.
    const serviceSummary = useMemo(() => {
        return formulaCategories
            .filter((category) => formula[category.key])
            .map((category) =>
                category.key === "meca" && isCompleteWash
                    ? `${category.label} offert`
                    : `${category.label} ${formula[category.key]}`,
            )
            .join(" · ");
    }, [formula, isCompleteWash]);

    const hasFormula = Boolean(formula.interieur || formula.exterieur || formula.meca);

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

    /**
     * Indique si l'on peut DÉMARRER la prestation à l'heure donnée : l'horaire existe
     * dans la plage de travail, la durée ne dépasse pas la fin de journée et aucun
     * créneau réservé par un client ne tombe dans la durée. C'est le seul critère qui
     * rend un créneau « incompatible » (donc non sélectionnable comme point de départ).
     * @param {string} time Heure de départ candidate « HH:MM ».
     * @returns {boolean} Vrai si la prestation rentre intégralement à partir de cette heure.
     */
    function canStartAt(time) {
        const start = slotToMinutes(time);
        const periodEnd = periodEndForSlot(time);
        // Hors plage de travail, ou la prestation déborderait la fin de journée.
        if (periodEnd === null || start + durationMinutes > periodEnd) {
            return false;
        }
        // Un créneau réservé par un client tombe dans la durée → impossible de démarrer ici.
        return !slots.some((other) => {
            const otherStart = slotToMinutes(other.time);
            return (
                !other.available &&
                otherStart > start &&
                otherStart < start + durationMinutes
            );
        });
    }

    // Si un changement de formule (durée) rend le créneau déjà choisi impossible
    // (débordement de journée ou chevauchement), on le remet à zéro et on invite,
    // via une pop-up, à en choisir un nouveau parmi les créneaux désormais compatibles.
    useEffect(() => {
        if (selectedSlot && !canStartAt(selectedSlot)) {
            setSelectedSlot("");
            setSlotNotice(true);
        }
        // canStartAt dépend de durationMinutes et slots : on surveille ces deux sources.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [durationMinutes, slots]);

    /**
     * Met à jour un champ du formulaire sans modifier les autres.
     * @param {string} field Nom du champ.
     * @param {string} value Nouvelle valeur.
     * @returns {void} Aucune valeur de retour.
     */
    function updateField(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    /**
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

    /**
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

    /**
     * Réinitialise tout le parcours après une demande envoyée.
     * @returns {void} Aucune valeur de retour.
     */
    function resetBooking() {
        setCreatedAppointment(null);
        setSelectedDate("");
        setSelectedSlot("");
        setForm(initialForm);
        setFormula(emptyFormula);
        setOptions([]);
    }

    /**
     * Envoie la demande au backend et affiche son récapitulatif.
     * @param {React.FormEvent<HTMLFormElement>} event Soumission du formulaire.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function submitAppointment(event) {
        event.preventDefault();
        setFeedback("");

        try {
            const response = await fetch("/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    // La « prestation » résume la formule + le prix de vente.
                    service: `${serviceSummary} — ${pricing.sale} €`,
                    // Les options choisies sont consignées dans le message.
                    message: options.length
                        ? `${form.message}\nOptions : ${options.join(", ")}`.trim()
                        : form.message,
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const canGoBack =
        visibleMonth.getFullYear() > today.getFullYear() ||
        visibleMonth.getMonth() > today.getMonth();

    /**
     * Rend une catégorie de la grille : titre, 3 prix cliquables et ses prestations
     * incluses (pills) juste en dessous. La méca est sélectionnable librement dès qu'un
     * lavage est pris ; elle est offerte (gratuite) lorsque le lavage est complet.
     * @param {object} category Catégorie issue de formulaCategories.
     * @returns {JSX.Element} Le bloc de la catégorie.
     */
    function renderCategory(category) {
        const isMeca = category.key === "meca";
        // Prestations incluses propres à CETTE catégorie, sous ses boutons.
        const features = collectFeatures([category], formula);

        return (
            <div className="formula-cat" key={category.key}>
                <span className="formula-cat__label">{category.label}</span>
                <div className="formula-grid__line">
                    {formulaLevels.map((level) => {
                        const selected = formula[category.key] === level;
                        // Le flag « Offert » se place toujours sur la méca la moins chère
                        // disponible (le niveau offert), quelle que soit la sélection.
                        const offered = isMeca && isCompleteWash && level === mecaOfferedLevel;
                        // Méca : indisponible sans lavage ; et sous le niveau offert
                        // (lavage complet) seuls les niveaux supérieurs sont sélectionnables.
                        const disabled =
                            isMeca &&
                            (!hasWash ||
                                (mecaOfferedLevel &&
                                    formulaLevels.indexOf(level) <
                                        formulaLevels.indexOf(mecaOfferedLevel)));
                        return (
                            <button
                                type="button"
                                key={level}
                                disabled={disabled}
                                aria-pressed={selected}
                                className={`formula-price ${level.toLowerCase()}${selected ? " is-selected" : ""}${offered ? " is-offered" : ""}`}
                                onClick={() => toggleFormula(category.key, level)}
                            >
                                {/* Qualité de l'intervention (0.8em) puis prix, dans le bouton. */}
                                <span className="formula-price__level">{level}</span>
                                <span className="formula-price__amount">{category.prices[level]} €</span>
                            </button>
                        );
                    })}
                </div>

                {/* Prestations incluses de la catégorie, en pleine largeur sous ses prix. */}
                {features.length > 0 && (
                    <div className="formula-pills">
                        {features.map((feature) => (
                            <span className="pill" key={feature.key}>
                                {feature.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    /*
     * Carte « résumé » (rouge) : date + créneau choisis, puis le détail des prix et le
     * total. Rendue à DEUX emplacements (sous le créneau en desktop, en bas en mobile),
     * un seul étant visible à la fois via CSS — d'où cette factorisation.
     */
    const resumePanel =
        hasFormula || selectedDate ? (
            <div className="panel-resume">
                <h3 className="panel-resume__title">Résumé</h3>
                <ul className="formula-recap__lines">
                    <li>
                        <span>Date</span>
                        <span>
                            {selectedDate
                                ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString("fr-FR")
                                : "—"}
                        </span>
                    </li>
                    <li>
                        <span>Créneau</span>
                        <span>{slotRange}</span>
                    </li>
                    {hasFormula && (
                        <>
                            <li>
                                <span>Lavages</span>
                                <span>{pricing.washBase} €</span>
                            </li>
                            {pricing.mecaBase > 0 && (
                                <li>
                                    <span>Mécanique</span>
                                    <span>+{pricing.mecaBase} €</span>
                                </li>
                            )}
                            {pricing.optionsBase > 0 && (
                                <li>
                                    <span>Options</span>
                                    <span>+{pricing.optionsBase} €</span>
                                </li>
                            )}
                            {pricing.washEconomy > 0 && (
                                <li className="is-discount">
                                    <span>Remise lavage complet</span>
                                    <span>−{pricing.washEconomy} €</span>
                                </li>
                            )}
                            {/* Remise options toujours affichée (même à 0) : anti-saut. */}
                            <li className="is-discount">
                                <span>Remise options −{Math.round(pricing.optionsRate * 100)} %</span>
                                <span>−{pricing.optionsDiscount} €</span>
                            </li>
                        </>
                    )}
                </ul>
                {hasFormula && (
                    <div className="formula-total">
                        {pricing.economy > 0 && (
                            <s className="formula-total__strike">{pricing.base} €</s>
                        )}
                        <span className="formula-total__label">À payer</span>
                        <strong className="formula-total__sale">{pricing.sale} €</strong>
                    </div>
                )}
            </div>
        ) : null;

    return (
        <>
            <PageHero {...pages.booking.hero} />

            <section className="booking-layout container">
                <div className="card booking-card">
                    {createdAppointment ? (
                        <div className="success-state">
                            <span><Check /></span>
                            <h2>demande envoyée</h2>
                            <p>
                                Merci {createdAppointment.name} ! Je vous recontacte au
                                plus vite pour confirmer.
                            </p>
                            <dl>
                                <div><dt>Prestation</dt><dd>{createdAppointment.service}</dd></div>
                                <div>
                                    <dt>Date</dt>
                                    <dd>
                                        {new Date(`${createdAppointment.date}T12:00:00`)
                                            .toLocaleDateString("fr-FR", { dateStyle: "full" })}
                                    </dd>
                                </div>
                                <div><dt>Créneau</dt><dd>{createdAppointment.slot}</dd></div>
                            </dl>
                            <button
                                className="button button--secondary"
                                type="button"
                                onClick={resetBooking}
                            >
                                Nouvelle demande
                            </button>
                        </div>
                    ) : (
                        <form className="booking-form" onSubmit={submitAppointment}>
                            {/* Colonne gauche : 1. date (agenda), 2. créneau, puis le résumé. */}
                            <div className="calendar-panel">
                                <BookPanel
                                    id="panel-date"
                                    step={1}
                                    title="Choisissez une date"
                                    aside={
                                        selectedDate
                                            ? new Date(`${selectedDate}T12:00:00`)
                                                .toLocaleDateString("fr-FR")
                                            : null
                                    }
                                >
                                    <div className="calendar-nav">
                                        <button
                                            type="button"
                                            disabled={!canGoBack}
                                            onClick={() => setVisibleMonth(
                                                new Date(
                                                    visibleMonth.getFullYear(),
                                                    visibleMonth.getMonth() - 1,
                                                    1,
                                                ),
                                            )}
                                        >
                                            <ChevronLeft />
                                        </button>
                                        <strong>
                                            {visibleMonth.toLocaleDateString("fr-FR", {
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </strong>
                                        <button
                                            type="button"
                                            onClick={() => setVisibleMonth(
                                                new Date(
                                                    visibleMonth.getFullYear(),
                                                    visibleMonth.getMonth() + 1,
                                                    1,
                                                ),
                                            )}
                                        >
                                            <ChevronRight />
                                        </button>
                                    </div>
                                    <div className="calendar-grid calendar-grid--labels">
                                        {weekDays.map((day, index) => (
                                            <span key={`${day}-${index}`}>{day}</span>
                                        ))}
                                    </div>
                                    <div className="calendar-grid">
                                        {calendarCells.map((cell, index) => {
                                            if (!cell) return <span key={`empty-${index}`} />;
                                            const isDisabled =
                                                cell.date < today || cell.date.getDay() === 0;
                                            return (
                                                <button
                                                    key={cell.iso}
                                                    type="button"
                                                    disabled={isDisabled}
                                                    className={selectedDate === cell.iso ? "is-selected" : ""}
                                                    onClick={() => {
                                                        setSelectedDate(cell.iso);
                                                        setSelectedSlot("");
                                                    }}
                                                >
                                                    {cell.date.getDate()}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </BookPanel>

                                <BookPanel
                                    id="panel-creneau"
                                    step={2}
                                    title="Créneau"
                                    aside={
                                        durationMinutes > 0
                                            ? `Durée estimée : ${formatDuration(durationMinutes)}`
                                            : null
                                    }
                                >
                                    <div className="slot-grid">
                                        {selectedDate ? (
                                            slots.map((slot) => {
                                                const start = slotToMinutes(slot.time);
                                                // Réservé/confirmé par un client : seul cas « dur » de blocage.
                                                const taken = !slot.available;
                                                const selected = selectedSlot === slot.time;
                                                // Heure couverte par la prestation en cours (entre début et fin).
                                                const covered =
                                                    Boolean(selectedSlot) &&
                                                    start > slotToMinutes(selectedSlot) &&
                                                    start < slotToMinutes(selectedSlot) + durationMinutes;
                                                // Dernière heure couverte : l'heure suivante sort de la durée.
                                                const isLastCovered =
                                                    covered &&
                                                    start + 60 >=
                                                        slotToMinutes(selectedSlot) + durationMinutes;
                                                // Chevrons d'association : droite au départ (si le service
                                                // déborde son heure), gauche+droite au milieu, gauche à la fin.
                                                const chevronLeft = covered;
                                                const chevronRight =
                                                    (selected && durationMinutes > 60) ||
                                                    (covered && !isLastCovered);
                                                // Peut-on démarrer ici (durée compatible, sans chevauchement) ?
                                                const compatible = canStartAt(slot.time);
                                                // Désactivé seulement si réservé, ou incompatible ET hors du
                                                // service en cours. Une heure couverte (ou le créneau choisi)
                                                // reste active : cliquer dessus ré-ancre le service.
                                                const disabled =
                                                    taken || (!compatible && !selected && !covered);
                                                // Le créneau choisi (vert) prime ; sinon une heure couverte est
                                                // entourée en rouge mais reste cliquable pour ré-ancrer le service.
                                                const className = [
                                                    selected && "is-selected",
                                                    !selected && covered && "is-covered",
                                                    taken && "is-taken",
                                                ]
                                                    .filter(Boolean)
                                                    .join(" ");
                                                return (
                                                    <button
                                                        key={slot.time}
                                                        type="button"
                                                        disabled={disabled}
                                                        className={className}
                                                        onClick={() => {
                                                            // Ré-ancrage : valide seulement si la durée rentre
                                                            // à partir de cette heure, sinon on invite à choisir.
                                                            if (canStartAt(slot.time)) {
                                                                setSelectedSlot(slot.time);
                                                            } else {
                                                                setSelectedSlot("");
                                                                setSlotNotice(true);
                                                            }
                                                        }}
                                                    >
                                                        {chevronLeft && <ChevronLeft />}
                                                        {slot.time}
                                                        {chevronRight && <ChevronRight />}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <p>Sélectionnez d’abord une date.</p>
                                        )}
                                    </div>
                                </BookPanel>

                                {/* Résumé (carte rouge) sous le créneau, sticky (desktop). */}
                                {resumePanel && (
                                    <div className="montant-slot montant-slot--desktop">
                                        {resumePanel}
                                    </div>
                                )}
                            </div>

                            {/* Colonne droite : 3. lavages, 4. révision, 5. options, 6. coordonnées. */}
                            <div className="details-panel">
                                {/* 3. Lavages : sélection Intérieur/Extérieur + prix. L'incitation
                                    (statique, atténuée) est posée à droite du titre (aside). */}
                                <BookPanel
                                    id="panel-lavages"
                                    step={3}
                                    title="Lavages"
                                    aside={`----- Économisez jusqu’à ${maxComboDiscount} € pour un lavage complet`}
                                >
                                    <div className="formula-grid">
                                        {washCategories.map(renderCategory)}
                                    </div>

                                    {/* Prix des lavages choisis (Intérieur/Extérieur). */}
                                    {washLines.length > 0 && (
                                        <ul className="formula-recap__lines">
                                            {washLines.map((line) => (
                                                <li key={line.key}>
                                                    <span>{line.label}</span>
                                                    <span>{line.value}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </BookPanel>

                                {/* 4. Révision de base (méca) : grille toujours visible, mais
                                    grisée/désactivée tant qu'aucun lavage n'est sélectionné. */}
                                {mecaCategory && (
                                    <BookPanel id="panel-revision" step={4} title="Révision de base">
                                        {!hasWash && (
                                            <p className="formula-options__hint">
                                                Sélectionnez un lavage pour ajouter la révision (offerte avec un lavage complet).
                                            </p>
                                        )}
                                        <div className={`formula-grid${hasWash ? "" : " is-disabled"}`}>
                                            {renderCategory(mecaCategory)}
                                        </div>

                                        {/* Prix de la méca (« Offert » en vert si lavage complet). */}
                                        {mecaLine && (
                                            <ul className="formula-recap__lines">
                                                <li className={mecaLine.offered ? "is-offered" : ""}>
                                                    <span>{mecaLine.label}</span>
                                                    <span>{mecaLine.value}</span>
                                                </li>
                                            </ul>
                                        )}
                                    </BookPanel>
                                )}

                                {/* 5. Options : cases à cocher, actives seulement avec un lavage. */}
                                <BookPanel id="panel-options" step={5} title="Options">
                                    <div className="formula-options">
                                        {!hasWash && (
                                            <p className="formula-options__hint">
                                                Sélectionnez un lavage pour ajouter des options.
                                            </p>
                                        )}
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

                                    {/* Bas du bloc options : montant, remise, puis montant réduit. */}
                                    {pricing.optionsBase > 0 && (
                                        <ul className="formula-recap__lines">
                                            <li>
                                                <span>Montant</span>
                                                <span>{pricing.optionsBase} €</span>
                                            </li>
                                            <li className="is-discount">
                                                <span>Remise −{Math.round(pricing.optionsRate * 100)} %</span>
                                                <span>−{pricing.optionsDiscount} €</span>
                                            </li>
                                            <li className="formula-recap__net">
                                                <span>Montant réduit</span>
                                                <span>{pricing.optionsNet} €</span>
                                            </li>
                                        </ul>
                                    )}
                                </BookPanel>

                                {/* 6. Coordonnées : grille 3 colonnes (1/3 - 2/3) sur desktop,
                                    chaque champ sur sa propre ligne en mode téléphone. */}
                                <BookPanel id="panel-coordonnees" step={6} title="Vos coordonnées">
                                    <div className="coord-grid">
                                    {/* Ligne 1 : Nom & prénom (2/3) + Téléphone (1/3). */}
                                    <input className="field-twothird" required value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Nom & prénom *" />
                                    <input className="field-third" required value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Téléphone *" inputMode="tel" />
                                    {/* Email : pleine largeur. */}
                                    <input className="field-full" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Email" type="email" />
                                    {/* Adresse : pleine largeur. */}
                                    <input className="field-full" value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Adresse d’intervention" />
                                    {/* Ligne : Code postal (1/3) + Ville (2/3). */}
                                    <input className="field-third" value={form.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} placeholder="Code postal" inputMode="numeric" />
                                    <input className="field-twothird" value={form.city} onChange={(event) => updateField("city", event.target.value)} placeholder="Ville" />
                                    {/* Véhicule : pleine largeur. */}
                                    <input className="field-full" value={form.vehicle} onChange={(event) => updateField("vehicle", event.target.value)} placeholder="Véhicule (modèle, année)" />
                                    <textarea value={form.message} onChange={(event) => updateField("message", event.target.value)} placeholder="Vos attentes…" rows="3" />
                                    {feedback && <p className="form-error">{feedback}</p>}
                                    <button
                                        className="button button--block"
                                        type="submit"
                                        disabled={!selectedDate || !selectedSlot || !hasFormula}
                                    >
                                        Confirmer la demande
                                    </button>
                                    <small>Demande sans paiement. Confirmation par téléphone.</small>
                                </div>
                                </BookPanel>
                            </div>

                            {/* Résumé (carte rouge) en bas de tout, sticky (mobile uniquement). */}
                            {resumePanel && (
                                <div className="montant-slot montant-slot--mobile">
                                    {resumePanel}
                                </div>
                            )}
                        </form>
                    )}
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

            {/* Pop-up : la formule a changé et le créneau choisi ne rentre plus.
                On invite à en choisir un nouveau et on recentre la grille des créneaux. */}
            {slotNotice && (
                <div className="slot-modal" role="dialog" aria-modal="true">
                    <div className="slot-modal__box">
                        <h3>Nouveau créneau requis</h3>
                        <p>
                            La durée de votre formule a changé : le créneau choisi ne rentre
                            plus dans la journée. Merci d’en sélectionner un nouveau parmi les
                            créneaux compatibles proposés.
                        </p>
                        <button
                            className="button button--block"
                            type="button"
                            onClick={() => {
                                setSlotNotice(false);
                                document
                                    .getElementById("panel-creneau")
                                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                            }}
                        >
                            Choisir un créneau
                        </button>
                    </div>
                </div>
            )}

            <ZonePanel />
        </>
    );
}
