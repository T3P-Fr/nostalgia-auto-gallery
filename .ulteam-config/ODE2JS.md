# ODE2JS

> *Une ode au JavaScript. Un pari sur la lisibilité.*
> Écrire clair, vérifier fort, documenter dehors — **sans TypeScript**.

**ODE2JS** est notre moteur de collaboration : une manière de construire des
logiciels robustes, débogables, documentés et sûrs, en **JavaScript pur + JSDoc**,
à l'ère où **l'humain pose le concept et l'IA écrit le code**.

Ce n'est pas « TS c'est mal ». C'est : *TS a résolu un problème d'humain-qui-tape ;
ce problème a changé.* Et son coût — **le bruit visuel dans le code** — n'a plus de
contrepartie suffisante. Or, chez l'humain, **le sens premier c'est la vue**.
Le code, on le **lit** cent fois plus qu'on ne l'écrit. Il doit être **propre à l'œil**.

---

## La thèse en une phrase

TypeScript rendait deux services très différents, empaquetés ensemble :

1. **Le guidage à l'écriture** (autocomplétion, garde-fous pendant qu'on tape).
2. **La vérification** (un contrôle machine qui *échoue* quand une forme ne colle pas).

À l'ère de l'IA, **(1) perd sa valeur** (l'IA déduit les formes du contexte, elle n'a
pas besoin qu'un IDE lui tienne la main). Mais **(2) reste précieux** — c'est un filet
qui attrape *aussi* les erreurs de l'IA.

**Le secret :** on peut garder **(2) sans (1), et sans la syntaxe TS.**

```bash
tsc --checkJs --noEmit    # vérifie du JS PUR annoté en JSDoc. Zéro fichier .ts.
```

On garde **le vérificateur**. On jette **la taxe visuelle**. Voilà ODE2JS.

---

## Les 6 piliers (ce que TS donnait → comment on le tient en JS)

### 1. Contrats & types → **JSDoc** (+ `--checkJs` en filet)
Les types vivent **au-dessus** de la fonction, dans un bloc `/** */`. Le corps reste
du JS limpide. L'éditeur (VS Code) lit les JSDoc : **même autocomplétion, même
« aller à la définition », même rename**.

```js
/**
 * Réordonne une liste par glisser-déposer.
 * @param {object} opts
 * @param {string} opts.scope
 * @param {(fromKey: string, overKey: string) => void} opts.onReorder
 * @returns {{ draggingKey: string|null, startDrag: Function }}
 */
export default function useDragReorder(opts) { /* … JS propre … */ }
```

### 2. Sécurité RÉELLE → **validation runtime aux frontières**
TS s'efface au build : il n'a **jamais** protégé un client d'une donnée réseau
malformée. On valide **là où ça compte** — entrées API, formulaires, I/O — avec des
schémas (maison ou légers). C'est *plus* sûr que TS, pas moins.

### 3. Débogage → **JS natif, sans couche de transpilation**
Pas de build TS = **la ligne qui plante est la ligne que tu as écrite**. Stack traces
vraies, pas de source-maps à retraverser. On complète avec : *guard clauses*, erreurs
**parlantes** (message + contexte), et logs structurés.

### 4. Suivi & refactor → **`--checkJs` + tests**
Un renommage de champ casse un JSDoc ? `tsc --checkJs` le signale. Une logique
métier ? Un **test** (`node --test`, natif) la verrouille. Le refactor est couvert par
la vérification + les tests, pas par la foi.

### 5. Doc externe → **générée depuis les JSDoc**
Les JSDoc **sont** la doc. On génère un site de doc à la demande. Et pour une
**librairie publiée**, on émet les **`.d.ts` à partir des JSDoc** :

```bash
tsc --declaration --allowJs --emitDeclarationOnly   # types publics, zéro TS écrit
```

Les consommateurs (même en TS) ont l'autocomplétion complète. **Nous : zéro TS à
maintenir.**

### 6. Lisibilité → **la vue d'abord**
Le code exécuté est du **JavaScript**. Les types sont *à côté*, jamais *au milieu*.
On lit l'intention, pas la tuyauterie. **Ça ne pique pas les yeux.**

---

## Les règles ODE2JS

**On fait :**
- `.js` / `.jsx` uniquement. Jamais `.ts` / `.tsx`.
- **JSDoc sur toute fonction exportée** : rôle, `@param`, `@returns`. Intention (« pourquoi »), pas le littéral.
- **Valider les frontières** (réseau, entrées) au **runtime**.
- **Tester** la logique non triviale (tests natifs, sans usine à gaz).
- **Erreurs parlantes** : message clair + contexte, pour un humain pressé.
- Fonctions **courtes, à responsabilité unique**, noms explicites.
- `--checkJs` **disponible** comme filet (activable quand un bug de forme nous mord).

**On évite :**
- La gymnastique de types (génériques imbriqués, types conditionnels) — le bruit sans le bénéfice.
- Confondre « ça compile » avec « c'est correct » : la correction se prouve par **runtime + tests**, pas par le typeur.
- Le build inutile : moins d'étapes entre le code écrit et le code exécuté.

---

## Objections (et pourquoi elles ne tiennent pas)

**« Sans TS, tu ne détectes pas les erreurs de type. »**
Si : `tsc --checkJs` sur JSDoc détecte les mêmes. On garde le contrôle, on lâche la syntaxe.

**« Les gros projets ont besoin de TS pour tenir. »**
Ce qui tient un gros projet : contrats clairs, tests, validation aux bords, doc. ODE2JS
livre les quatre. Des projets majeurs sont d'ailleurs **revenus au JS + JSDoc**.

**« Le refactor est plus sûr en TS. »**
Le refactor est sûr avec **vérification + tests**. `--checkJs` fournit la première,
`node --test` la seconde. En JS.

**« TS, c'est de la documentation vivante. »**
Les JSDoc aussi — et *elles*, on peut les lire sans décoder des génériques.

**« TS sécurise l'appli. »**
Non. TS s'efface à l'exécution. La sécurité, c'est le **runtime**. ODE2JS met l'effort
là où le danger est réel.

---

## Le pari

L'ère change : **l'humain conçoit, l'IA écrit, la machine vérifie.** Dans ce monde, la
valeur d'un langage se mesure à **ce qu'un humain lit**, pas à ce qu'un humain tape.

On parie qu'on peut avoir **la robustesse d'un projet typé** avec **la clarté d'un
projet JS** — en séparant *écrire* (JS propre), *vérifier* (checkJs + tests + runtime)
et *documenter* (JSDoc → doc & `.d.ts`).

**Ce document est public. Défie-le.** Montre-nous un bénéfice de TS qu'ODE2JS ne
couvre pas *sans piquer les yeux*. On écoute — et on affinera au grand jour.

---

*ODE2JS — écrire pour les yeux, vérifier pour la machine.*
