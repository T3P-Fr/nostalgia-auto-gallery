/*
 * SlotModal.jsx — Sélection de la date et du créneau (cas « lavage »).
 *
 * Regroupe trois éléments d'interface étroitement liés :
 *   - Calendar         : le calendrier mensuel (sous-composant interne) ;
 *   - SlotGrid         : la grille des créneaux du jour (sous-composant interne) ;
 *   - SlotModal        : le popup agenda assemblant les deux + les actions ;
 *   - SlotNoticeModal  : le popup d'avertissement « créneau devenu invalide ».
 *
 * Toute la logique de compatibilité reste pure (importée depuis bookingHelpers) ;
 * ce fichier n'orchestre que l'affichage et remonte les choix via des callbacks.
 */

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
    canStartAt,
    formatDuration,
    slotTimes,
    slotToMinutes,
    weekDays,
} from "../../utils/bookingHelpers.js";

/**
 * Calendrier du mois (lundi en tête). Cliquer une date la sélectionne et révèle les
 * créneaux du jour (rendus juste en dessous par SlotGrid, dans le même popup).
 * @param {object} props Propriétés du calendrier.
 * @param {Array<object|null>} props.calendarCells Cellules du mois (null = remplissage).
 * @param {Date} props.visibleMonth Mois actuellement affiché.
 * @param {boolean} props.canGoBack Autorise la navigation vers le mois précédent.
 * @param {Date} props.today Date du jour (minuit) pour griser le passé.
 * @param {string} props.selectedDate Date sélectionnée (ISO) ou "".
 * @param {(month: Date) => void} props.onMonthChange Change le mois affiché.
 * @param {(iso: string) => void} props.onSelectDate Sélectionne une date (et réinit. le créneau).
 * @returns {JSX.Element} La grille calendrier.
 */
function Calendar({
    calendarCells,
    visibleMonth,
    canGoBack,
    today,
    selectedDate,
    onMonthChange,
    onSelectDate,
}) {
    return (
        <div className="agenda-calendar">
            <div className="calendar-nav">
                <button
                    type="button"
                    disabled={!canGoBack}
                    onClick={() => onMonthChange(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
                >
                    <ChevronLeft />
                </button>
                <strong>{visibleMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</strong>
                <button
                    type="button"
                    onClick={() => onMonthChange(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
                >
                    <ChevronRight />
                </button>
            </div>
            <div className="calendar-grid calendar-grid--labels">
                {weekDays.map((day, index) => (
                    <span key={`${day}-${index}`}>
                        {/* Lettre du jour en display blanc + point rouge (motif des
                            numéros d'étape). */}
                        <span className="cal-day__letter">{day}</span>
                        <span className="cal-day__dot">.</span>
                    </span>
                ))}
            </div>
            <div className="calendar-grid">
                {calendarCells.map((cell) => {
                    // Jours des mois adjacents : repère visuel léger, non interactif.
                    if (cell.outside) {
                        return (
                            <span
                                key={`out-${cell.iso}`}
                                className="cal-cell--outside"
                                aria-hidden="true"
                            >
                                {cell.date.getDate()}
                            </span>
                        );
                    }
                    // Passé et dimanches (getDay() === 0) non réservables.
                    const isDisabled = cell.date < today || cell.date.getDay() === 0;
                    return (
                        <button
                            key={cell.iso}
                            type="button"
                            disabled={isDisabled}
                            className={selectedDate === cell.iso ? "is-selected" : ""}
                            onClick={() => onSelectDate(cell.iso)}
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
 * Grille des créneaux d'une journée. Marque les créneaux pris, le créneau choisi et
 * les créneaux « couverts » par la durée de la prestation (avec chevrons de liaison).
 * Choisir un créneau incompatible le réinitialise et déclenche l'avertissement.
 * @param {object} props Propriétés de la grille.
 * @param {string} props.selectedDate Date sélectionnée (ISO) ou "".
 * @param {Array<{ time: string, available: boolean }>} props.slots Créneaux du jour.
 * @param {string} props.selectedSlot Créneau de départ choisi (ou "").
 * @param {number} props.durationMinutes Durée totale de la prestation.
 * @param {(time: string) => void} props.onSelectSlot Sélectionne un créneau valide.
 * @param {() => void} props.onInvalidSlot Signale un créneau devenu incompatible.
 * @returns {React.ReactNode} Les boutons de créneaux, ou une invite.
 */
function SlotGrid({
    selectedDate,
    slots,
    selectedSlot,
    durationMinutes,
    onSelectSlot,
    onInvalidSlot,
}) {
    // Avant qu'une date soit choisie (ou pendant le chargement des créneaux), on rend
    // une grille de créneaux DÉSACTIVÉS aux mêmes horaires : la hauteur du popup est
    // identique dès l'ouverture, donc aucun saut quand les vrais créneaux arrivent.
    if (!selectedDate || slots.length === 0) {
        return slotTimes.map((time) => (
            <button key={time} type="button" disabled>
                {time}
            </button>
        ));
    }
    return slots.map((slot) => {
        const start = slotToMinutes(slot.time);
        const taken = !slot.available;
        const selected = selectedSlot === slot.time;
        // Créneau « couvert » : il tombe dans la durée à partir du créneau choisi.
        const covered =
            Boolean(selectedSlot) &&
            start > slotToMinutes(selectedSlot) &&
            start < slotToMinutes(selectedSlot) + durationMinutes;
        const isLastCovered =
            covered && start + 60 >= slotToMinutes(selectedSlot) + durationMinutes;
        const chevronLeft = covered;
        const chevronRight =
            (selected && durationMinutes > 60) || (covered && !isLastCovered);
        const compatible = canStartAt(slot.time, slots, durationMinutes);
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
                    if (canStartAt(slot.time, slots, durationMinutes)) {
                        onSelectSlot(slot.time);
                    } else {
                        onInvalidSlot();
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

/**
 * Popup de sélection de la date et du créneau : calendrier en haut, créneaux du jour
 * en dessous, puis les actions Annuler / Valider. Fond cliquable pour fermer.
 * @param {object} props Propriétés du popup.
 * @param {Array<object|null>} props.calendarCells Cellules du mois affiché.
 * @param {Date} props.visibleMonth Mois affiché.
 * @param {boolean} props.canGoBack Autorise le mois précédent.
 * @param {Date} props.today Date du jour (minuit).
 * @param {string} props.selectedDate Date sélectionnée (ISO) ou "".
 * @param {string} props.selectedSlot Créneau choisi (ou "").
 * @param {Array<object>} props.slots Créneaux du jour.
 * @param {number} props.durationMinutes Durée totale de la prestation.
 * @param {(month: Date) => void} props.onMonthChange Change le mois affiché.
 * @param {(iso: string) => void} props.onSelectDate Sélectionne une date.
 * @param {(time: string) => void} props.onSelectSlot Sélectionne un créneau valide.
 * @param {() => void} props.onInvalidSlot Signale un créneau devenu incompatible.
 * @param {() => void} props.onClose Ferme le popup.
 * @returns {JSX.Element} Le popup agenda.
 */
export function SlotModal({
    calendarCells,
    visibleMonth,
    canGoBack,
    today,
    selectedDate,
    selectedSlot,
    slots,
    durationMinutes,
    onMonthChange,
    onSelectDate,
    onSelectSlot,
    onInvalidSlot,
    onClose,
}) {
    return (
        <div className="slot-modal" role="dialog" aria-modal="true" onClick={onClose}>
            {/* stopPropagation : un clic DANS la boîte ne doit pas fermer le popup. */}
            <div className="slot-modal__box slot-modal__box--agenda" onClick={(event) => event.stopPropagation()}>
                {/* En-tête : titre + croix de fermeture (blanche, rouge au survol). */}
                <div className="slot-modal__head">
                    <h3>Choisissez la date et le créneau</h3>
                    <button
                        type="button"
                        className="slot-modal__close"
                        aria-label="Fermer"
                        onClick={onClose}
                    >
                        <X />
                    </button>
                </div>
                {durationMinutes > 0 && <p>Durée estimée : {formatDuration(durationMinutes)}</p>}

                {/* Calendrier puis, sous lui, les créneaux du jour sélectionné. */}
                <Calendar
                    calendarCells={calendarCells}
                    visibleMonth={visibleMonth}
                    canGoBack={canGoBack}
                    today={today}
                    selectedDate={selectedDate}
                    onMonthChange={onMonthChange}
                    onSelectDate={onSelectDate}
                />

                <div className="agenda-slots">
                    <h4>
                        {selectedDate
                            ? `Créneaux du ${new Date(`${selectedDate}T12:00:00`).toLocaleDateString("fr-FR")}`
                            : "Créneaux"}
                    </h4>
                    <div className="slot-grid">
                        <SlotGrid
                            selectedDate={selectedDate}
                            slots={slots}
                            selectedSlot={selectedSlot}
                            durationMinutes={durationMinutes}
                            onSelectSlot={onSelectSlot}
                            onInvalidSlot={onInvalidSlot}
                        />
                    </div>
                </div>

                {/* Bas : Annuler (secondaire) + Valider (primaire). */}
                <div className="slot-modal__actions">
                    <button type="button" className="button button--secondary" onClick={onClose}>
                        Annuler
                    </button>
                    <button type="button" className="button" disabled={!selectedSlot} onClick={onClose}>
                        Valider
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Popup d'avertissement : un changement de formule (durée) a rendu le créneau choisi
 * impossible. On invite à en choisir un nouveau et on rouvre l'agenda.
 * @param {object} props Propriétés du popup.
 * @param {() => void} props.onChooseSlot Ferme l'avertissement et rouvre l'agenda.
 * @returns {JSX.Element} Le popup d'avertissement.
 */
export function SlotNoticeModal({ onChooseSlot }) {
    return (
        <div className="slot-modal" role="dialog" aria-modal="true">
            <div className="slot-modal__box">
                <h3>Nouveau créneau requis</h3>
                <p>
                    La durée de votre formule a changé : le créneau choisi ne rentre plus dans
                    la journée. Merci d’en sélectionner un nouveau parmi les créneaux compatibles
                    proposés.
                </p>
                <button className="button button--block" type="button" onClick={onChooseSlot}>
                    Choisir un créneau
                </button>
            </div>
        </div>
    );
}
