# Déploiement de Nostalgia Auto Gallery sur o2switch

Cette application **n'est pas un site statique** : elle a un backend Express
(`server/index.js`) qui gère la prise de rendez-vous et l'espace admin. Il faut
donc la déployer comme une **application Node.js** via l'outil cPanel
**Setup Node.js App** (moteur Phusion Passenger), et pas comme un simple upload
dans `public_html`.

Le frontend (React/Vite) est compilé en fichiers statiques (`dist/`) puis servi
par le même serveur Express. Tout passe par une seule origine, le `/api` est
géré par Express.

---

## 1. Construire le frontend (en local, sur le MiniPC)

Dans le dossier du projet :

```bash
npm install
npm run build
```

Cela crée le dossier `dist/`. **S'il y a une erreur, arrête-toi ici et envoie-la-moi.**

---

## 2. Préparer le dossier à envoyer

Sur le serveur, l'application vivra dans un dossier **à la racine de
l'hébergement** (ex. `~/nostalgia-app`), séparé du dossier du domaine.

Tu dois envoyer dans ce dossier uniquement :

```
nostalgia-app/
├── dist/                ← généré par npm run build
├── server/
│   ├── index.js
│   └── store.js
├── package.json
└── package-lock.json    ← s'il existe
```

À **ne pas** envoyer : `node_modules/` (sera réinstallé sur le serveur),
`src/`, `public/`, `vite.config.js` (inutiles en production).

> Le dossier `server/data/` se créera tout seul au premier rendez-vous.

---

## 3. Envoyer les fichiers sur o2switch

Méthode recommandée : **Gestionnaire de fichiers cPanel** (ou FileZilla en SFTP).

1. cPanel → **Gestionnaire de fichiers**.
2. À la racine (`/home/TON_IDENTIFIANT/`), crée le dossier `nostalgia-app`.
3. Entre dedans et uploade `dist/`, `server/`, `package.json`,
   `package-lock.json` en respectant l'arborescence ci-dessus.
   (Astuce : zippe le tout en local, uploade le zip, puis « Extraire » dans cPanel.)

---

## 4. Créer l'application Node.js dans cPanel

1. cPanel → **Setup Node.js App** → **Create Application**.
2. Renseigne :
   - **Node.js version** : `22` (compatible Express 5 / React 19).
   - **Application mode** : `Production`.
   - **Application root** : `nostalgia-app`.
   - **Application URL** : ton domaine (ou sous-domaine) cible.
   - **Application startup file** : `server/index.js`.
   - **Passenger log file** : laisse par défaut (utile pour le débogage).
3. Clique **Create**.

> ⚠️ L'outil crée parfois un « Hello World » par défaut (`app.js`, `node_modules`,
> `public`, `tmp`) dans le dossier. Si tu vois un `app.js` qui n'est pas le tien,
> ce n'est pas grave : notre point d'entrée est bien `server/index.js`. Ne
> supprime pas `node_modules` après l'install de l'étape 6.

---

## 5. Définir la clé administrateur

L'espace admin est protégé par une clé. Par défaut c'est `nostalgia-admin` —
**à changer absolument**.

Dans l'écran de l'application Node (bouton crayon) → **Add Variable** :

- **Name** : `ADMIN_KEY`
- **Value** : une chaîne longue et secrète (ex. générée au hasard).

Enregistre (**Save**). C'est cette valeur que tu saisiras dans la page `/admin`
du site pour gérer les rendez-vous.

---

## 6. Installer les dépendances

Toujours dans l'écran de l'application :

- Section **Detected configuration files** → l'outil détecte `package.json` →
  clique **Run NPM Install**.

Si l'install échoue pour cause de mémoire (erreurs `out of memory`, `fork failed`),
fais-la plutôt via un vrai client SSH : copie la commande `source ...` affichée
en haut de l'écran, colle-la dans le terminal SSH, puis lance `npm install`.

---

## 7. Démarrer / redémarrer

Clique **Restart**. L'application doit passer en statut **démarré**.

Visite ton domaine : le site doit s'afficher, et le formulaire de réservation
doit fonctionner (créneaux, envoi).

---

## En cas de problème

- **Timeout au démarrage (~90 s)** : Passenger n'a pas réussi à se greffer sur
  `listen()`. Le code a déjà été adapté pour ça (mot-clé `passenger`), donc
  vérifie surtout que **startup file = `server/index.js`** et que le dossier
  `dist/` est bien présent dans `nostalgia-app`.
- **Page blanche / 404 sur les sous-pages** : vérifie que `dist/index.html`
  existe bien dans le dossier uploadé.
- **Activer les erreurs détaillées** : ajoute dans le `.htaccess` à la racine du
  domaine :
  ```apacheconf
  PassengerAppEnv development
  PassengerFriendlyErrorPages on
  ```
  (à retirer une fois le débogage terminé).
- Les erreurs sont aussi visibles dans cPanel → **Erreurs** (logs Apache) et
  dans le **Passenger log file** défini à l'étape 4.

---

## Mises à jour ultérieures

Pour publier une nouvelle version :

1. `npm run build` en local.
2. Remplace `dist/` (et `server/` si tu l'as modifié) sur le serveur.
3. cPanel → Setup Node.js App → **Restart**.
