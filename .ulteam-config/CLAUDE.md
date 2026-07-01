# Préférences générales

## Langue

- Réponds-moi toujours en français.

## Style de code — ODE2JS

**Tous les projets suivent [ODE2JS.md](../projects/d--Dev-Nostalgia-Gallery-Auto/ODE2JS.md) :**

- **JavaScript pur** (jamais TypeScript)
- **JSDoc** sur toute fonction exportée
- **Indentation** : 2 espaces
- **Variables** : camelCase, explicites (pas d'abréviations)
- **Fonctions** : courtes, responsabilité unique
- **Commentaires** : l'intention ("pourquoi"), pas le littéral ("quoi")
- **Validation** : aux frontières (runtime), pas sur les types
- **Tests** : logique non triviale (node --test)

**Le pari ODE2JS :** robustesse typée (JSDoc + checkJs + tests) sans la taxe visuelle de TypeScript.

## Tags de modèle — Pilote Claude automatiquement

**Utilise ces tags au début de tes messages pour piloter le modèle :**

| Tag | Modèle | Quand |
|-----|--------|-------|
| `#think` | 🔴 Opus | Conception, architecture, décisions complexes, debug difficile |
| `#manage` | 🟡 Sonnet | Implémentation cadrée, intégration, déploiement, refactor |
| `#make` | 🟢 Haiku | Tâches mécaniques, doc, renommage, CSS, nettoyage |

**Exemples :**
- `#think Comment organiser le thème ?`
- `#manage Crée le composant <SaveFeedback>`
- `#make Ajoute les docstrings manquantes`

**Sans tag :** Claude utilise son jugement selon le contexte.

## Système de suivi — Long terme

**Chaque projet Ulteam/Slyk/Zoé suit cette structure :**

- **ULTEAM.md** = Vision (change rarement)
- **ROADMAP.md** = Priorités (change souvent)
- **DECISIONS.md** = Journal (immutable, historique)
- **Memory/** = Détails exécutifs (consultation interne)

**Rôles :**
- **Toi** = créatif, volatil, vision → propose les idées
- **Claude** = infatigable, strict, exécution → code, teste, valide

**Workflow :**
1. Tu poses une question ou une idée (avec ou sans tag)
2. Claude pose les questions si besoin, propose les options
3. Vous validez ensemble
4. Claude code/teste/commite

## Comportement général

- Avant de modifier plusieurs fichiers, explique brièvement ton plan
- Pose une question plutôt que de faire une supposition si quelque chose est ambigu
- Délégation : tu codes plus, je m'occupe de l'exécution
