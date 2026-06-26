const express = require("express");
const path = require("node:path");
const {
    createAppointment,
    deleteAppointment,
    readAppointments,
    updateAppointment,
} = require("./store.cjs");

// Version CommonJS (.cjs) pour Phusion Passenger (o2switch). Passenger charge le
// fichier de démarrage en CommonJS ; un fichier ESM (.js avec "type":"module")
// échoue avec "require is not defined in ES module scope". Le .cjs règle ça.

const app = express();
const port = Number(process.env.PORT) || 3001;
const adminKey = process.env.ADMIN_KEY || "nostalgia-admin";
// Un créneau toutes les heures, de 08:00 à 18:00 inclus.
const allowedSlots = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
];
const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"];

app.use(express.json({ limit: "100kb" }));

function requireAdmin(request, response, next) {
    if (request.get("x-admin-key") !== adminKey) {
        response.status(401).json({ message: "Clé administrateur invalide." });
        return;
    }
    next();
}

function cleanString(value, maximumLength = 500) {
    return typeof value === "string"
        ? value.trim().slice(0, maximumLength)
        : "";
}

function validateAppointment(body) {
    const data = {
        name: cleanString(body.name, 120),
        phone: cleanString(body.phone, 40),
        email: cleanString(body.email, 160),
        address: cleanString(body.address, 250),
        service: cleanString(body.service, 180),
        vehicle: cleanString(body.vehicle, 300),
        message: cleanString(body.message, 1200),
        date: cleanString(body.date, 10),
        slot: cleanString(body.slot, 5),
    };

    if (!data.name || !data.phone || !data.service || !data.date || !data.slot) {
        return { error: "Nom, téléphone, prestation, date et créneau sont requis." };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !allowedSlots.includes(data.slot)) {
        return { error: "La date ou le créneau est invalide." };
    }
    if (new Date(`${data.date}T${data.slot}:00`) < new Date()) {
        return { error: "Ce créneau est déjà passé." };
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return { error: "L’adresse email est invalide." };
    }
    return { data };
}

app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
});

app.get("/api/availability", async (request, response, next) => {
    try {
        const date = cleanString(request.query.date, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            response.status(400).json({ message: "Date invalide." });
            return;
        }
        const appointments = await readAppointments();
        const takenSlots = appointments
            .filter(
                (appointment) =>
                    appointment.date === date && appointment.status !== "cancelled",
            )
            .map((appointment) => appointment.slot);
        response.json({
            date,
            slots: allowedSlots.map((time) => ({
                time,
                available: !takenSlots.includes(time),
            })),
        });
    } catch (error) {
        next(error);
    }
});

app.post("/api/appointments", async (request, response, next) => {
    try {
        const validation = validateAppointment(request.body);
        if (validation.error) {
            response.status(400).json({ message: validation.error });
            return;
        }
        const appointment = await createAppointment(validation.data);
        response.status(201).json(appointment);
    } catch (error) {
        if (error.code === "SLOT_CONFLICT") {
            response.status(409).json({ message: error.message });
            return;
        }
        next(error);
    }
});

app.get("/api/appointments", requireAdmin, async (request, response, next) => {
    try {
        const appointments = await readAppointments();
        const sortedAppointments = appointments.sort((first, second) =>
            `${first.date}T${first.slot}`.localeCompare(`${second.date}T${second.slot}`),
        );
        response.json(sortedAppointments);
    } catch (error) {
        next(error);
    }
});

app.patch("/api/appointments/:id", requireAdmin, async (request, response, next) => {
    try {
        const status = cleanString(request.body.status, 20);
        if (!allowedStatuses.includes(status)) {
            response.status(400).json({ message: "Statut invalide." });
            return;
        }
        const appointment = await updateAppointment(request.params.id, { status });
        if (!appointment) {
            response.status(404).json({ message: "Rendez-vous introuvable." });
            return;
        }
        response.json(appointment);
    } catch (error) {
        next(error);
    }
});

app.delete("/api/appointments/:id", requireAdmin, async (request, response, next) => {
    try {
        const deleted = await deleteAppointment(request.params.id);
        response.status(deleted ? 204 : 404).end();
    } catch (error) {
        next(error);
    }
});

// En production, Express sert également le bundle généré par Vite.
const distDirectory = path.resolve(__dirname, "..", "dist");
app.use(express.static(distDirectory));
app.get("*splat", (request, response, next) => {
    if (request.path.startsWith("/api")) {
        next();
        return;
    }
    response.sendFile(path.join(distDirectory, "index.html"));
});

app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ message: "Une erreur interne est survenue." });
});

// Phusion Passenger intercepte l'appel à listen() (reverse port binding).
if (typeof PhusionPassenger !== "undefined") {
    PhusionPassenger.configure({ autoInstall: false });
    app.listen("passenger", () => {
        console.log("Nostalgia Auto Gallery API démarrée via Passenger.");
    });
} else {
    app.listen(port, () => {
        console.log(`Nostalgia Auto Gallery API : http://localhost:${port}`);
    });
}
