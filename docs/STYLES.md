# Semi styles

A **style** is the look of the whole UI: neutral colours, fonts, radii, card border and shadow, control sizes. An app
picks one style, once (Flat, Soft or Sharp); every `@semi/ui` component and class constant follows it. Shared by all
styles: components and their API, layout (AppShell, PageTitle, SubpageToolbar …), the type scale, the accent (brand,
per app: §2b), status and tone colours, both themes (light / dark), icons, accessibility and lint rules.

| | Flat (default) | Soft | Sharp |
|---|---|---|---|
| For | Dense, information-first screens: dashboards, tools, admin | Calm, friendly screens: consumer apps, storefronts, onboarding | Bold, editorial screens: landing pages, portfolios, creative tools |
| Palettes (first = default) | Graphite · Slate · Olive | Sand · Blush · Sage | Ink · Paper · Mono |
| Fonts | Geist + Montserrat Alternates (titles) | Plus Jakarta Sans | Space Grotesk |
| Card (`border-card`, `shadow-card`) | 1px line border, no shadow | No visible border, soft lifted shadow | 2px solid border, hard 4px offset shadow |
| Lines (`border-line`) | 8–9% | 9%, tinted | 18–32%, strong |
| `rounded-chip` / `control` / `card` / `panel` | 4 · 8 · 12 · 16px | 6 · 12 · 20 · 24px | 2 · 0 · 0 · 0 |
| `h-control` / `h-field` | 34 / 36px | 40 / 44px | 36 / 40px |

Every style × palette passes WCAG AA on every Storybook page in both themes (Playwright, `npm run test:ui`).

## Palettes

Each style has three colour variants. A palette changes only the neutral colours (canvas, app, panel, field, raised,
text, lines) of both themes; the accent stays the product's brand and status colours keep their meaning.

| Style | Palette | Look |
|---|---|---|
| Flat | **Graphite** (default) | Neutral cool grey, the original Semi look |
| Flat | Slate | Blue-tinted greys: calm, technical |
| Flat | Olive | Green-grey neutrals: natural, quiet |
| Soft | **Sand** (default) | Warm sand and espresso |
| Soft | Blush | Rosy, gentle neutrals |
| Soft | Sage | Soft green-grey, fresh and calm |
| Sharp | **Ink** (default) | Off-black and off-white: graphic without glare |
| Sharp | Paper | Cream paper and sepia ink: editorial, printed |
| Sharp | Mono | Pure black and white, maximum contrast |

Source: `tokens/styles/<id>.json` (`tokens`: shape, card border, fonts, sizes; `semantic`: neutral colours per theme;
`fonts`: what the app loads) → `npm run build:tokens` → `[data-style="<id>"]` blocks in `tokens.css` and the list in
`tokens/styles.json` (`@semi/ui/styles.json`). Preview: the Flat / Sharp / Soft switch at the bottom of the Storybook
sidebar.

## Picking a style in an app

```tsx
// app/layout.tsx: data-style on <html> (off = Flat), data-palette for a palette other than the style's first
<html lang="vi" data-style="soft" data-palette="sage" suppressHydrationWarning>
```

plus the style's fonts with `next/font` (the `fonts` list in `@semi/ui/styles.json`; Soft: `Plus_Jakarta_Sans` with
`variable: "--font-jakarta"` on `<html className>`), and the same ids in `semi-lint.json` (`"style": "soft"`, `"palette": "sage"`; no `palette` = the default one).
`/semi-audit` checks all three against each other. `/semi-init`
asks for the style of a new app, `/semi-fix` foundation for an existing one, `/semi-style` switches it later. A wrapper
with `data-style` re-styles only its subtree (used by Storybook previews), not something an app needs.

## Rules

- Use the style tokens only: `rounded-chip` (marks, checkboxes, inline code) · `rounded-control` (buttons, inputs,
  selects, tiles, list rows) · `rounded-card` (cards, popovers, menus, toasts) · `rounded-panel` (hero, modal, drawer,
  sheet, sidebar) · `rounded-full` / `rounded-none` (the same in every style) · `shadow-card` (resting cards, in `CARD`).
  `semi-lint` (`radius-token`) flags `rounded`, `rounded-sm/md/lg/xl/2xl` and `rounded-[Npx]`; the `/semi-fix` token
  codemod maps them (`lg` → `control`, `xl` → `card`, `2xl` → `panel`, `sm` / `md` / bare → `chip`; `shadow-sm` → `shadow-card`).
- An app never writes per-style CSS or `[data-style=…]` selectors: when one screen needs another shape, the style is
  missing a token, so propose it upstream (`/semi-propose`).
- Sizes: toolbar controls `h-control` / `w-control`, form inputs and selects `h-field`; never `h-[34px]` (the codemod maps it).
- Colours: the semantic tokens only (`bg-panel`, `text-muted`, `border-line` …): their values change per style. The
  accent is the product's brand, not the style's.
- Fonts: `font-sans` / `font-display` only. An app with its own brand fonts sets `--font-sans-family` /
  `--font-display-family`, which every style then uses.
- Floating layers keep `shadow-overlay` / `shadow-float` in every style.

## Adding a style (maintainers)

1. Copy `tokens/styles/flat.json` to `tokens/styles/<id>.json`; set `name`, `description`, `fonts` (Google fonts
   `next/font` can load, with their CSS variable), every token (the build fails when a key is missing or extra) and the
   `palettes` (three, the first is the default; each one's `semantic` sets the neutrals it changes, dark + light). Exactly one file has `"default": true`. Load its fonts in
   `app/layout.tsx` of the Storybook.
2. `npm run build:tokens`, then add its column above. `check:manifest` fails while a style has no column here.
3. `npm run build:storybook && npm run test:ui`: contrast and phone layout run for every style in both themes.
4. CHANGELOG (a new style is a minor release). Changing a value of an existing style changes every app on it: note it
   under "Changed". Renaming or removing a style needs a release migration (`migrations/`) that rewrites
   `semi-lint.json` and the `<html data-style>` of apps that used it.
