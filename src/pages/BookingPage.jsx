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
import { useSearchParams } from "react-router-dom";
import { PageHero, ZonePanel } from "../components/Ui.jsx";
import { serviceOptions } from "../data.js";

const weekDays = ["L", "M", "M", "J", "V", "S", "D"];
const initialForm = {
    name: "",
    phone: "",
    email: "",
    address: "",
    service: "",
    vehicle: "",
    message: "",
};

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
 * Gère le contact, la zone et le parcours complet de réservation.
 * @returns {JSX.Element} La page de rendez-vous.
 */
export default function BookingPage() {
    const [searchParams] = useSearchParams();
    const [visibleMonth, setVisibleMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [slots, setSlots] = useState([]);
    const [form, setForm] = useState({
        ...initialForm,
        service: searchParams.get("service") || "",
    });
    const [feedback, setFeedback] = useState("");
    const [createdAppointment, setCreatedAppointment] = useState(null);
    const calendarCells = useMemo(() => buildCalendar(visibleMonth), [visibleMonth]);

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
                body: JSON.stringify({ ...form, date: selectedDate, slot: selectedSlot }),
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

    return (
        <>
            <PageHero
                image="/assets/hero-night.jpg"
                eyebrow="Contact · Zone · Réservation"
                title={<>choisissez votre<br /><em>créneau</em>.</>}
                description="Contactez-moi, vérifiez votre zone puis sélectionnez une date et un horaire. Je confirme ensuite le rendez-vous par téléphone."
            />

            <section className="booking-layout container">
                <aside className="contact-card">
                    <span className="overline">Contact direct</span>
                    <a href="tel:+33636372210">
                        <Phone />
                        <span><small>Téléphone</small>06 36 37 22 10</span>
                    </a>
                    <a href="mailto:jammesmeca.auto@gmail.com">
                        <Mail />
                        <span><small>Email</small>jammesmeca.auto@gmail.com</span>
                    </a>
                    <div>
                        <MapPin />
                        <span><small>Atelier mobile</small>Parignargues · Gard (30)</span>
                    </div>
                    <p>Sur rendez-vous<br />Service itinérant</p>
                </aside>

                <div className="booking-card">
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
                                onClick={() => {
                                    setCreatedAppointment(null);
                                    setSelectedDate("");
                                    setSelectedSlot("");
                                    setForm(initialForm);
                                }}
                            >
                                Nouvelle demande
                            </button>
                        </div>
                    ) : (
                        <form className="booking-form" onSubmit={submitAppointment}>
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
                                <div className="slot-grid">
                                    {selectedDate ? (
                                        slots.map((slot) => (
                                            <button
                                                key={slot.time}
                                                type="button"
                                                disabled={!slot.available}
                                                className={selectedSlot === slot.time ? "is-selected" : ""}
                                                onClick={() => setSelectedSlot(slot.time)}
                                            >
                                                {slot.time}
                                            </button>
                                        ))
                                    ) : (
                                        <p>Sélectionnez d’abord une date.</p>
                                    )}
                                </div>
                            </div>

                            <div className="details-panel">
                                <h3><span>3.</span> Vos coordonnées</h3>
                                <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Nom & prénom *" />
                                <input required value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Téléphone *" inputMode="tel" />
                                <input value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Email" type="email" />
                                <input value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Adresse d’intervention" />
                                <select required value={form.service} onChange={(event) => updateField("service", event.target.value)}>
                                    <option value="">Choisir une prestation…</option>
                                    {serviceOptions.map((option) => <option key={option}>{option}</option>)}
                                </select>
                                <input value={form.vehicle} onChange={(event) => updateField("vehicle", event.target.value)} placeholder="Véhicule (modèle, année)" />
                                <textarea value={form.message} onChange={(event) => updateField("message", event.target.value)} placeholder="Vos attentes…" rows="3" />
                                <div className="booking-recap">
                                    <CalendarDays />
                                    {selectedDate && selectedSlot
                                        ? `${new Date(`${selectedDate}T12:00:00`).toLocaleDateString("fr-FR")} · ${selectedSlot}`
                                        : "Aucun créneau sélectionné"}
                                </div>
                                {feedback && <p className="form-error">{feedback}</p>}
                                <button
                                    className="button button--block"
                                    type="submit"
                                    disabled={!selectedDate || !selectedSlot}
                                >
                                    Confirmer la demande
                                </button>
                                <small>Demande sans paiement. Confirmation par téléphone.</small>
                            </div>
                        </form>
                    )}
                </div>
            </section>

            <div className="container">
                <ZonePanel />
            </div>
        </>
    );
}
