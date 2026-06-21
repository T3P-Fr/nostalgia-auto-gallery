# Nostalgia Auto Gallery

Application React fidèle au handoff `Nostalgia Auto Gallery.dc.html`, avec une API
Express persistante pour la gestion des rendez-vous.

## Démarrage

```bash
npm install
npm run dev
```

- Site : <http://localhost:5173>
- API : <http://localhost:3001>
- Gestion : <http://localhost:5173/admin>

La clé administrateur de développement est `nostalgia-admin`. Pour la remplacer :

```powershell
$env:ADMIN_KEY="une-cle-longue-et-secrete"
npm run dev
```

## Production

```bash
npm run build
$env:ADMIN_KEY="une-cle-longue-et-secrete"
npm start
```

Les rendez-vous sont stockés dans `server/data/appointments.json`, créé
automatiquement au premier démarrage.
