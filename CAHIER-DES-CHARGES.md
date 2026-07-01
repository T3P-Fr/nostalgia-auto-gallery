# Cahier des charges — Nostalgia / Slyk / Zoé

Feuille de route **économique** : chaque tâche indique le **modèle recommandé**.
Principe : la puissance (donc le coût) **là où ça compte** (conception), un modèle
léger pour l'**exécution déjà cadrée**.

## Choix du modèle (`/model` dans Claude Code)

| Modèle | Quand | Exemples |
| --- | --- | --- |
| 🟣 **Opus** | Conception, architecture, décisions, debug difficile, revue | Design d'un composant nouveau, mapping Directus, choix techniques |
| 🔵 **Sonnet** | Implémentation **cadrée**, refactor guidé, wiring, déploiement | Créer un composant sur un patron validé, brancher une API, build+deploy |
| 🟢 **Haiku** | Mécanique **triviale** | Renommage, `@private`, petit CSS, régénérer la doc, nettoyer des données |

> Workflow éco : **1 conversation courte par chantier** · salves **rapprochées** (cache
> ~5 min) · relais par **mémoire + git** · **prompts précis** (moins d'allers-retours).

---

## A. Slyk — finir le cœur du moteur *(patron `<Dropdown>` déjà validé)*

| # | Tâche | Modèle | Fini quand |
| --- | --- | --- | --- |
| A1 | `<SaveFeedback>` (bordure + toast « Enregistré » vert) → composant + CSS extrait de `styles.css` | 🔵 Sonnet | Utilisé dans Forfaits/Settings à la place de `savedFx` inline |
| A2 | `<DeleteBadge>` (corbeille ronde + survol rouge de la cible via `:has`) → composant + CSS | 🔵 Sonnet | Utilisé partout à la place de `.delete-badge` inline |
| A3 | `<Toast>` générique (variantes erreur/info) — généralise `ErrorToast` | 🔵 Sonnet | `ErrorToast` = un préréglage de `<Toast>` |
| A4 | Extraire le CSS drag (`.is-dnd-ghost`, `.drag-clone`, `.drag-grip`) dans `src/slyk/` | 🔵 Sonnet | Plus de CSS drag dans `styles.css` |
| A5 | Marquer les fns internes du hook `@private` (doc propre) | 🟢 Haiku | `API.md` ne liste plus `onMove`/`onUp` |
| A6 | Régénérer la doc après chaque ajout | 🟢 Haiku | `npm run docs:slyk` à jour |

## B. Zoé — le thème

| # | Tâche | Modèle | Fini quand |
| --- | --- | --- | --- |
| B1 | Exprimer Nostalgia comme **thème Zoé** (mapper `styles.css` → tokens) sans casser le look | 🟣 Opus (cadrage) → 🔵 Sonnet | Nostalgia importe un thème Zoé, rendu identique |
| B2 | 2e thème de démo (clair) pour prouver le re-skin | 🟢 Haiku | Bascule visible en changeant les tokens |

## C. Intégration application

| # | Tâche | Modèle | Fini quand |
| --- | --- | --- | --- |
| C1 | Brancher l'Express (RDV) sur `mail_config`/`mail_accounts` Directus (fallback `.env`) | 🟣 Opus (design) → 🔵 Sonnet | Envoi mail piloté depuis le Dashboard |
| C2 | Brancher le **site public** sur Directus (remplacer `content.json` : gallery/pricing/services) | 🟣 Opus (mapping) → 🔵 Sonnet | Le site lit Directus, `content.json` retiré |
| C3 | Retirer le `/dashboard` doublon du site principal | 🔵 Sonnet | Seul `admin.` sert le Dashboard |

## D. Exploitation / prod

| # | Tâche | Modèle | Fini quand |
| --- | --- | --- | --- |
| D1 | Déploiement (build → tar → scp → restart) | 🔵 Sonnet | Site + admin à jour, vérifiés 200 |
| D2 | Changer le mot de passe admin Directus + nettoyer les niveaux de test | 🟢 Haiku | Fait |
| D3 | Câbler `ODE2JS.md` → `~/.claude/CLAUDE.md` (directive condensée + pointeur) | 🔵 Sonnet | Règle JS+JSDoc active dans tous les projets *(besoin de l'emplacement du fichier)* |

## E. Futur

| # | Tâche | Modèle |
| --- | --- | --- |
| E1 | Sortir `slyk/` + `zoe/` en pack(s) NPM + `.d.ts` générés des JSDoc (au 2e client) | 🟣 Opus |
| E2 | Nouvelles fonctionnalités / décisions d'architecture | 🟣 Opus |

---

### Règles transverses (rappel)
- **JS + JSDoc, jamais TypeScript** (voir `ODE2JS.md`).
- Doc = générée depuis les JSDoc (`npm run docs:slyk`).
- Conventions UI = celles de Slyk (suppression, enregistrement, drag, dropdown, « ne pas re-sélectionner l'actif »).
