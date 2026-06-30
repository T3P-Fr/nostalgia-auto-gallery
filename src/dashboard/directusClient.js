/*
 * Client minimal pour l'API Directus, utilisé par le Dashboard du gérant.
 * Centralise : l'URL de l'API, la connexion (login/refresh/logout), les appels
 * authentifiés, l'upload de fichiers et la construction des URLs d'images.
 *
 * On évite volontairement le SDK officiel pour rester léger : quelques fetch
 * suffisent et restent faciles à lire/maintenir.
 */

// URL de base de l'instance Directus. En développement, Directus tourne en local
// sur le port 8055 (cf. cms/.env). En production, on la surchargera via la
// variable d'environnement Vite VITE_DIRECTUS_URL (ex. https://admin.monsite.fr).
// La regex retire un éventuel slash final pour éviter les doubles « // » dans les URLs.
const DIRECTUS_URL = (import.meta.env.VITE_DIRECTUS_URL || "http://localhost:8055").replace(/\/$/, "");

// Clés de stockage des jetons dans le navigateur. On garde le jeton d'accès et le
// jeton de rafraîchissement pour prolonger la session sans redemander le mot de passe.
const ACCESS_TOKEN_KEY = "nag-directus-access";
const REFRESH_TOKEN_KEY = "nag-directus-refresh";

/**
 * Lit le jeton d'accès courant depuis le stockage local.
 * @returns {string} Le jeton d'accès, ou une chaîne vide s'il n'y en a pas.
 */
export function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

/**
 * Mémorise les jetons renvoyés par Directus après connexion/rafraîchissement.
 * @param {string} accessToken Jeton d'accès (Bearer).
 * @param {string} refreshToken Jeton de rafraîchissement.
 * @returns {void} Aucune valeur de retour.
 */
function storeTokens(accessToken, refreshToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
}

/**
 * Efface les jetons (déconnexion ou session expirée non rafraîchissable).
 * @returns {void} Aucune valeur de retour.
 */
function clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Connecte le gérant avec son email et son mot de passe Directus.
 * @param {string} email Email du compte gérant.
 * @param {string} password Mot de passe du compte gérant.
 * @returns {Promise<void>} Résolue une fois les jetons enregistrés.
 * @throws {Error} Si les identifiants sont refusés.
 */
export async function login(email, password) {
    // Appel public (sans jeton) au point d'authentification de Directus.
    const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        // Directus renvoie un message d'erreur structuré ; on le remonte tel quel.
        const message = payload?.errors?.[0]?.message || "Identifiants invalides.";
        throw new Error(message);
    }
    storeTokens(payload.data.access_token, payload.data.refresh_token);
}

/**
 * Déconnecte le gérant : invalide la session côté Directus puis efface les jetons.
 * @returns {Promise<void>} Aucune valeur de retour.
 */
export async function logout() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    // On tente d'invalider la session serveur, mais on n'échoue jamais la
    // déconnexion locale même si l'appel réseau plante.
    if (refreshToken) {
        await fetch(`${DIRECTUS_URL}/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
        }).catch(() => {});
    }
    clearTokens();
}

/**
 * Tente de prolonger la session via le jeton de rafraîchissement.
 * @returns {Promise<boolean>} Vrai si un nouveau jeton d'accès a été obtenu.
 */
async function refreshSession() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
        return false;
    }
    const response = await fetch(`${DIRECTUS_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) {
        // Rafraîchissement impossible (jeton expiré) : on nettoie pour forcer un
        // nouveau login.
        clearTokens();
        return false;
    }
    const payload = await response.json();
    storeTokens(payload.data.access_token, payload.data.refresh_token);
    return true;
}

/**
 * Effectue un appel authentifié à l'API Directus, avec rafraîchissement
 * automatique du jeton en cas d'expiration (un seul réessai pour éviter les boucles).
 * @param {string} pathWithQuery Chemin d'API (ex. "/items/realisations?limit=10").
 * @param {object} [options] Options fetch (method, body déjà sérialisé, headers…).
 * @param {boolean} [isRetry] Usage interne : indique qu'on est déjà dans le réessai.
 * @returns {Promise<any>} Le contenu du champ `data` de la réponse Directus.
 * @throws {Error} En cas d'erreur réseau ou d'erreur métier remontée par Directus.
 */
export async function apiFetch(pathWithQuery, options = {}, isRetry = false) {
    // En-têtes : on ajoute systématiquement le Bearer ; on ne force le
    // Content-Type JSON que si l'appelant n'envoie pas un FormData (upload).
    const headers = { ...(options.headers || {}) };
    headers.Authorization = `Bearer ${getAccessToken()}`;
    const sendingFormData = options.body instanceof FormData;
    if (!sendingFormData && options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${DIRECTUS_URL}${pathWithQuery}`, { ...options, headers });

    // Jeton expiré : on tente UN rafraîchissement puis on rejoue l'appel.
    if (response.status === 401 && !isRetry) {
        const refreshed = await refreshSession();
        if (refreshed) {
            return apiFetch(pathWithQuery, options, true);
        }
    }

    // Réponse sans corps (ex. 204 sur DELETE) : on renvoie null proprement.
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;
    if (!response.ok) {
        const message = payload?.errors?.[0]?.message || "Erreur de communication avec le serveur.";
        throw new Error(message);
    }
    return payload ? payload.data : null;
}

/**
 * Téléverse un fichier (image/vidéo) vers la bibliothèque de médias Directus.
 * Directus stocke le fichier et génère les déclinaisons (miniatures, WebP) à la demande.
 * @param {File} file Fichier issu d'un <input type="file"> ou d'un glisser-déposer.
 * @returns {Promise<object>} L'objet fichier créé (contient notamment `id`).
 */
export async function uploadFile(file) {
    // L'upload Directus attend un multipart/form-data ; le champ DOIT s'appeler "file".
    const formData = new FormData();
    formData.append("file", file);
    // On laisse apiFetch gérer l'authentification et le rafraîchissement de jeton.
    return apiFetch("/files", { method: "POST", body: formData });
}

/**
 * Construit l'URL d'affichage d'un fichier Directus, éventuellement redimensionné.
 * Le jeton d'accès est passé en paramètre d'URL car une balise <img> ne peut pas
 * porter d'en-tête Authorization.
 * @param {string} fileId Identifiant du fichier Directus.
 * @param {object} [transform] Transformations (width, height, fit, format…).
 * @returns {string} L'URL complète de l'image, prête pour un attribut src.
 */
export function assetUrl(fileId, transform = {}) {
    if (!fileId) {
        return "";
    }
    // On part des transformations demandées + le jeton, puis on encode le tout.
    const params = new URLSearchParams({ ...transform, access_token: getAccessToken() });
    return `${DIRECTUS_URL}/assets/${fileId}?${params.toString()}`;
}

/**
 * Indique si une session est ouverte (présence d'un jeton d'accès).
 * @returns {boolean} Vrai si l'utilisateur semble connecté.
 */
export function isAuthenticated() {
    return Boolean(getAccessToken());
}
