# Creative Software — Design System

A brand + product design system for **Creative Software**, a software engineering services company: *"Scandinavian roots, Sri Lankan tech prowess."* Creative Software is a pioneer and leader in Sri Lanka's software industry, building and managing dedicated, high-performing, full-stack software development teams across the entire product lifecycle (MVP → support & maintenance) for clients in Scandinavia and beyond.

This system packages the brand's visual identity (logo, color, Poppins type), a complete set of reusable UI primitives, and a full recreation of the marketing website so designers and agents can produce on-brand interfaces and assets.

## Sources
- **Visual Identity Guide** — `uploads/Creative Software branding guideline.pdf` (16 pages: logo rules, color palette, typography, sub-brand "Creative Spark In-Cube").
- **Figma file** — *Creative Software.fig* (mounted virtual FS). One page, 63 frames: the "Simple Design System" component kit **plus** a full `html.to.design` recreation of creativesoftware.com. Components, Figma Variables (tokens) and typography were materialized from it.
- **Logos** — `uploads/CS Logo-01…18.png` (full color, black, white/negative, logomark, horizontal lockups).
- **Fonts** — `uploads/poppins/` (Poppins family, OFL).

> Note on the token layer: the Figma file's variable collection was the generic *Simple Design System* set (grayscale "brand" ramp, Inter type). The true Creative Software identity — crimson primary + Poppins — is bound on top of those raw variables in `tokens/brand.css`, so every materialized component renders on-brand. The raw Figma variables are preserved in `components/fig-tokens.css`.

## Index / manifest
- `styles.css` — **global entry point** (consumers link this). `@import`s only.
- `tokens/`
  - `fonts.css` — Poppins `@font-face` (7 weights).
  - `brand.css` — crimson brand ramp + Poppins + official palette (`--cs-*`) overriding the SDS token layer.
  - `typography.css` — brand type scale (`--type-*`) and weights.
- `components/`
  - `fig-tokens.css` — raw Figma Variables (all theme modes).
  - `fig-assets.css` — Figma bitmap-fill helper classes.
  - Component primitives (`.jsx` + `.d.ts`), see below.
  - `icons/` — `Icon.jsx` + `icon-data.js` (material-symbol glyph set + UI icons).
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand).
- `ui_kits/website/` — homepage recreation.
- `assets/` — logos, fonts, imagery.
- `SKILL.md` — Agent-Skill wrapper.

## Components
Reusable primitives (each `<Name>.jsx` + `<Name>.d.ts`, mounted via `window.CreativeSoftwareDesignSystem_ab67e0`):

**Actions & inputs:** `Button`, `IconButton`, `ButtonGroup`, `QuickButton`, `InputField`, `SelectField`, `TextareaField`, `FormContact`, `Contact`.

**Data display & chips:** `Tag`, `ColorChip`, `VersionChip`, `Avatar`, `Card`, `CardGridIcon`, `ProductInfoCard`, `TextPrice`, `Star`, `Info`.

**Disclosure & navigation:** `Accordion`, `AccordionItem`, `NavigationPill`, `NavigationPillList`, `Menu`.

**Content blocks:** `TextContentHeading`, `TextContentHeading2`, `TextContentTitle`, `TextStrong`, `TextStrong2`, `Text`, `TextLinkList`, `TextLinkListItem`.

**Layout sections:** `Header`, `HeaderAuth`, `Footer`, `DocumentFooter`, `Component1`, `HeroImage`, `PanelImageContent`, `PanelImageContentReverse`, `PanelImageDouble`.

**Brand & icons:** `Logo`, `Icon`, plus glyph primitives `ChevronUp`, `ChevronDown`, `ChevronDown2`, `ChevronDown3`, `IconsCheck`, `IconsArrowForward`, `X`, `X4`, and the material-symbol components `AutoMode`, `DashboardCustomize`, `Diversity1`, `Diversity2`, `LocalPolice`, `PersonAddAlt`, `ReduceCapacity`, `VerifiedUser`, `Villa` (also available through `Icon`).

`Icon` renders the full material-symbol glyph set (`AutoMode`, `DashboardCustomize`, `Diversity1/2`, `LocalPolice`, `PersonAddAlt`, `ReduceCapacity`, `VerifiedUser`, `Villa` in Filled/Outlined/Round/Sharp/TwoTone) plus `Heart`, `LightMode`, `LocationOn`, `Mood`, `IconsCheck`, `IconsArrowForward`, `IconsOpenInNew`, `ChevronUp` — see `components/icons/Icon.d.ts` for the full name list.

### Intentional additions
- **`Logo`** — wraps the official brand bitmaps (`assets/logo-*.png`) with a `variant` prop; added because the file's logo was a raster asset, not a token/component, and every surface needs a correct, non-redrawn mark.

## Coverage notes
The Figma kit enumerates **75 component "families"**, of which **~59 are implemented**. Many of the rest collapse to a single implementation: the file contains 5 duplicate *Button* sets, 3 *Button Group* sets, and duplicate *IconButton/Star/X* sets — all delivered by one component each.

**Intentionally not built as standalone components** (with reasons):
- `World` — a full vector world-map illustration (multi-MB); too heavy to bundle. Use imagery instead.
- `Page Product`, `Spark page - University relations`, `Spark page - Mobile`, `Component 1`, `.Document Footer` — whole-page/example frames, not primitives; the reusable pieces they contain (Header, Footer, panels, cards) are built individually and composed in `ui_kits/website/`.

See CAVEATS in chat for anything still open.

---

## CONTENT FUNDAMENTALS
How Creative Software writes.

- **Voice:** confident, warm, partnership-oriented — a trusted senior partner, not a hype vendor. Benefit-led ("Peace of mind", "Build your team"), never jargon-stuffed.
- **Person:** speaks to the client as **"you"** and about itself as **"we"** ("*We* build… so *you* can move faster"). Collaborative framing throughout.
- **Casing:** Headlines use **Title Case or sentence case** with a full stop for emphasis ("tailored to you."). Section labels/eyebrows are short sentence-case phrases. Buttons are sentence case ("Build your team", "Schedule a 20 minute call").
- **Tone specifics:** direct, reassuring, outcome-focused. Uses concrete proof (25+ years, 4 continents, 700+ employed, 200+ projects). Nordic/Scandinavian positioning is a recurring differentiator.
- **Sentence style:** short lead sentences, em-dashes for asides ("—so you can move faster, with less risk"). Occasional two-word emphatic fragments as headlines.
- **Emoji:** none. Not part of the brand voice.
- **Examples:**
  - Hero: *"We Build High-Performing Tech teams tailored to you."*
  - Sub: *"Get matched with our rigorously vetted Devs, QAs, Architects, UX specialists, and other experts to assemble your winning team."*
  - Value: *"Be at ease knowing your development workflows are handled by a highly capable delivery team."*
  - CTA: *"No pressure, just a shared discovery to see if we're the right fit."*

## VISUAL FOUNDATIONS
- **Color:** Crimson primary `#D4264F` (Pantone match `#CF3854`) is the single hero accent — used for the primary CTA, links ("Read Case Study ↗"), highlighted cards, and the wordmark's "Software". Secondary is Cool-Gray `#434243` (body text / neutral buttons paired with near-black `#0D0D11` for large headlines). White is a first-class brand color. A tertiary accent set (Yellow `#F1CA01`, Green `#00C580`, Cyan `#01A1D2`, Blue `#003FC2`, Purple `#7F7DDF`, Navy `#272A46`) appears in illustration, section gradients and the occasional inverted card (the purple IFS card). Max ~2 background tints per view.
- **Type:** **Poppins** everywhere (geometric, friendly, modern). Large headers = **Medium (500)** (Bold looks heavy at size); smaller headers = **Bold/SemiBold**; body = **Regular (400)** for readability. Big headlines run 48–64px, near-black, tight leading (~1.02–1.15), slight negative tracking.
- **Backgrounds:** predominantly white, punctuated by soft full-bleed **linear gradients** between sections — pale blue→yellow, yellow→cream→white — creating gentle "temperature" shifts. No textures, no noise, no hand illustration. Photography is warm, candid, real (team/office scenes).
- **Cards:** generously rounded (**~16px**), white with **soft, low, diffuse shadows** (`0 12px 30px -18px rgba(0,0,0,.16–.18)`) and a hairline `#f0eff0` border; one card per group is often **inverted** (crimson or purple fill, white text, a colored glow shadow) to create focus.
- **Buttons:** rounded (~8px), solid crimson primary with white text; neutral = near-black solid; inverted CTA = white button with crimson text on colored banners. Pills (stats, tags) are fully rounded (999px) with hairline borders.
- **Shadows:** exclusively soft and downward; colored glows only under inverted accent cards/CTAs. No hard or inner shadows in the marketing layer.
- **Corner radii:** pills 999px; cards ~16px; buttons/inputs ~8px; small chips ~5px.
- **Layout:** centered max-width (~1180px) content column, 40px gutters, generous vertical rhythm (60–90px section padding). Sticky translucent (blurred) header.
- **Animation:** subtle — fades and short transitions; dot pagers and hover state changes. No bounce, no aggressive motion.
- **Hover/press:** buttons darken (crimson → `#AB1E40`); links stay crimson; nav items are medium-weight gray. Press states are the darker token, no scale gimmicks.
- **Transparency/blur:** header uses `rgba(255,255,255,.92)` + `backdrop-filter: blur(8px)`. Otherwise opaque.
- **Imagery vibe:** warm, natural-light, authentic team/workplace photography — not stocky, not cool-toned.

## ICONOGRAPHY
- The Figma file draws icons from **Google Material Symbols** (auto_mode, dashboard_customize, diversity_1/2, local_police, person_add_alt, reduce_capacity, verified_user, villa) in all five styles (Filled, Outlined, Round, Sharp, TwoTone), plus a small set of custom UI glyphs (check, arrow_forward, open_in_new, chevrons, heart, mood, location_on, light_mode).
- These are delivered as **inline SVG path data** through `components/icons/icon-data.js` and rendered with `<Icon name="…" size={…} />`; they paint with `currentColor` (default crimson on light surfaces, white on inverted cards).
- The marketing site also uses **Font Awesome 5** (Brands + Free Solid) glyphs and real third-party **tech-stack brand logos** (AWS, Azure, GCP, Cypress, Playwright, etc.) — the latter are NOT reproduced here (represented as neutral text chips in the UI kit) to respect third-party trademarks.
- **Emoji:** not used. **Unicode arrows** (↗) appear in link affordances.
- Preferred UI style: **Outlined** material symbols at 20–26px, crimson or inherited text color.

## FONT SUBSTITUTIONS
None. Poppins (the exact brand typeface) is bundled from `uploads/poppins/`. The Figma-referenced fallbacks (Inter, Ubuntu, DM Sans, Albert Sans) were artifacts of the SDS template and have been mapped to Poppins.
