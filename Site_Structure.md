# Nostalgia Auto Gallery — Structure du site (v3, recentrée SEO)

> Document de référence pour la refonte éditoriale et structurelle.
> Rédigé selon un audit d'expert en SEO automobile local.
> Principe directeur : **detailing en vedette, navigation courte, un seul CTA.**
> *Mis à jour pour correspondre au site réellement implémenté (branche `v3`).*

---

## 1. Audit express — pourquoi le site manquait de clarté

Constats sur l'ancienne structure (9 routes) et corrections retenues :

| Problème constaté | Conséquence | Correction apportée |
|---|---|---|
| **Trois métiers au même niveau** (detailing + véhicules + pièces) | Le visiteur ne comprend pas le cœur de l'offre ; Google ne sait pas sur quoi positionner le site | **Detailing en vedette** ; le négoce devient **un second pilier assumé** (achat, vente, pièces réunis sur une seule page Négoce). |
| **Trop de pages** (9 routes, dont 3 sous-pages négoce) | Contenu dilué, autorité SEO éparpillée, maillage confus | **Menu court (4 entrées)** + pages support ; chaque page a une intention unique. |
| **Trop d'appels à l'action** (« Découvrir », « Demander un devis », « Présenter mon véhicule »…) | L'œil ne sait plus où cliquer ; conversion en baisse | **Un seul CTA principal** partout : *Prendre rendez-vous* (bouton d'en-tête + fins de page). Le téléphone et l'entrée « Contact » ont été retirés de l'en-tête pour ne pas concurrencer le bouton. |
| **Pages à 10 sections** (l'accueil notamment) | Surcharge, scroll interminable, message noyé | **4 à 6 sections par page**, hiérarchisées. |
| **Aucune cible géographique exploitée** | Pas de visibilité sur les recherches locales | SEO local assumé : Parignargues, Nîmes, Gard. |
| **Vocabulaire interne** (« Platine / Premium / Deluxe ») mis en avant avant le bénéfice | Le visiteur cherche un résultat, pas un nom de gamme | On mène par le **bénéfice** ; le nom de formule vient après. |

### Le positionnement à tenir

> **Nostalgia Auto Gallery, c'est d'abord le detailing automobile à domicile dans le Gard.**
> Le **négoce** (achat, vente, préparation avant vente, recherche de pièces) est un **second pilier**, présent dans le menu mais après le detailing, et toujours raconté avec la même sobriété.

Le visiteur doit comprendre en 3 secondes *ce qu'on fait*, *où*, et *quoi faire ensuite*.

---

## 2. Principes directeurs

1. **1 page = 1 intention de recherche.** Pas de page « fourre-tout ».
2. **1 CTA principal** (Prendre rendez-vous), répété aux moments clés, jamais en concurrence avec d'autres boutons.
3. **Le bénéfice avant la technique.** On parle résultat, pas process.
4. **SEO local d'abord.** Le nom de la ville et de la zone est présent dans les titres, les textes et les balises.
5. **Preuve sociale et avant/après** en évidence : déclencheur de confiance n°1 dans ce métier.
6. **Sobriété visuelle.** Une section = une idée.

---

## 3. Arborescence réelle

```
Accueil  ───────────────  Promesse, formules en aperçu, preuve, déroulement, zone, RDV
   │
   ├── Négoce  ──────────  Achat, vente, préparation avant vente, recherche de pièces
   │
   ├── Detailing  ───────  L'offre détaillée + tarifs + FAQ        (page argent)
   │
   ├── Réalisations  ────  Avant/après + galerie + avis            (page preuve)
   │
   ├── À propos  ────────  Corentin, l'approche, la confiance      (hors menu : footer)
   │
   ├── Contact & RDV  ───  Formulaire de réservation + zone        (via bouton « Prendre RDV »)
   │
   └── Informations  ────  Mentions légales · confidentialité · conditions (footer, page unique)
```

### Menu principal (en-tête)

`Accueil · Négoce · Detailing · Réalisations`

Bouton d'en-tête (toujours visible, unique CTA) : **Prendre rendez-vous** → `/contact`
*(Pas de numéro de téléphone ni d'entrée « Contact » dans l'en-tête : le bouton concentre l'action.)*

### Pages hors menu

- **À propos** et **Informations** : accessibles depuis le **pied de page**.
- **Contact & rendez-vous** : atteinte par le bouton **Prendre rendez-vous** (et le pied de page).

> Évolution depuis la première version du document : le négoce, d'abord relégué à une section d'À propos, est désormais **une page à part entière placée en 2ᵉ position du menu**. Le detailing reste néanmoins la promesse portée par l'accueil et le héros. Compromis SEO assumé : on accepte un second univers thématique pour servir une réalité commerciale, tout en gardant le detailing comme tête de gondole.

---

## 4. Mots-clés cibles (SEO local)

| Page | Mot-clé principal | Intentions secondaires |
|---|---|---|
| Accueil | `detailing automobile à domicile Gard` | `nettoyage voiture à domicile Nîmes`, `detailing Parignargues` |
| Négoce | `achat vente voiture occasion Gard` | `recherche pièces automobiles`, `préparation véhicule avant vente Nîmes` |
| Detailing | `formules detailing voiture` | `nettoyage intérieur voiture prix`, `lavage extérieur à la main`, `rénovation phares Gard` |
| Réalisations | `detailing avant après` | `rénovation carrosserie photos`, `nettoyage voiture résultat` |
| À propos | `detailing automobile Corentin Jammes` | `detailer Gard`, `préparation esthétique auto Nîmes` |
| Contact | `prendre rendez-vous detailing Gard` | `devis nettoyage voiture domicile` |

Communes à viser : **Parignargues, Nîmes, Caveirac, Calvisson, Sommières, Uzès, Vauvert, Saint-Gilles** (rayon ~25 km).

---

## 5. Détail page par page

> Gabarit commun : **balises SEO → H1 → sections (peu nombreuses) → CTA unique**.
> ⚠️ Les balises `<title>`/`<meta>` ci-dessous sont la **cible éditoriale** ; elles ne sont pas encore injectées dans l'app (SPA sans gestion de `<head>`, cf. § 7).

---

### Page 1 — Accueil  (`/`)

**Intention :** comprendre l'offre en 3 secondes et inciter à réserver.

- **Title :** `Detailing automobile à domicile dans le Gard | Nostalgia Auto Gallery`
- **Meta :** `Nettoyage et rénovation esthétique de votre voiture à domicile autour de Parignargues et Nîmes. Lavage à la main, formules dès 65 €. Prenez rendez-vous.`
- **H1 :** `Le soin que mérite chaque voiture.`

**Sections :**

1. **En-tête** : promesse + géographie + bouton *Prendre rendez-vous* (+ lien secondaire *Voir les formules*) + 3 chiffres clés.
2. **Bandeau de réassurance** (pleine largeur, rouge, blanc) : lavage à la main · produits pro · 15 km offerts · devis.
3. **Les 3 formules en aperçu** (Intérieur / Extérieur / Complète) → lien vers Detailing.
4. **Avant / après** (1 comparateur) → lien vers Réalisations.
5. **Comment ça se passe** (4 étapes).
6. **Zone d'intervention** + **CTA final** *Prendre rendez-vous*.

---

### Page 2 — Négoce  (`/negoce`)

**Intention :** présenter le second pilier (achat, vente, pièces) et orienter vers le contact.

- **Title :** `Négoce automobile — achat, vente et recherche de pièces dans le Gard | Nostalgia Auto Gallery`
- **Meta :** `Accompagnement pour l'achat, la vente, la préparation avant vente et la recherche de pièces automobiles dans le Gard, autour de Parignargues et Nîmes.`
- **H1 :** `Votre projet auto, suivi avec attention.`

**Sections :**

1. **En-tête** + CTA *Présenter mon projet*.
2. **Acheter un véhicule** (recherche & sélection).
3. **Vendre un véhicule** (étude de l'automobile).
4. **Préparation avant vente** (valorisation esthétique).
5. **Recherche de pièces** (pièces & solutions).
6. **Méthode d'accompagnement** en 4 étapes (bandeau rouge).
7. **Véhicules actuellement proposés** (pas de stock fictif) + CTA *Me confier une recherche*.

---

### Page 3 — Detailing *(page argent)*  (`/detailing`)

**Intention :** comparer les formules et réserver.

- **Title :** `Formules de detailing et nettoyage auto à domicile | Nostalgia Auto Gallery`
- **Meta :** `Nettoyage intérieur, extérieur ou complet à domicile dans le Gard. Formules Platine, Premium et Deluxe dès 65 €. Détail des prestations et options.`
- **H1 :** `Le bon soin, au bon niveau.`

**Sections :**

1. **En-tête** + CTA *Prendre rendez-vous*.
2. **Choisir son type** : Intérieur · Extérieur · Complète.
3. **Les formules en détail** : Intérieur et Extérieur (Platine / Premium / Deluxe) avec prestations, durée, prix, bouton *Réserver*.
4. **Révision de base (complément méca)** : présentée à part, **uniquement avec un lavage**, prix en « + X € », offerte avec un lavage complet.
5. **Options à la carte** (odeurs, moteur, phares, lustrage).
6. **FAQ** (accordéon, 5 questions).
7. **CTA final** : *Un doute entre deux formules ? Demander conseil.*

---

### Page 4 — Réalisations *(page preuve)*  (`/realisations`)

**Intention :** rassurer par la preuve et les avis.

- **Title :** `Réalisations detailing — avant / après | Nostalgia Auto Gallery`
- **Meta :** `Découvrez les nettoyages et rénovations réalisés à domicile dans le Gard : avant/après, détails et avis clients de Nostalgia Auto Gallery.`
- **H1 :** `Le résultat parle de lui-même.`

**Sections :**

1. **En-tête.**
2. **Grand comparateur avant/après** + **cartes d'exemples** (une image + pills Avant/Après ; clic = défilement vers le comparateur).
3. **Galerie de photos** (clic = zoom plein écran via modal natif).
4. **Avis clients authentiques** (bandeau rouge).
5. **Note de transparence.**
6. **CTA final** : *Le prochain avant-après peut être le vôtre → Prendre rendez-vous.*

---

### Page 5 — À propos  (`/a-propos`, hors menu)

**Intention :** créer la confiance via la personne et l'approche honnête.

- **Title :** `À propos — Corentin Jammes, detailing dans le Gard | Nostalgia Auto Gallery`
- **Meta :** `Découvrez Corentin Jammes et l'approche de Nostalgia Auto Gallery : un detailing soigné, à domicile dans le Gard, guidé par la passion et la transparence.`
- **H1 :** `La passion, mise à votre service.`

**Sections :**

1. **En-tête.**
2. **L'interlocuteur unique** : présentation de Corentin.
3. **Les 3 engagements** : expertise & rigueur · passion · proximité & mobilité.
4. **Au-delà du detailing** : courte passerelle vers la page **Négoce** (*Découvrir le négoce →*).

---

### Page 6 — Contact & rendez-vous  (`/contact`, via le bouton « Prendre RDV »)

**Intention :** convertir la demande en rendez-vous.

- **Title :** `Contact et prise de rendez-vous | Nostalgia Auto Gallery`
- **Meta :** `Demandez votre rendez-vous detailing à domicile dans le Gard. Vérifiez votre zone autour de Parignargues et Nîmes. Confirmation par téléphone.`
- **H1 :** `Parlons de votre véhicule.`

**Sections :**

1. **Formulaire de réservation** en 4 étapes : besoin → véhicule (+ photos) → lieu & créneau → coordonnées + consentement.
2. **Coordonnées directes** (téléphone, email, Instagram, localisation).
3. **Zone d'intervention** (15 km offerts, supplément au-delà).
4. **Mention rassurante** : *Aucun paiement en ligne. Rendez-vous définitif après confirmation par téléphone.*

> Le complément méca de la grille est désélectionnable et **exige au moins un lavage** (offert avec un lavage complet).

---

### Page support — Informations  (`/informations`, footer)

Mentions légales, politique de confidentialité et conditions de réservation **réunies sur une seule page**, chacune en section ancrée (`#mentions-legales`, `#confidentialite`, `#conditions`) séparée par un petit trait.

---

## 6. Éléments communs

### Bandeaux pleine largeur
Fond **rouge plein**, contenu **blanc**, padding vertical généreux (réassurance, sections « méthode » et « avis »).

### Pied de page (3 colonnes)
1. **Présentation** : marque + une phrase + SIRET.
2. **Navigation** : Accueil · Négoce · Detailing · Réalisations · À propos · Contact et rendez-vous · Informations.
3. **Contact** : téléphone · email · Instagram · Parignargues – Gard (30).

Les liens légaux vivent dans la page **Informations** (plus de colonne dédiée).

---

## 7. Recommandations techniques SEO

- **Balises `<title>`/`<meta>`/`<head>` par page** : **à implémenter** (l'app est une SPA React sans gestion du `<head>` — prévoir un composant type `react-helmet` ou un pré-rendu). Les balises du § 5 sont prêtes.
- **Données structurées (Schema.org)** : `LocalBusiness` / `AutoDetailing` (adresse, `areaServed`, horaires, téléphone, avis).
- **Google Business Profile** : fiche optimisée (catégorie Detailing), photos avant/après, avis.
- **Une seule balise H1 par page**, hiérarchie H2/H3 propre.
- **Images** : noms de fichiers descriptifs (`detailing-interieur-nimes.jpg`), `alt` renseigné, WebP, lazy-loading.
- **Performance** : LCP < 2,5 s.
- **Maillage interne** : chaque page renvoie vers *Detailing* et *Contact*.
- **URLs réelles** : `/`, `/negoce`, `/detailing`, `/realisations`, `/a-propos`, `/contact`, `/informations`. Prévoir des redirections 301 depuis les anciennes URLs si le site était déjà en ligne.

---

## 8. Ce qui change concrètement par rapport à l'ancienne version

| Avant | Après |
|---|---|
| 9 pages, 3 métiers au même niveau | Menu à 4 entrées, **detailing en vedette + Négoce en 2ᵉ pilier** |
| Achat/vente éclaté en 3 sous-pages (négoce, véhicules, pièces) | **Une seule page Négoce** |
| Pages Tarifs et Prestations séparées | **Fusionnées** en une page Detailing qui convertit |
| Multiples CTA concurrents + téléphone en en-tête | **Un seul CTA** : Prendre rendez-vous (téléphone retiré de l'en-tête) |
| 3 pages légales distinctes | **Une page Informations** (sections ancrées) |
| Accueil surchargé | Accueil orienté conversion |
| Aucune cible géo | SEO local assumé (Parignargues, Nîmes, Gard) |

---

## 9. À confirmer / corriger avant mise en ligne

**Contenus factices encore en place (à remplacer) :**
- **Avis clients fictifs** (Julien, Sophie, Marc) alors que la page affiche « avis authentiques » → mettre de vrais avis ou masquer la section.
- **Photos placeholder** (picsum) légendées « Jantes / Habitacle / … » → remplacer par de vraies photos avant/après et des photos de Corentin en intervention.

**Identité & mentions légales :**
- **SIRET incomplet** : « 105 175 756 » = 9 chiffres (SIREN). Un SIRET en compte **14**.
- **Cohérence de marque** : Instagram `@nostalgia_auto_galery` (« galery », un seul L) et email `jammesmeca.auto@gmail.com` ne reprennent pas « Nostalgia Auto Gallery » → trancher.
- **Date d'ouverture** « 6 juillet 2026 » annoncée comme future : clarifier le statut (pré-ouverture ? réservations ouvertes ?).
- Forme juridique, adresse pro et coordonnées de l'hébergeur à compléter dans **Informations**.

**Décisions actées (rappel) :**
- Négoce **visible** dans le menu (2ᵉ position) — choix assumé.
- Zone d'intervention : confirmer la liste définitive des communes.
