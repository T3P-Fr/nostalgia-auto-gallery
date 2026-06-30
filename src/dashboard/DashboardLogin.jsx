import { useState } from "react";
import { login } from "./directusClient.js";

/**
 * Écran de connexion du Dashboard, aux couleurs du site. Demande l'email et le
 * mot de passe du compte Directus du gérant, puis prévient le parent en cas de
 * succès pour basculer vers le tableau de bord.
 * @param {object} props Propriétés du composant.
 * @param {() => void} props.onAuthenticated Appelé une fois la connexion réussie.
 * @returns {JSX.Element} Le formulaire de connexion.
 */
export default function DashboardLogin({ onAuthenticated }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // Message d'erreur affiché sous le formulaire (identifiants refusés…).
    const [error, setError] = useState("");
    // Empêche les doubles soumissions pendant l'appel réseau.
    const [submitting, setSubmitting] = useState(false);

    /**
     * Soumet le formulaire : tente la connexion et remonte le succès au parent.
     * @param {React.FormEvent} event Événement de soumission du formulaire.
     * @returns {Promise<void>} Aucune valeur de retour.
     */
    async function handleSubmit(event) {
        // On bloque le rechargement de page par défaut du navigateur.
        event.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await login(email, password);
            onAuthenticated();
        } catch (loginError) {
            // Message lisible renvoyé par le client Directus.
            setError(loginError.message || "Connexion impossible.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="dashboard-login">
            <form className="dashboard-login__card" onSubmit={handleSubmit}>
                <span className="overline">Espace gérant</span>
                <h1>Nostalgia Auto Gallery</h1>
                <p className="dashboard-login__intro">
                    Connectez-vous pour gérer vos réalisations, votre galerie, vos forfaits
                    et vos disponibilités.
                </p>

                {/* Champ email du compte Directus. */}
                <label className="dashboard-field">
                    <span>Email</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="username"
                        required
                    />
                </label>

                {/* Champ mot de passe. */}
                <label className="dashboard-field">
                    <span>Mot de passe</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </label>

                {error && <p className="form-error">{error}</p>}

                <button className="button" type="submit" disabled={submitting} title="Se connecter avec votre email et mot de passe">
                    {submitting ? "Connexion…" : "Se connecter"}
                </button>
            </form>
        </div>
    );
}
