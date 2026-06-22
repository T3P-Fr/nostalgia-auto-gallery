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

    // Lavage complet (intérieur + extérieur) : la méca est OFFERTE au niveau le PLUS
    // BAS des deux lavages choisis. Sans aucun lavage, la méca est retirée.
    useEffect(() => {
        setFormula((current) => {
            if (current.interieur && current.exterieur) {
                const lowest =
                    formulaLevels.indexOf(current.interieur) <=
                        formulaLevels.indexOf(current.exterieur)
                        ? current.interieur
                        : current.exterieur;
                return current.meca === lowest ? current : { ...current, meca: lowest };
            }
            if (!current.interieur && !current.exterieur && current.meca) {
                return { ...current, meca: "" };
            }
            return current;
        });
    }, [formula.interieur, formula.exterieur]);

    // Total barré, économie et prix de vente, recalculés à chaque choix.
    const pricing = useMemo(() => {
        // Prix des lavages/méca (la remise de combinaison s'y applique).
        let washBase = 0;
        formulaCategories.forEach((category) => {
            const level = formula[category.key];
            if (!level) {
                return;
            }
            // Méca OFFERTE avec un lavage complet : elle ne compte pas dans le total.
            if (category.key === "meca" && isCompleteWash) {
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

        const base = washBase + optionsBase;

        // Remise de combinaison : montant du niveau le plus bas des deux lavages.
        let economy = 0;
        if (isCompleteWash) {
            const lowerLevel =
                formulaLevels.indexOf(formula.interieur) <=
                    formulaLevels.indexOf(formula.exterieur)
                    ? formula.interieur
                    : formula.exterieur;
            economy += comboDiscounts[lowerLevel];
        }

        // Remise progressive sur le seul sous-total des options.
        const optionsRate = optionsDiscountRate(options.length, detailingOptions.length);
        const optionsDiscount = Math.round(optionsBase * optionsRate);
        economy += optionsDiscount;

        return { base, economy, optionsDiscount, optionsRate, sale: base - economy };
    }, [formula, options, isCompleteWash]);

    // Prestations incluses (pills) : cumul des niveaux choisis, du plus bas au choisi.
    // Dédoublonnées par libellé (une même prestation peut figurer dans plusieurs
    // catégories ou paliers) pour un décompte juste.
    const activeFeatures = useMemo(() => {
        const seen = new Set();
        const list = [];
        formulaCategories.forEach((category) => {
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
        // Pills classées par ordre alphabétique.
        return list.sort((a, b) => a.label.localeCompare(b.label, "fr"));
    }, [formula]);

    // Détail des prix sélectionnés (un par ligne) pour le récapitulatif cumulé.
    const priceLines = useMemo(() => {
        const lines = [];
        formulaCategories.forEach((category) => {
            const level = formula[category.key];
            if (!level) {
                return;
            }
            // Méca offerte quand le lavage est complet : montrée à 0 € (offerte).
            const offered = category.key === "meca" && isCompleteWash;
            lines.push({
                key: category.key,
                label: `${category.label} ${level}`,
                value: offered ? "Offert" : `${category.prices[level]} €`,
                offered,
            });
        });
        options.forEach((label) => {
            const option = detailingOptions.find((entry) => entry.label === label);
            if (option) {
                lines.push({
                    key: `option-${label}`,
                    label,
                    value: `+${option.price} €`,
                    offered: false,
                });
            }
        });
        return lines;
    }, [formula, options, isCompleteWash]);

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
     * Rend une catégorie de la grille (titre, 3 prix cliquables, bonus/remises).
     * La méca est indisponible sans lavage et verrouillée (offerte) si lavage complet.
     * @param {object} category Catégorie issue de formulaCategories.
     * @returns {JSX.Element} Le bloc de la catégorie.
     */
    function renderCategory(category) {
        const isMeca = category.key === "meca";

        return (
            <div className="formula-cat" key={category.key}>
                <span className="formula-cat__label">{category.label}</span>
                <div className="formula-grid__line">
                    {formulaLevels.map((level) => {
                        const selected = formula[category.key] === level;
                        const offered = isMeca && selected && isCompleteWash;
                        const disabled = isMeca && (!hasWash || isCompleteWash);
                        return (
                            <button
                                type="button"
                                key={level}
                                disabled={disabled}
                                aria-pressed={selected}
                                className={`formula-price ${level.toLowerCase()}${selected ? " is-selected" : ""}${offered ? " is-offered" : ""}`}
                                onClick={() => toggleFormula(category.key, level)}
                            >
                                {category.prices[level]} €
                            </button>
                        );
                    })}
                </div>
                {/* Incitation + réductions : seulement si CE lavage est sélectionné. */}
                {formula[category.key] && (
                    <>
                        <p className="formula-cat__bonus">{category.bonusLabel}</p>
                        {category.discounts && (
                            <div className="formula-grid__line formula-cat__savings">
                                {formulaLevels.map((level) => (
                                    <span key={level}>−{category.discounts[level]} €</span>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }

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
                                        Durée estimée du rendez-vous : {formatDuration(durationMinutes)}
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
                                            return (
                                                <button
                                                    key={slot.time}
                                                    type="button"
                                                    disabled={!slot.available || occupied || overlapsBooked}
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
                            </div>

                            {/* Colonne droite : 3. formules, 4. coordonnées. */}
                            <div className="details-panel">
                                <h3><span>3.</span> Vos formules</h3>
                                <div className="formula-grid">
                                    {/* En-têtes de colonnes — mêmes classes de niveau que les
                                        boutons (.platine/.premium/.deluxe) pour la couleur. */}
                                    <div className="formula-grid__line formula-grid__head">
                                        {formulaLevels.map((level) => (
                                            <span key={level} className={level.toLowerCase()}>
                                                {level}
                                            </span>
                                        ))}
                                    </div>

                                    {formulaCategories.map(renderCategory)}
                                </div>

                                {/* Prestations incluses : titre + nombre, puis la liste de pills. */}
                                {activeFeatures.length > 0 && (
                                    <>
                                        <p className="formula-pills__title">
                                            <span>Prestations incluses</span>
                                            <span className="formula-pills__count">
                                                {activeFeatures.length}
                                            </span>
                                        </p>
                                        <div className="formula-pills">
                                            {activeFeatures.map((feature) => (
                                                <span className="pill" key={feature.key}>
                                                    {feature.label}
                                                </span>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Options : cases à cocher (total). Disponibles seulement
                                    si un lavage (intérieur ou extérieur) est sélectionné. */}
                                <p className="formula-pills__title">Prestations en options</p>
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

                                {/* Remise progressive sur les options : TOUJOURS affichée (même à 0)
                                    pour réserver sa place et éviter les sauts de mise en page. */}
                                <p className="formula-options__discount">
                                    Remise options −{Math.round(pricing.optionsRate * 100)} %
                                    <strong>−{pricing.optionsDiscount} €</strong>
                                </p>

                                {/* Récapitulatif : détail de chaque prix cumulé, puis total. */}
                                {hasFormula && (
                                    <div className="formula-recap">
                                        <ul className="formula-recap__lines">
                                            {priceLines.map((line) => (
                                                <li
                                                    key={line.key}
                                                    className={line.offered ? "is-offered" : ""}
                                                >
                                                    <span>{line.label}</span>
                                                    <span>{line.value}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="formula-total">
                                            {pricing.economy > 0 && (
                                                <>
                                                    <s className="formula-total__strike">{pricing.base} €</s>
                                                    <span className="formula-total__save">
                                                        Économie −{pricing.economy} €
                                                    </span>
                                                </>
                                            )}
                                            <strong className="formula-total__sale">{pricing.sale} €</strong>
                                        </div>
                                    </div>
                                )}

                                {/* 4. Coordonnées : grille 2 colonnes, téléphone seul sur sa ligne. */}
                                <h3><span>4.</span> Vos coordonnées</h3>
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
