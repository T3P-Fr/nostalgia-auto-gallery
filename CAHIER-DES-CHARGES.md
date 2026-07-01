# Roadmap — Nostalgia / Slyk / Zoé

**Vision** : Moteur UI Slyk terminé · Nostalgia en tokens Zoé · Directus intégré (mails + contenu) · Prêt prod.

---

## Stratégie éco — 3 tags simples

Utilise ces tags au début de tes messages pour piloter le modèle :

| Tag | Modèle | Quand |
|-----|--------|-------|
| **#think** | 🔴 Opus | Conception, architecture, décisions complexes |
| **#manage** | 🟡 Sonnet | Implémentation, intégration, déploiement |
| **#make** | 🟢 Haiku | Tâches mécaniques, doc, nettoyage |

**Exemple :**
- `#think Comment organiser le thème Zoé ?`
- `#manage Crée le composant <SaveFeedback>`
- `#make Renomme les variables en camelCase`

---

## Blocs de travail

| Bloc | Intent | État |
|------|--------|------|
| **Slyk — Moteur UI** | Composants réutilisables (SaveFeedback, DeleteBadge, Toast, drag CSS). Partir du patron `<Dropdown>` validé. | En cours |
| **Zoé — Thème** | Exprimer Nostalgia en tokens. Démo light pour prouver le re-skin. | À faire |
| **Directus — Intégration** | Brancher mails (Express), contenu public (gallery/pricing/services). Unifier les dashboards. | À faire |
| **Prod — Exploitation** | Deploy, nettoyage test, règles JS+JSDoc actives. | À faire |

---

### Principes

- **JS + JSDoc**, jamais TypeScript.
- Doc générée depuis les JSDoc.
- UI suit les conventions Slyk (suppression, enregistrement, drag, dropdown).
