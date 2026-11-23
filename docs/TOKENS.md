# Tokens (1.0 foundation)

The names every component and app uses from 1.0. Values live in `tokens/tokens.json` (edit there, then
`npm run build:tokens`); this page is the contract the 1.0 tickets build on. Components and apps use the semantic
utilities only, never a hex.

One look for every brand: the Flat / Sharp / Soft styles and `data-style` are gone. A brand changes only its two fills,
its fonts, its logo and its voice (`docs/BRANDS.md`).

## Surfaces: pure neutral, the same for every brand

| Utility | Role | Dark | Light |
|---|---|---|---|
| `bg-canvas` | page background, frame around the panels | #101010 | #ebebeb |
| `bg-app` | content column, holds the route header | #161616 | #f3f3f3 |
| `bg-panel` | nav panel, content card, sub-nav card, modal, popover | #1a1a1a | #ffffff |
| `bg-field` | input fill at rest | #222222 | #ffffff |
| `bg-field-focus` | input fill on focus (one step darker) | #161616 | #f7f7f7 |
| `bg-raised` | segmented track, toolbar buttons, nav group dividers | #2b2b2b | #e6e6e6 |
| `bg-raised-2` | active pill of a segmented control (on `raised`) | #424242 | #ffffff |

Kept from 0.x (neutral, derived from the above): `bg-panel-0…4`, `bg-card`, `bg-card-field`, `bg-tint` /
`bg-tint-hover` (until the 1.0 buttons replace them with `subtle-button`), `bg-inverted` / `bg-inverted-hover` /
`text-on-inverted` (the opposite of the page: checked controls, the inverse button).

## Text tiers

| Utility | Use | Dark | Light |
|---|---|---|---|
| `text-strong` | titles, active items, values | #f5f5f5 | #111111 |
| `text-body` | card text, body | #e3e3e3 | #2b2b2b |
| `text-muted` | descriptions, inactive tabs / nav, breadcrumb, placeholders | #ababab | #636363 |
| `text-faint` | group labels, kbd hints, "Untitled" | #858585 | #6a6a6a |

Every tier reaches 4.5:1 on `panel`, `app` and `canvas` in its theme: the token build checks it
(`scripts/token-css.mjs` `aaErrors`) and a failing value fails `npm run build:tokens` and `npm run check`. The light
faint is #6a6a6a, not the measured #737373 (3.98:1 on the light canvas).

`text-strong` replaces `text-contrast`. The contrast colour itself (pure white in dark, pure black in light) is the
private `--semi-contrast`, which every line and fill below mixes; it has no utility.

## Lines and fills (from the contrast colour)

| Utility | Use | Dark | Light |
|---|---|---|---|
| `border-field-line` | input border at rest | white 10% | black 10% |
| `border-field-line-focus` | input border on focus | white 25% | black 25% |
| `border-outline-line` | outline buttons, a selected card's border | white 20% | black 20% |
| `bg-item-hover` | hover on rows, nav and sub-nav items | white 5% | black 4% |
| `bg-item-selected` | selected nav / sub-nav item, selected row (the open record), selected option | white 15% | black 6% |
| `bg-item-checked` | checked rows / cards in selection mode | white 9% | black 5% |
| `bg-subtle-button` | ordinary content button fill | white 5% | black 5% |

Kept: `border-line`, `border-line-hover`, `border-divider`, `border-control-line` (checkboxes, radios; the 1.0 fields
move to `field-line`). Focus is neutral: `ring-focus` / `border-focus` are the strong text colour (≥ 3:1 on every
surface), never the brand.

There is no brand-derived colour anywhere: `accent`, `accent-hover`, `on-accent`, `action*`, `accent-fg`,
`accent-subtle(-hover)`, `accent-line` and the `primary-50…900` brand scale are removed.

## Brand fills: main buttons and attention only

| Utility | Use |
|---|---|
| `bg-primary` / `hover:bg-primary-hover` / `text-on-primary` | the one main button of a page, a modal or the nav; attention count badges, "New" tags, the active big-tab underline (`decoration-primary`) |
| `bg-secondary` / `hover:bg-secondary-hover` / `text-on-secondary` | the secondary main button, only when the brand has a secondary (otherwise it equals primary) |

Nothing else in Semi uses the brand colour. The brand kit sets the fills; the generator checks 4.5:1 for the text on
each and picks the on-colour. Status colours (`*-fg`, `*-bg`, `*-border`, `*-solid` for danger, success, warning, info)
and `text-tone-*` are one fixed palette for every brand.

## Type scale

`text-*` sizes carry their line height (and, where noted, weight and tracking); `leading-*` / `font-*` override.

| Utility | Size | Use |
|---|---|---|
| `text-hero` | 36, 32 below sm · lh 1.1 · −0.01em | hero (`font-display`, 400) |
| `text-title-xl` | 44 · lh 1.2 · −0.01em | title of a one-column reading page (`font-display`, 500) |
| `text-tab-xl` | 28, 24 below sm · lh 1.2 · −0.01em | big text tabs (`font-display`) |
| `text-section` | 20 · 500 · lh 1.3 · −0.01em | section heading |
| `text-figure` | 18 · lh 1.25 | numeric figures; the page title in a content card (400) |
| `text-lead` | 15 · lh 24 | lead text, card titles |
| `text-copy` | 14 · lh 22 | reading copy, secondary body, larger buttons |
| `text-ui` | **12 · lh 18, the base UI size** | nav, breadcrumb, buttons, labels, meta, list rows |
| `text-tag` | 10 · 500 · +0.02em | tags, chips |
| `text-badge` | 10 · 700 · lh 1 | count badges only |
| `text-overline` | 11 · 600 · +0.1em · uppercase | section labels |

Naming: the 14px size is `text-copy`, not `text-body`, because `text-body` is the body text colour (one Tailwind
`text-*` name cannot be both a size and a colour). `text-ui` keeps its name and is now 12px (was 14).

Weights: headings are not bold. 400 and 500 do almost everything (`font-title` is 500); 600 only for overlines and a
few emphasised labels; 700 only in count badges. Phones: fields you type in stay 16px below `sm` (iOS zoom) and touch
targets stay 44px.

Density and type scale (`data-density`, `data-type-scale` on `<html>`): compact sets `text-copy` 13 and `text-lead`
14; the contrast type scale raises figure 22, section 24, tab-xl 32, title-xl 52, hero 44 (hero and tab-xl still step
down below sm).

Removed sizes and their 1.0 names (the `1.0.0-foundation` migration rewrites them): `text-caption`, `text-label` →
`text-ui`; `text-ui-lg`, `text-title`, `text-title-lg` → `text-lead`; `text-heading-sm`, `text-heading` →
`text-section`; `text-heading-lg`, `text-display` → `text-tab-xl`; `text-kpi` → `text-figure`.

## Fonts

| Utility | Face |
|---|---|
| `font-sans` | the UI face (brand `fonts.sans`, default Geist) |
| `font-display` | the brand display face (`fonts.display`); without one it is the UI sans |
| `font-mono` | code |

## Shape

The one look's radii, card shadow and border, control sizes and spacing unit are the `shape` group of
`tokens/tokens.json`: `rounded-chip` 4 · `rounded-control` 8 · `rounded-card` 12 · `rounded-panel` 16, `shadow-card`
(none), `border-card` (transparent 1px), `h-control` 34, `h-field` 36, `font-title` 500, the density unit `--spacing`.

## Motion

Each token is a duration and an easing, usable in a `transition` or `animation` shorthand
(`transition: background-color var(--motion-hover)`). T9 wires the components; T1 defines them.

| Token | Value | Use |
|---|---|---|
| `--motion-hover` | 150ms ease-in-out | colours on hover / active (`transition-hover`) |
| `--motion-nav` | 150ms cubic-bezier(0.4,0,0.2,1) | nav active background (`transition-nav`) |
| `--motion-crumb-in` | 220ms cubic-bezier(0.22,1,0.36,1) | breadcrumb entering: opacity + translateX(−6px → 0) (`animate-crumb-in`) |
| `--motion-crumb-out` | 160ms cubic-bezier(0.4,0,1,1) | breadcrumb leaving |
| `--motion-enter` | 400ms cubic-bezier(0.25,0.46,0.45,0.94) | content entering: opacity + translateY(4px → 0) (`animate-enter`) |
| `--motion-stagger` | 35ms | per item, first ~10 items, once per route |
| `--motion-pulse` | 2.5s ease-in-out | skeleton opacity 1 → 0.6 → 1 (`animate-pulse`) |
| `--motion-tooltip` | 200ms cubic-bezier(0.16,1,0.3,1) | opacity + scale(0.96 → 1) (`animate-tooltip-in`) |
| `--motion-disclosure` / `--motion-disclosure-close` | 300ms ease-out / ease-in | disclosure open / close |
| `--motion-slide` | 300ms ease-out | sliding active pill (`transition-slide`) |

Under `prefers-reduced-motion: reduce` the distances (`--motion-crumb-distance`, `--motion-enter-distance`) are 0 and
`--motion-tooltip-scale` is 1, so every entrance is opacity only.
