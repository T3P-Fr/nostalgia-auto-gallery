/*
 * mailer.cjs — Envoi d'emails transactionnels via SMTP (Nodemailer).
 *
 * Utilise le compte mail du domaine (cPanel/o2switch), donc les emails partent de
 * la vraie adresse de la marque. Si la configuration SMTP est absente, toutes les
 * fonctions deviennent des no-op silencieux : le parcours de réservation n'est
 * JAMAIS bloqué par l'email.
 *
 * Variables d'environnement attendues (cf. .env.example) :
 *   - SMTP_HOST     : serveur sortant (ex. nostalgia.caef.fr) ;
 *   - SMTP_PORT     : 465 (SSL/TLS) ou 587 (STARTTLS) ;
 *   - SMTP_USER     : adresse du compte (ex. corentin@nostalgia.caef.fr) ;
 *   - SMTP_PASS     : mot de passe du compte mail ;
 *   - MAIL_FROM     : expéditeur affiché (défaut : SMTP_USER) ;
 *   - MAIL_TO_OWNER : destinataire des notifications internes (Corentin).
 *
 * Version CommonJS (.cjs) pour Phusion Passenger (o2switch) ; un miroir ESM existe
 * dans mailer.js. Toute modification ici doit y être répliquée.
 */

// Chargement défensif : si nodemailer n'est pas (encore) installé sur le serveur,
// l'envoi d'email devient un no-op au lieu de faire planter TOUTE l'API au démarrage.
let nodemailer = null;
try {
    nodemailer = require("nodemailer");
} catch (error) {
    console.error(
        "[mailer] nodemailer introuvable — emails désactivés. Lancez `npm install`.",
        error.message,
    );
}

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER;
const MAIL_TO_OWNER = process.env.MAIL_TO_OWNER || "";

// Transporteur SMTP créé paresseusement (une seule fois), ou null si non configuré.
let transporter = null;

/**
 * Retourne le transporteur SMTP, ou null si la configuration est incomplète.
 * @returns {import("nodemailer").Transporter|null} Transporteur réutilisable, ou null.
 */
function getTransporter() {
    if (!nodemailer || !SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        return null;
    }
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            // 465 = connexion SSL/TLS implicite ; les autres ports (587) passent en STARTTLS.
            secure: SMTP_PORT === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
        });
    }
    return transporter;
}

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
 * Envoie un email via SMTP. No-op (retourne false) si la configuration ou le
 * destinataire manquent. N'émet jamais d'exception : les erreurs sont journalisées.
 * @param {object} params Paramètres de l'email.
 * @param {string} params.to Destinataire.
 * @param {string} params.subject Sujet.
 * @param {string} params.html Corps HTML.
 * @param {string} [params.replyTo] Adresse de réponse (ex. email du client).
 * @returns {Promise<boolean>} Vrai si l'envoi a réussi.
 */
async function sendEmail({ to, subject, html, replyTo }) {
    const tx = getTransporter();
    if (!tx || !to) {
        return false;
    }
    try {
        await tx.sendMail({ from: MAIL_FROM, to, subject, html, replyTo });
        return true;
    } catch (error) {
        console.error("[mailer] Échec de l'envoi SMTP :", error);
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

/**
 * État du mailer pour diagnostic (route de santé) : module chargé, configuration
 * présente, et test de connexion SMTP. N'expose aucun secret (ni le mot de passe).
 * @returns {Promise<object>} Statut détaillé du mailer.
 */
async function verifyMailer() {
    const status = {
        nodemailerLoaded: Boolean(nodemailer),
        configured: Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS),
        host: SMTP_HOST || null,
        port: SMTP_PORT,
        user: SMTP_USER || null,
        from: MAIL_FROM || null,
        owner: MAIL_TO_OWNER || null,
        verified: false,
        error: null,
    };
    const tx = getTransporter();
    if (!tx) {
        status.error = !nodemailer
            ? "nodemailer non installé (npm install)"
            : "configuration SMTP incomplète (SMTP_HOST/USER/PASS)";
        return status;
    }
    try {
        await tx.verify();
        status.verified = true;
    } catch (error) {
        status.error = error.message;
    }
    return status;
}

module.exports = { notifyAppointment, notifyRequest, verifyMailer };
