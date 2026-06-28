/*
 * mailer.cjs — Envoi d'emails transactionnels via l'API HTTP de Resend.
 *
 * Aucune dépendance npm : on utilise `fetch` natif (Node 18+). Si la configuration
 * est absente (RESEND_API_KEY non défini), toutes les fonctions deviennent des
 * no-op silencieux : le parcours de réservation n'est JAMAIS bloqué par l'email.
 *
 * Variables d'environnement attendues (cf. .env.example) :
 *   - RESEND_API_KEY : clé API Resend (sans elle, aucun envoi).
 *   - MAIL_FROM      : expéditeur, sur un domaine vérifié dans Resend.
 *   - MAIL_TO_OWNER  : destinataire des notifications internes (Corentin).
 *
 * Version CommonJS (.cjs) pour Phusion Passenger (o2switch) ; un miroir ESM existe
 * dans mailer.js. Toute modification ici doit y être répliquée.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
// Expéditeur : DOIT appartenir à un domaine vérifié dans Resend. Par défaut, on
// retombe sur l'adresse de test Resend (n'envoie qu'à soi-même, utile en dev).
const MAIL_FROM =
    process.env.MAIL_FROM || "Nostalgia Gallery Auto <onboarding@resend.dev>";
// Destinataire des notifications internes (le gérant, Corentin).
const MAIL_TO_OWNER = process.env.MAIL_TO_OWNER || "";

/**
 * Échappe les caractères HTML d'une valeur utilisateur pour éviter toute injection
 * dans le corps des emails.
 * @param {unknown} value Valeur à échapper.
 * @returns {string} Chaîne sûre pour insertion dans du HTML.
 */
function escapeHtml(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/**
 * Formate une date ISO (AAAA-MM-JJ) en JJ/MM/AAAA pour l'affichage français.
 * @param {string} iso Date au format ISO.
 * @returns {string} Date lisible, ou la valeur d'origine si non reconnue.
 */
function formatDate(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) {
        return iso || "";
    }
    const [year, month, day] = iso.split("-");
    return `${day}/${month}/${year}`;
}

/**
 * Construit un tableau HTML « libellé / valeur » à partir de paires, en ignorant
 * les valeurs vides.
 * @param {Array<[string, string]>} rows Paires [libellé, valeur].
 * @returns {string} Le tableau HTML.
 */
function buildTable(rows) {
    const body = rows
        .filter(([, value]) => value)
        .map(
            ([label, value]) =>
                `<tr><td style="padding:4px 12px 4px 0;color:#888">${escapeHtml(label)}</td>` +
                `<td style="padding:4px 0"><strong>${escapeHtml(value)}</strong></td></tr>`,
        )
        .join("");
    return `<table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px">${body}</table>`;
}

/**
 * Envoie un email via Resend. No-op (retourne false) si la clé API ou le
 * destinataire manquent, ou si `fetch` n'est pas disponible. N'émet jamais
 * d'exception : les erreurs sont seulement journalisées.
 * @param {object} params Paramètres de l'email.
 * @param {string} params.to Destinataire.
 * @param {string} params.subject Sujet.
 * @param {string} params.html Corps HTML.
 * @param {string} [params.replyTo] Adresse de réponse (ex. email du client).
 * @returns {Promise<boolean>} Vrai si l'envoi a été accepté par Resend.
 */
async function sendEmail({ to, subject, html, replyTo }) {
    if (!RESEND_API_KEY || !to || typeof fetch !== "function") {
        return false;
    }
    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: MAIL_FROM,
                to,
                subject,
                html,
                reply_to: replyTo || undefined,
            }),
        });
        if (!response.ok) {
            console.error(
                "[mailer] Resend a refusé l'envoi :",
                response.status,
                await response.text(),
            );
            return false;
        }
        return true;
    } catch (error) {
        console.error("[mailer] Échec de l'envoi via Resend :", error);
        return false;
    }
}

/**
 * Notifie un nouveau rendez-vous (lavage) : accusé au client si une adresse est
 * fournie, et notification interne au gérant. Les erreurs n'interrompent rien.
 * @param {object} appointment Rendez-vous créé (cf. validateAppointment).
 * @returns {Promise<void>} Aucune valeur de retour.
 */
async function notifyAppointment(appointment) {
    const when = `${formatDate(appointment.date)} à ${appointment.slot}`;
    const table = buildTable([
        ["Prestation", appointment.service],
        ["Date & créneau", when],
        ["Véhicule", appointment.vehicle],
        ["Nom", appointment.name],
        ["Téléphone", appointment.phone],
        ["Email", appointment.email],
        ["Adresse", appointment.address],
        ["Message", appointment.message],
    ]);

    // 1) Accusé de réception au client (seulement s'il a laissé un email).
    if (appointment.email) {
        await sendEmail({
            to: appointment.email,
            subject: `Votre demande de rendez-vous — ${when}`,
            html:
                `<p>Bonjour ${escapeHtml(appointment.name)},</p>` +
                `<p>Nous avons bien reçu votre demande de rendez-vous. Voici le récapitulatif :</p>` +
                `${table}` +
                `<p>Nous vous recontactons rapidement pour la confirmer.</p>` +
                `<p>— Nostalgia Gallery Auto</p>`,
        });
    }

    // 2) Notification interne au gérant (toujours, si destinataire configuré).
    await sendEmail({
        to: MAIL_TO_OWNER,
        replyTo: appointment.email,
        subject: `Nouveau RDV — ${appointment.name} — ${when}`,
        html: `<p>Nouveau rendez-vous réservé :</p>${table}`,
    });
}

/**
 * Notifie une nouvelle demande sans créneau (achat/vente ou recherche de pièces) :
 * accusé au client si email fourni, et notification interne au gérant.
 * @param {object} request Demande créée (cf. validateRequest).
 * @returns {Promise<void>} Aucune valeur de retour.
 */
async function notifyRequest(request) {
    const subjectKind =
        request.type === "pieces" ? "Recherche de pièces" : "Projet achat / vente";
    const table = buildTable([
        ["Type", subjectKind],
        ["Nom", request.name],
        ["Téléphone", request.phone],
        ["Email", request.email],
        ["Ville", request.city],
        ["Véhicule", request.vehicle],
        ["Budget", request.budget],
        ["Modèle", request.modele],
        ["Année", request.annee],
        ["État", request.etat],
        ["Délai", request.delai],
        ["Pièce", request.piece],
        ["Référence", request.reference],
        ["Urgence", request.urgence],
        ["Message", request.message],
    ]);

    if (request.email) {
        await sendEmail({
            to: request.email,
            subject: `Votre demande — ${subjectKind}`,
            html:
                `<p>Bonjour ${escapeHtml(request.name)},</p>` +
                `<p>Nous avons bien reçu votre demande. Voici le récapitulatif :</p>` +
                `${table}` +
                `<p>Nous vous recontactons rapidement.</p>` +
                `<p>— Nostalgia Gallery Auto</p>`,
        });
    }

    await sendEmail({
        to: MAIL_TO_OWNER,
        replyTo: request.email,
        subject: `Nouvelle demande — ${subjectKind} — ${request.name}`,
        html: `<p>Nouvelle demande reçue :</p>${table}`,
    });
}

module.exports = { notifyAppointment, notifyRequest };
