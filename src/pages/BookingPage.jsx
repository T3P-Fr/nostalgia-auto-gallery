import {
    CalendarDays,
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
 * Plages de travail du prestataire (matin / après-midi). Sert à invalider un créneau
 * dont la prestation dépasserait l'heure de fermeture de sa demi-journée.
 * (Les créneaux 08:00/10:00 et 13:30/15:30/17:00 viennent du backend.)
 */
const workingPeriods = [
    { start: "08:00", end: "12:00" },
    { start: "13:30", end: "19:00" },
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

    // Sans lavage sélectionné, les options ne sont plus disponibles : on les vide.
    useEffect(() => {
        if (!hasWash) {
            setOptions([]);
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
     * Bloc « Montant » (rouge) : récap des sous-totaux, remises, prix normal et prix à
     * payer. Rendu à DEUX emplacements (sous le créneau en desktop, en bas en mobile),
     * un seul étant visible à la fois via CSS — d'où cette factorisation.
     */
    const montantBlock = hasFormula ? (
        <div className="montant-block">
            <h3 className="montant-block__title">Montant</h3>
            <ul className="formula-recap__lines">
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
            </ul>
            <div className="formula-total">
                {pricing.economy > 0 && (
                    <s className="formula-total__strike">{pricing.base} €</s>
                )}
                <span className="formula-total__label">À payer</span>
                <strong className="formula-total__sale">{pricing.sale} €</strong>
            </div>
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
                            {/* Colonne gauche : 1. date (agenda), 2. créneau dessous. */}
                            <div className="calendar-panel">
                                <h3><span>1.</span> Choisissez une date</h3>
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

                                <h3><span>2.</span> Créneau</h3>
                                {durationMinutes > 0 && (
                                    <p className="slot-duration">
                                        Durée estimée : {formatDuration(durationMinutes)}
                                    </p>
                                )}
                                <div className="slot-grid">
                                    {selectedDate ? (
                                        slots.map((slot) => {
                                            const start = slotToMinutes(slot.time);
                                            // Occupé par le service en cours (entre le début et la fin).
                                            const occupied =
                                                Boolean(selectedSlot) &&
                                                start > slotToMinutes(selectedSlot) &&
                                                start < slotToMinutes(selectedSlot) + durationMinutes;
                                            // Indisponible si un créneau réservé tombe dans la durée.
                                            const overlapsBooked = slots.some((other) => {
                                                const time = slotToMinutes(other.time);
                                                return (
                                                    time > start &&
                                                    time < start + durationMinutes &&
                                                    !other.available
                                                );
                                            });
                                            // Impossible si la prestation dépasse l'horaire de
                                            // travail du prestataire (fin de la demi-journée).
                                            const periodEnd = periodEndForSlot(slot.time);
                                            const exceedsHours =
                                                periodEnd === null ||
                                                start + durationMinutes > periodEnd;
                                            return (
                                                <button
                                                    key={slot.time}
                                                    type="button"
                                                    disabled={
                                                        !slot.available ||
                                                        occupied ||
                                                        overlapsBooked ||
                                                        exceedsHours
                                                    }
                                                    className={selectedSlot === slot.time ? "is-selected" : ""}
                                                    onClick={() => setSelectedSlot(slot.time)}
                                                >
                                                    {slot.time}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <p>Sélectionnez d’abord une date.</p>
                                    )}
                                </div>

                                {/* Montant sous le créneau (desktop uniquement). */}
                                {montantBlock && (
                                    <div className="montant-slot montant-slot--desktop">
                                        {montantBlock}
                                    </div>
                                )}
                            </div>

                            {/* Colonne droite : 3. lavages, 4. révision, 5. options, 6. coordonnées. */}
                            <div className="details-panel">
                                {/* 3. Lavages : sélection Intérieur/Extérieur + prix + incitation. */}
                                <h3><span>3.</span> Lavages</h3>
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

                                {/* Incitation : blanche et grasse dès qu'un lavage est pris,
                                    sinon grisée (désactivée). */}
                                <p className={`formula-upsell ${hasWash ? "is-active" : "is-disabled"}`}>
                                    Économisez jusqu’à {maxComboDiscount} € pour un lavage supplémentaire
                                </p>

                                {/* 4. Révision de base (méca) : grille toujours visible, mais
                                    grisée/désactivée tant qu'aucun lavage n'est sélectionné. */}
                                {mecaCategory && (
                                    <>
                                        <h3><span>4.</span> Révision de base</h3>
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
                                    </>
                                )}

                                {/* 5. Options : cases à cocher, actives seulement avec un lavage. */}
                                <h3><span>5.</span> Options</h3>
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

                                {/* 6. Coordonnées : grille 2 colonnes, téléphone seul sur sa ligne. */}
                                <h3><span>6.</span> Vos coordonnées</h3>
                                <div className="coord-grid">
                                    <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Nom & prénom *" />
                                    <input className="field-full" required value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Téléphone *" inputMode="tel" />
                                    <input value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Email" type="email" />
                                    <input value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Adresse d’intervention" />
                                    <input value={form.vehicle} onChange={(event) => updateField("vehicle", event.target.value)} placeholder="Véhicule (modèle, année)" />
                                    <textarea value={form.message} onChange={(event) => updateField("message", event.target.value)} placeholder="Vos attentes…" rows="3" />
                                    <div className="booking-recap">
                                        <CalendarDays />
                                        {selectedDate && selectedSlot
                                            ? `${new Date(`${selectedDate}T12:00:00`).toLocaleDateString("fr-FR")} · ${selectedSlot}${hasFormula ? ` · ${pricing.sale} €` : ""}`
                                            : "Aucun créneau sélectionné"}
                                    </div>
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
                            </div>

                            {/* Montant en bas de tout (mobile uniquement). */}
                            {montantBlock && (
                                <div className="montant-slot montant-slot--mobile">
                                    {montantBlock}
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

            <ZonePanel />
        </>
    );
}
