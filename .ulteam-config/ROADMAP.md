# Roadmap — Ulteam

**État actuel** : Fondations (Slyk + Zoé)  
**Philosophie** : 1 bloc = 1 conversation courte, relais par mémoire + git

---

## Bloc actif : **Slyk**

**Status** : En cours  
**Focus** : Composants réutilisables hyper-clairs  
**Pourquoi** : C'est la fondation d'Ulteam — la logique + l'interaction  

**Tâches (A1-A6)** :
- A1: `<SaveFeedback>` (bordure + toast vert)
- A2: `<DeleteBadge>` (corbeille + survol rouge)
- A3: `<Toast>` générique (erreur/info/success)
- A4: Extraire CSS drag dans `src/slyk/`
- A5: Marquer les fns internes `@private`
- A6: Régénérer doc après chaque ajout

**Next** : A1 (dès demain)

---

## Blocs en attente

### **Zoé** (après Slyk)
- B1: Nostalgia comme thème Zoé (tokens)
- B2: 2e thème démo (light)

### **Directus — Intégration** (après Zoé)
- C1: Express → mail_config/mail_accounts
- C2: Site public → Directus (gallery/pricing/services)
- C3: Unifier les dashboards

### **Prod — Exploitation** (après Directus)
- D1: Déploiement (build → tar → scp → restart)
- D2: Nettoyage admin (password, test levels)
- D3: Règles JS+JSDoc actives partout

---

## Règles transverses

- **JS + JSDoc** (jamais TypeScript)
- **Doc = générée** depuis JSDoc
- **UI suit Slyk** (suppression, enregistrement, drag, dropdown)
- **Tags** : `#think` (Opus), `#manage` (Sonnet), `#make` (Haiku)

---

**Mis à jour** : 2026-07-01
