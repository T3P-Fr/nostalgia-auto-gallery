# Journal des décisions — Ulteam

Chaque grande décision, pourquoi, quand c'est changé.

---

## D1 — Slyk vs Radix (2026-07-01)

**Décision** : Construire Slyk (composants headless custom)  
**Raison** : 
- Besoin d'UX radicalement claire, pas un framework "commun"
- Contrôle total sur l'expérience utilisateur
- Taillé exactement pour Ulteam, pas un one-size-fits-all

**Qui a décidé** : Christophe (vision) + Claude (expertise)  
**Status** : ✅ Validée  
**Changé le** : —

---

## D2 — Zoé comme supercouche CSS (2026-07-01)

**Décision** : Zoé = thème CSS (tokens + variantes) par-dessus Slyk  
**Raison** : 
- Pattern Radix + Shadcn : headless + thème séparé
- Slyk reste totalement réutilisable sans Zoé
- Zoé peut avoir 10 variantes sans toucher Slyk

**Inspiration** : Radix (headless) + Shadcn (thème)  
**Status** : ✅ Validée  
**Changé le** : —

---

## D3 — Framework Ulteam, pas juste des libs (2026-07-01)

**Décision** : Slyk + Zoé = pièces d'un framework plus grand (Ulteam)  
**Raison** : 
- Ils ne peuvent pas être totalement indépendants
- Il y a un "glue" philosophique entre eux
- Ulteam = la vision unifiée d'un dashboard accessible à tous

**Philo** : Simplicité radicale, "Windows user friendly" = accessible à tous  
**Status** : ✅ Validée  
**Changé le** : —

---

## D4 — Tags #think / #manage / #make (2026-07-01)

**Décision** : 3 tags simples pour piloter le modèle Claude  
**Raison** : 
- Facile à mémoriser (`#think` = Opus, etc.)
- Automatise le pilotage sans `/model` à chaque fois
- Fait partie de la culture du projet

**Format** :
- `#think` → Opus (conception, décisions)
- `#manage` → Sonnet (implémentation, intégration)
- `#make` → Haiku (mécanique triviale)

**Status** : ✅ Validée  
**Changé le** : —

---

## D5 — Système de suivi long terme (2026-07-01)

**Décision** : 
- **ULTEAM.md** = vision (change quand la philo évolue)
- **ROADMAP.md** = priorités (change souvent)
- **DECISIONS.md** = journal (immutable, historique)
- **Memory** = détails exécutifs (pas visible au user)

**Raison** : 
- Cristallise la vision sans l'étouffer
- Permet les pivots sans perdre le context
- Tient sur le long terme (mois, années)

**Rôles** :
- Christophe = créatif, volatil, vision
- Claude = infatigable, strict, exécution

**Status** : ✅ Mise en place  
**Changé le** : —

---

**Journal créé** : 2026-07-01
