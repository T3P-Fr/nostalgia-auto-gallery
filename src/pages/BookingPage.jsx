import {
    Check,
    ChevronLeft,
    ChevronRight,
    Mail,
    MapPin,
    Phone,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHero, ZonePanel } from "../components/Ui.jsx";
import {
    comboDiscounts,
    detailingOptions,
    formulaCategories,
    formulaLevels,
    icons,
    pages,
    site,
} from "../data.js";

// Les trois besoins (lavage, achat/vente, pièces) pilotent tout le parcours.
const needs = pages.booking.needs;
// Clés des besoins acceptées en pré-sélection via l'URL (?besoin=…).
const needKeys = needs.map((need) => need.key);

// Échelle de délai partagée : projet véhicule (achat/vente) ET recherche de pièces.
const delaiLevels = [
    "Pas pressé",
    "Sous quelques mois",
    "Sous quelques semaines",
    "Sous quelques jours",
];

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
    // Champs du projet achat/vente (ignorés hors de ce besoin).
    projet: "achat",
    budget: "",
    modele: "",
    annee: "",
    etat: "",
    delai: "Pas pressé",
    // Champs de la recherche de pièces.
    piece: "",
    reference: "",
    urgence: "Pas pressé",
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
    const value = text || "";
    // Format heures « 1h45 » / « 4h » : on additionne heures et minutes.
    const hourMatch = /(\d+)\s*h\s*(\d*)/.exec(value);
    if (hourMatch) {
        return Number(hourMatch[1]) * 60 + (hourMatch[2] ? Number(hourMatch[2]) : 0);
    }
    // Format minutes seules « 5 min » / « 30 min » (ex. complément méca).
    const minuteMatch = /(\d+)\s*min/.exec(value);
    if (minuteMatch) {
        return Number(minuteMatch[1]);
    }
    return 0;
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
    // Besoins cochés (multi-sélection) : chaque besoin actif affiche son formulaire
    // à droite. Le lavage est le seul à requérir un créneau.
    const [besoins, setBesoins] = useState({
        // Premier onglet (lavage) actif par défaut au chargement.
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
    // Popup de sélection du créneau (ouvert au choix d'une date, cas lavage).
    const [slotModalOpen, setSlotModalOpen] = useState(false);
    const calendarCells = useMemo(() => buildCalendar(visibleMonth), [visibleMonth]);

    // Pré-cochage d'un besoin depuis l'URL : ?besoin=achat-vente|pieces|lavage, ou
    // ?service=… (liens des pages Tarifs/Detailing) qui ciblent forcément un lavage.
    useEffect(() => {
        const requested = searchParams.get("besoin");
        // Sélection exclusive (radio) : on n'active que le besoin demandé.
        if (requested && needKeys.includes(requested)) {
            setBesoins({ lavage: false, "achat-vente": false, pieces: false, [requested]: true });
        } else if (searchParams.get("service")) {
            setBesoins({ lavage: true, "achat-vente": false, pieces: false });
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
        setCreatedLead(null);
        setBesoins({ lavage: true, "achat-vente": false, pieces: false });
        setSelectedDate("");
        setSelectedSlot("");
        setForm(initialForm);
        setFormula(emptyFormula);
        setOptions([]);
        setFeedback("");
    }

    /**
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

    /**
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

    /**
     * Envoie une demande SANS créneau (lavage non coché) : un ou plusieurs besoins
     * parmi achat/vente et pièces, vers l'endpoint dédié.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function postRequest() {
        const needsList = ["achat-vente", "pieces"].filter((key) => besoins[key]);
        try {
            const response = await fetch("/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Le backend ne retient que les champs pertinents selon les besoins.
                body: JSON.stringify({ ...form, needs: needsList, type: needsList[0] }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setCreatedLead(data);
        } catch (error) {
            setFeedback(error.message || "La demande n’a pas pu être envoyée.");
        }
    }

    /**
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
                headers: { "Content-Type": "application/json" },
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

    /**
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
    const resumePanel = (
        <div className="panel-resume">
            <h3 className="panel-resume__title">Résumé</h3>
            {!hasFormula && !selectedDate ? (
                // Mode attente : aucune date ni formule encore choisie.
                <p className="panel-resume__wait">
                    En attente de votre sélection…
                </p>
            ) : (
                <>
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
                </>
            )}
        </div>
    );

    /**
     * Colonne de gauche : contact commun (nom, téléphone, email) empilé, puis les
     * champs d'adresse propres au besoin (adresse d'intervention pour le lavage).
     * @returns {JSX.Element} Le panneau contact + adresse.
     */
    function renderContact() {
        return (
            <BookPanel id="panel-coordonnees" title="Vos coordonnées">
                <div className="coord-grid">
                    {/* Contact commun, en colonne (un champ par ligne). */}
                    <input className="field-full" required value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Nom & prénom *" />
                    <input className="field-full" required value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Téléphone *" inputMode="tel" />
                    <input className="field-full" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Email" type="email" />
                    {/* Adresse, sous le contact : propre au besoin. */}
                    {besoins.lavage ? (
                        <>
                            <input className="field-full" value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Adresse d’intervention" />
                            <input className="field-third" value={form.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} placeholder="Code postal" inputMode="numeric" />
                            <input className="field-twothird" value={form.city} onChange={(event) => updateField("city", event.target.value)} placeholder="Ville" />
                        </>
                    ) : (
                        <input className="field-full" value={form.city} onChange={(event) => updateField("city", event.target.value)} placeholder="Ville" />
                    )}
                </div>
            </BookPanel>
        );
    }

    /**
     * Groupe de vrais boutons radio pour l'échelle de délai (4 niveaux), partagé
     * entre le délai du projet et l'urgence des pièces. 4 colonnes desktop, 2 mobile.
     * @param {string} field Champ du formulaire à piloter (delai / urgence).
     * @param {string} legend Intitulé affiché au-dessus du groupe.
     * @returns {JSX.Element} Le groupe radio.
     */
    function renderDelaiRadios(field, legend) {
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
                                checked={form[field] === level}
                                onChange={() => updateField(field, level)}
                            />
                            <span>{level}</span>
                        </label>
                    ))}
                </div>
            </fieldset>
        );
    }

    /**
     * Section « projet véhicule » (achat/vente) : champs propres au besoin en 50/50.
     * @returns {JSX.Element} Le panneau du projet achat/vente.
     */
    function renderProjetSection() {
        const isSale = form.projet === "vente";
        return (
            <BookPanel title="Votre projet véhicule">
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
                            onClick={() => updateField("projet", choice.key)}
                        >
                            {choice.label}
                        </button>
                    ))}
                </div>

                <div className="fields-2col">
                    <input className="full" value={form.vehicle} onChange={(event) => updateField("vehicle", event.target.value)} placeholder={isSale ? "Véhicule à vendre (marque, modèle)" : "Véhicule recherché (marque, modèle)"} />
                    <input value={form.annee} onChange={(event) => updateField("annee", event.target.value)} placeholder="Année" inputMode="numeric" />
                    <input value={form.modele} onChange={(event) => updateField("modele", event.target.value)} placeholder="Motorisation / finition" />
                    <input value={form.budget} onChange={(event) => updateField("budget", event.target.value)} placeholder="Budget" />
                    <input value={form.etat} onChange={(event) => updateField("etat", event.target.value)} placeholder={isSale ? "État du véhicule" : "État souhaité"} />
                    {renderDelaiRadios("delai", "Délai du projet")}
                </div>
            </BookPanel>
        );
    }

    /**
     * Section « recherche de pièces » : champs propres au besoin en 50/50.
     * @returns {JSX.Element} Le panneau de recherche de pièces.
     */
    function renderPiecesSection() {
        return (
            <BookPanel title="Votre recherche de pièces">
                <div className="fields-2col">
                    <input className="full" value={form.vehicle} onChange={(event) => updateField("vehicle", event.target.value)} placeholder="Véhicule concerné (marque, modèle, année)" />
                    <input value={form.piece} onChange={(event) => updateField("piece", event.target.value)} placeholder="Pièce recherchée" />
                    <input value={form.reference} onChange={(event) => updateField("reference", event.target.value)} placeholder="Référence (si connue)" />
                    {renderDelaiRadios("urgence", "Niveau d’urgence")}
                </div>
            </BookPanel>
        );
    }

    /**
     * Bouton (colonne droite, lavage) qui ouvre le popup agenda + créneaux. Affiche
     * la date et le créneau choisis, ou invite à les sélectionner.
     * @returns {JSX.Element} Le panneau déclencheur du popup.
     */
    function renderAgendaTrigger() {
        const dateLabel = selectedDate
            ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString("fr-FR")
            : "";
        return (
            <BookPanel
                id="panel-date"
                title="Date & créneau"
                aside={durationMinutes > 0 ? `Durée estimée : ${formatDuration(durationMinutes)}` : null}
            >
                <button
                    type="button"
                    className="button button--secondary button--block"
                    onClick={() => setSlotModalOpen(true)}
                >
                    {selectedDate && selectedSlot
                        ? `${dateLabel} · ${slotRange}`
                        : "Choisir la date et le créneau"}
                </button>
            </BookPanel>
        );
    }

    /**
     * Calendrier du mois, rendu DANS le popup. Cliquer une date la sélectionne et
     * révèle les créneaux du jour (juste en dessous, dans le même popup).
     * @returns {JSX.Element} La grille calendrier.
     */
    function renderCalendar() {
        return (
            <div className="agenda-calendar">
                <div className="calendar-nav">
                    <button
                        type="button"
                        disabled={!canGoBack}
                        onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
                    >
                        <ChevronLeft />
                    </button>
                    <strong>{visibleMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</strong>
                    <button
                        type="button"
                        onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
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
                        const isDisabled = cell.date < today || cell.date.getDay() === 0;
                        return (
                            <button
                                key={cell.iso}
                                type="button"
                                disabled={isDisabled}
                                className={selectedDate === cell.iso ? "is-selected" : ""}
                                onClick={() => {
                                    // Sélectionne la date ; les créneaux apparaissent dessous.
                                    setSelectedDate(cell.iso);
                                    setSelectedSlot("");
                                }}
                            >
                                {cell.date.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    /**
     * Grille des créneaux d'une journée, rendue dans le popup. La logique de
     * compatibilité/chevauchement est conservée ; choisir un créneau ferme le popup.
     * @returns {React.ReactNode} Les boutons de créneaux, ou une invite.
     */
    function renderSlotGrid() {
        if (!selectedDate) {
            return <p>Sélectionnez d’abord une date.</p>;
        }
        return slots.map((slot) => {
            const start = slotToMinutes(slot.time);
            const taken = !slot.available;
            const selected = selectedSlot === slot.time;
            const covered =
                Boolean(selectedSlot) &&
                start > slotToMinutes(selectedSlot) &&
                start < slotToMinutes(selectedSlot) + durationMinutes;
            const isLastCovered =
                covered && start + 60 >= slotToMinutes(selectedSlot) + durationMinutes;
            const chevronLeft = covered;
            const chevronRight =
                (selected && durationMinutes > 60) || (covered && !isLastCovered);
            const compatible = canStartAt(slot.time);
            const disabled = taken || (!compatible && !selected && !covered);
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
                        // On sélectionne le créneau ; la fermeture se fait via « Valider ».
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
        });
    }

    // Le lavage exige date + créneau + formule ; les autres besoins non.
    const lavageReady = !besoins.lavage || (selectedDate && selectedSlot && hasFormula);
    const canSubmit =
        hasNeed && Boolean(form.name.trim()) && Boolean(form.phone.trim()) && Boolean(lavageReady);
    // Libellé d'envoi : un rendez-vous si lavage coché, sinon une demande à rappeler.
    const submitLabel = besoins.lavage ? "Demander ce rendez-vous" : "Envoyer ma demande";

    return (
        <>
            <PageHero {...pages.booking.hero} />

            <section className="booking-layout container">
                {/* Calque givré UNIQUE englobant tabs + carte : un seul backdrop-filter
                    pour éviter la jointure entre deux flous calculés séparément. */}
                <div className="booking-frost">
                {/* Bloc TABS à part : 3 onglets de besoins (multi-sélection), bordures
                    franches sans radius. Masqué une fois la demande envoyée. */}
                {!createdAppointment && !createdLead && (
                    <div className="need-tabs">
                        {needs.map((need) => {
                            const active = besoins[need.key];
                            return (
                                <button
                                    type="button"
                                    key={need.key}
                                    aria-pressed={active}
                                    className={`need-tab${active ? " is-selected" : ""}`}
                                    onClick={() => toggleBesoin(need.key)}
                                >
                                    {need.label}
                                </button>
                            );
                        })}
                    </div>
                )}

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
                    ) : createdLead ? (
                        /* Demande sans créneau confirmée : remerciement sans date/créneau. */
                        <div className="success-state">
                            <span><Check /></span>
                            <h2>demande envoyée</h2>
                            <p>
                                Merci {createdLead.name} ! J’étudie votre demande et je
                                vous rappelle au plus vite.
                            </p>
                            <button
                                className="button button--secondary"
                                type="button"
                                onClick={resetBooking}
                            >
                                Nouvelle demande
                            </button>
                        </div>
                    ) : (
                        <form className="booking-form" onSubmit={handleSubmit}>
                            {/* Colonne gauche : contact + adresse, puis résumé. */}
                            <div className="calendar-panel">
                                {/* Contact commun + adresse propre au besoin (gauche). */}
                                {hasNeed && renderContact()}

                                {/* Résumé (carte rouge) : uniquement pour le lavage (prix/créneau). */}
                                {besoins.lavage && (
                                    <div className="montant-slot montant-slot--desktop">
                                        {resumePanel}
                                    </div>
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

                                {/* Lavage : agenda (créneaux en popup) → formules → révision → options. */}
                                {besoins.lavage && (
                                <>
                                {/* Lavages : sélection Intérieur/Extérieur + prix. L'incitation
                                    (statique, atténuée) est posée à droite du titre (aside). */}
                                <BookPanel
                                    id="panel-lavages"
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
                                    <BookPanel id="panel-revision" title="Révision de base">
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
                                <BookPanel id="panel-options" title="Options">
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

                                {/* Date & créneau : sous les choix de lavage/révision/options. */}
                                {renderAgendaTrigger()}
                                </>
                                )}

                                {/* Projet achat/vente (si coché). */}
                                {besoins["achat-vente"] && renderProjetSection()}

                                {/* Recherche de pièces (si coché). */}
                                {besoins.pieces && renderPiecesSection()}

                                {/* Message libre + envoi unique, dès qu'au moins un besoin est coché. */}
                                {hasNeed && (
                                    <div className="lead-submit">
                                        <textarea value={form.message} onChange={(event) => updateField("message", event.target.value)} placeholder="Votre message (précisions, attentes…)" rows="3" />
                                        {feedback && <p className="form-error">{feedback}</p>}
                                        <button className="button button--block" type="submit" disabled={!canSubmit}>
                                            {submitLabel}
                                        </button>
                                        <small>Demande sans engagement. Je vous recontacte pour confirmer.</small>
                                    </div>
                                )}
                            </div>

                            {/* Résumé (carte rouge) en bas, sticky (mobile) : lavage uniquement. */}
                            {besoins.lavage && (
                                <div className="montant-slot montant-slot--mobile">
                                    {resumePanel}
                                </div>
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

            {/* Popup de sélection du créneau (lavage) : ouvert au choix d'une date. */}
            {slotModalOpen && (
                <div
                    className="slot-modal"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setSlotModalOpen(false)}
                >
                    <div className="slot-modal__box slot-modal__box--agenda" onClick={(event) => event.stopPropagation()}>
                        {/* En-tête : titre + croix de fermeture (blanche, rouge au survol). */}
                        <div className="slot-modal__head">
                            <h3>Choisissez la date et le créneau</h3>
                            <button
                                type="button"
                                className="slot-modal__close"
                                aria-label="Fermer"
                                onClick={() => setSlotModalOpen(false)}
                            >
                                <X />
                            </button>
                        </div>
                        {durationMinutes > 0 && (
                            <p>Durée estimée : {formatDuration(durationMinutes)}</p>
                        )}

                        {/* Calendrier puis, sous lui, les créneaux du jour sélectionné. */}
                        {renderCalendar()}

                        <div className="agenda-slots">
                            <h4>
                                {selectedDate
                                    ? `Créneaux du ${new Date(`${selectedDate}T12:00:00`).toLocaleDateString("fr-FR")}`
                                    : "Créneaux"}
                            </h4>
                            <div className="slot-grid">{renderSlotGrid()}</div>
                        </div>

                        {/* Bas : Annuler (secondaire) + Valider (primaire). */}
                        <div className="slot-modal__actions">
                            <button
                                type="button"
                                className="button button--secondary"
                                onClick={() => setSlotModalOpen(false)}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                className="button"
                                disabled={!selectedSlot}
                                onClick={() => setSlotModalOpen(false)}
                            >
                                Valider
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                setSlotModalOpen(true);
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
