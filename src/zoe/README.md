# Zoé — le thème de Slyk

**Slyk** est le moteur d'interactions (comportement). **Zoé** est son **thème**
(apparence). Séparés exprès : on change le look sans toucher au comportement, et
un même Slyk sert plusieurs clients avec des Zoé différents.

```
Slyk (comportement)  ←lit→  Zoé (tokens/apparence)  ←fournis par→  le client
```

## Le contrat de tokens

Slyk ne lit **que** ces variables CSS. Zoé leur donne des valeurs.

| Token             | Rôle                                             |
| ----------------- | ------------------------------------------------ |
| `--acc`           | Accent : survols, focus, éléments actifs         |
| `--slyk-ok`       | Positif : coche de sélection, validation (vert)  |
| `--bg`            | Fond des champs / menus                          |
| `--surface`       | Surfaces surélevées (cartes, popovers)           |
| `--txt`           | Texte principal                                  |
| `--muted`         | Texte discret (chevrons, placeholders)           |
| `--line`          | Bordures / séparateurs                           |
| `--radius-button` | Rayon des coins                                  |

Les composants Slyk fournissent aussi des **valeurs de repli**, donc ils
fonctionnent même sans Zoé — mais Zoé donne la cohérence et le branding.

## Utiliser Zoé

Importer le thème une fois (point d'entrée de l'app) :

```js
import "./zoe/tokens.css"; // thème par défaut (sombre neutre)
```

## Faire son thème (re-skin)

Redéfinir les tokens Zoé sur `:root` (ou un scope). Exemple « clair » :

```css
:root {
    --zoe-acc: #2563eb;
    --zoe-bg: #ffffff;
    --zoe-surface: #f4f5f7;
    --zoe-txt: #111111;
    --zoe-muted: #6b7280;
    --zoe-line: rgba(0, 0, 0, 0.12);
    --zoe-radius: 10px;
}
```

Tout Slyk (Dropdown, IconPicker, toasts, drag…) se re-skin automatiquement.

> Nostalgia définit aujourd'hui ses couleurs dans `src/styles.css`. À terme, on
> les exprimera comme un **thème Zoé** (mêmes tokens) — migration triviale, car
> Slyk ne dépend que du contrat ci-dessus.
