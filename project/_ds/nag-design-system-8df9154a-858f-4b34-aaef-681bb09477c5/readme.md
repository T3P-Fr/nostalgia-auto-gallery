# Nostalgia Auto Gallery — Design System

> *Votre partenaire passionné pour l'automobile.*

A brand & UI system for **Nostalgia Auto Gallery** — a solo-operator automotive
business based in **Parignargues, Gard (30)**, France. Two pillars:

1. **Soin & préparation esthétique (Detailing)** — deep cleaning, paint
   correction, durable protection.
2. **Achat, revente & solutions automobiles** — carefully selected used
   vehicles, plus a parts-trading (négoce) activity.

The brand voice is **first-person, passionate, artisanal** — one enthusiast who
treats every car as an object that *deserves attention and care*. The visual
world is **JDM + French youngtimer culture**: a red Nissan 180SX (S13), an
orange turbo build, a red Peugeot 205 — shot warm, at golden hour, real and
unpolished. The logo is a **chrome-and-crimson emblem**: a gear/cog ring, a
wrench, a rising-sun (hinomaru) motif, the 180SX silhouette, and the tagline
*"OPSC. Detail & Performance."*

This is a **brand-from-scratch** system: there is no prior codebase, website, or
Figma. Everything here is derived from the supplied logo, photos, and the French
copy in `texte.odt`.

---

## SOURCES (provenance — reader may not have access)

All inputs were uploaded files (no repo / Figma / live site):

- **Brand copy** — `uploads/texte.odt` (extracted to `uploads/_texte_extracted.txt`).
  French marketing text: positioning, the two service pillars, "pourquoi nous
  choisir", contact CTA.
- **Logo** — `uploads/Gemini_Generated_Image_ff4yrjff4yrjff4y.png` (AI-generated
  chrome emblem). Cleaned to `assets/logo/emblem.png` + transparent
  `assets/logo/emblem-transparent.png`.
- **Marketing render** — `uploads/a3f5d07c-…jpg`: red S13 in a concrete pavilion
  at sunset with detailing products + a secondary line-art wordmark on the glass
  → `assets/photos/hero-pavilion-s13.jpg`.
- **Authentic photography** — red Nissan 180SX (multiple angles, day/night),
  orange S13 turbo engine bay, red Peugeot 205 (front/rear). Curated into
  `assets/photos/`.
- `uploads/STANDARD (1).pdf` — could not be parsed (unrecognized/!PDF format);
  not used. If it holds brand material, re-share it.

> ⚠️ **Font substitution (needs confirmation).** The emblem wordmark uses a
> custom italic chrome display face we don't have the file for. The system
> substitutes **Saira Condensed** (free, Google Fonts) as the closest match for
> headers. If you have the real logo font (or a vector logo), send it and we'll
> swap it in. See **FONTS** below.

---

## CONTENT FUNDAMENTALS — how the brand writes

**Language.** French, first. Copy is bilingual-ready but French is primary
(`Detailing`, `Pièces détachées`, `Demander un devis`). Keep the franglais that
the enthusiast scene actually uses: *detailing, fastback, youngtimer, JDM,
turbo, BVM5* stay in their native form.

**Voice = one passionate person ("je"), addressing "vous".**
> "Parce qu'une voiture n'est pas seulement un moyen de transport… **j'ai décidé
> de mettre mon expertise à votre service.**"
> "**Je** sélectionne rigoureusement des véhicules…"
> "**Je vous propose** un service de déplacement à domicile."

Never corporate "nous" the whole way — the warmth comes from the singular *je*.
The one exception is the rallying brand sign-off ("Pourquoi **nous** choisir ?",
"À très vite chez Nostalgia Auto Gallery !").

**Tone.** Warm, proud, meticulous, unpretentious. Passion + rigour, not luxury
gloss. Words that recur: *passion, soin, attention, rigueur, expertise,
profondeur, proximité, seconde jeunesse*. Sentences are direct and concrete.

**Casing.** Headlines and labels are **UPPERCASE** in the condensed display face
(motorsport / garage-poster feel). Body is sentence case. Mono labels (specs,
overlines) are uppercase with wide tracking.

**Punctuation.** French typographic norms — `?` `!` `:` after a space is fine in
casual contexts; use real apostrophes (’). Numbers use a thin/space thousands
separator and `€` after the value: **12 900 €**, **142 000 km**, **205 ch**.

**Emoji.** None in the product UI. (The source photos came from social with
Snapchat-style script/emoji overlays — that is *capture context*, not the brand
system. Don't reproduce it.)

**Microcopy examples.**
- CTA primary: *Demander un devis* · *Voir le stock* · *Réserver*
- CTA secondary: *En savoir plus* · *Nous contacter*
- Status: *Disponible* · *Réservé* · *Vendu* · *Sur commande*
- Service eyebrows: *Detailing & Performance* · *Achat · Revente · Pièces*
- Trust line: *Sélection rigoureuse · État, historique, qualité*

---

## VISUAL FOUNDATIONS

**Color.** A tight, confident palette pulled straight from the cars and the
emblem:
- **JDM crimson** (`--red-500 #B81E29`) is the single hero color — the paint on
  the 180SX and the 205. Used for primary actions, prices, accents, the rule
  bars. Deepens to `--red-700` in shadow/press.
- **Garage ink** (`--ink-900 #0D0E10`) for dark sections, rails, footers, and
  the `.nag-dark` scope.
- **Brushed-steel neutrals** (`--steel-*`, cool grays) for chrome, borders,
  muted text — echoing the emblem's metal.
- **Bone / warm paper** (`--bone-100 #F5F2EA`) is the default light surface —
  warmer than white, so photography feels analog, not clinical.
- **Golden-hour amber** (`--sun-500 #E47C24`) and **rising-sun red**
  (`--hinomaru #D81F26`) are sparing accents (badges, the cog/sun motif).
- **French-plate blue** (`--plate-blue #0A3D91`) appears only inside the plate
  motif.
Avoid: purple/blue gradients, neon, pastels. The mood is metal + crimson + warm
light.

**Type.** Three families, all free (Google Fonts):
- **Saira Condensed** — display. Heavy (800/900), UPPERCASE, tracking ≈ −1%.
  Motorsport headers, big numbers, button labels.
- **Saira** — text/UI. A technical grotesque companion; body, leads, inputs.
- **Spline Sans Mono** — specs, prices, plate numbers, overlines/eyebrows. Wide
  tracking. This is what makes the brand feel like a spec sheet.

**Spacing & layout.** 4px base scale (`--sp-*`). Container ≈ 1200px, fluid
gutters. Generous vertical rhythm between sections (`--sp-16`/`--sp-20`). Content
is grid/flex with `gap` — never inline-flow spacing.

**Backgrounds.** Mostly flat **bone** or **ink** — no busy gradients. Imagery is
**full-bleed photography**, warm and real, often with a bottom **protection
gradient** (`--grad-protect`) so white text sits on it. Decorative gradients
exist (`--grad-chrome` brushed steel, `--grad-ink`, `--grad-sun`) but are used
on small surfaces (buttons, accent panels), never as page wallpaper. A faint
**gear/cog** or **rising-sun ray** can sit behind a heading as a watermark.

**Borders & cards.** Cards are **crisp, not soft**: 1px hairline border
(`--border-hair`), small radius (`--r-md 10px`), cool layered shadow
(`--shadow-sm` resting → `--shadow-lg` on hover). An optional **brand-red accent
bar** (3px) runs along the top of feature cards. Plates, spec strips, and the
gear motif stay **sharp (0 radius)**. Pills (Tags) are fully rounded.

**Shadows.** Cool and low-spread, like parts laid on a workbench — `--shadow-xs`
to `--shadow-lg`, plus a `--shadow-red` glow for the hero CTA. Inset highlight
(`--shadow-inset`) gives buttons a faint chrome top edge.

**Motion.** Mechanical and quick — **no bounce**. `--ease-mech` /`--ease-out`,
durations 120–520ms. Buttons press **down 1px + scale .99** (a physical click).
Cards **lift −3/−4px** on hover with a deepening shadow. Images **scale 1.05**
inside their frame on card hover. Respect `prefers-reduced-motion`.

**Interaction states.**
- *Hover* — primary/ink buttons brighten (`brightness 1.08`); chrome/ghost
  darken slightly; cards lift; links underline.
- *Press* — translateY(1px) scale(.99); color deepens to `--red-700`.
- *Focus* — 2px `--focus-ring` (red-400) outline, 2px offset; inputs get a 3px
  `--red-50` halo + brand-red border.
- *Disabled* — opacity .5, `not-allowed`.

**Transparency & blur.** Used rarely — a translucent ink scrim on a sticky
header over photography, or the protection gradient on hero imagery. No frosted-
glass everywhere.

**Imagery vibe.** Warm, slightly contrasty, golden-hour or night-with-streetlamp.
Real cars in real places (storage-box lot, gas station, village street, sunset
pavilion). Crimson reads as the anchor in almost every frame. Keep it analog —
don't over-correct to cold/clean.

---

## ICONOGRAPHY

There is **no proprietary icon set**. The brand's iconographic identity lives in
its **motifs**, used as accents rather than a UI icon library:
- **Gear / cog** — section dividers (`GearRule`), watermark behind headings.
- **Wrench** — service/performance marker (from the emblem).
- **Rising-sun rays (hinomaru)** — a small radial accent for JDM/heritage call-outs.
- **French plate** — the `PlateTag` component; used for IDs and decorative refs.
- **Chevron / `▼`** — select carets, "more" affordances.

For functional UI icons (search, phone, mail, arrow, filter, location), use
**Lucide** from CDN — its 1.5–2px stroke matches the system's weight and the
brushed-steel feel. Load:
```html
<script src="https://unpkg.com/lucide@latest"></script>
<!-- <i data-lucide="phone"></i> then lucide.createIcons(); -->
```
> ⚠️ Lucide is a **substitution** (no brand icon set was supplied). Swap for a
> bespoke set later if desired. Keep strokes ~1.75px, rounded caps, monochrome
> (`--text-muted` / `--text-strong`); never multicolor or filled-duotone.

**Emoji / unicode:** not used as UI icons. The few glyphs in components (`◆` in
GearRule, `★`/`▼` in plate/select, `✦` decorative) are intentional typographic
marks, not emoji.

**Logo usage:** use `emblem-transparent.png` on light/photo surfaces and
`emblem.png` (on its white field) where a contained badge reads better. Give it
clear space ≈ one gear-tooth radius. Don't recolor, stretch, or add effects — it
already carries chrome + shadow. On tiny sizes, fall back to the typographic
wordmark (Saira Condensed: "NOSTALGIA / AUTO GALLERY").

---

## INDEX — what's in this system

**Root**
- `styles.css` — global entry point (consumers link this). `@import`s only.
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skill wrapper for use in Claude Code.

**`tokens/`** — `fonts.css` · `colors.css` · `typography.css` · `spacing.css`

**`assets/`**
- `logo/` — `emblem.png`, `emblem-transparent.png`
- `photos/` — `hero-pavilion-s13.jpg`, `s13-front-lit.jpg`, `s13-front-low.jpg`,
  `s13-night-station.jpg`, `s13-engine-bay.jpg`, `205-front.jpg`, `205-rear.jpg`

**`components/`** (React primitives — bundled, namespace
`window.NostalgiaAutoGalleryDesignSystem_8df915`)
- `core/` — Button · Badge · Tag · **PlateTag** · Eyebrow · Stat · GearRule · Card
- `forms/` — Field · Select
- `automotive/` — **VehicleCard** · SpecGrid · ServiceCard

**`guidelines/`** — foundation specimen cards (Type, Colors, Spacing, Brand) that
populate the Design System tab.

**`ui_kits/`**
- `vitrine/` — the marketing website recreation: Home, Stock (inventory), Vehicle
  detail, Services & Contact. See `ui_kits/vitrine/README.md`.

---

*Built from the supplied logo, photos, and French brand copy. Flags above
(`STANDARD.pdf`, logo font, Lucide icons) need your input to finalize.*
