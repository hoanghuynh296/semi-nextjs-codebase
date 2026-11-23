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
| `text-muted` | descriptions, inactive tabs / nav, breadcrumb, placeholders | #b1b1b1 | #4f4f4f |
| `text-faint` | group labels, kbd hints, "Untitled" | #8a8a8a | #656565 |

Every tier reaches 4.5:1 on `panel`, `app`, `canvas` and `bg-card` in its theme; `text-strong`, `text-body` and
`text-muted` also on `bg-card-field`, `bg-raised` and on `bg-item-hover` / `bg-item-selected` / `bg-item-checked` over
the panel and over the card (a checked or selected row in a card table). The token build checks every pair
(`scripts/token-css.mjs` `aaErrors` resolves the `color-mix()` surfaces and composites the translucent fills) and a
failing value fails `npm run build:tokens` and `npm run check`. `text-faint` is for the page surfaces and the card
only: on `bg-card-field`, `bg-raised` or an item fill use `text-muted` or stronger. The muted and faint values are the
lightest (light) / darkest (dark) greys that pass all of these (worst pair about 4.55:1: muted on a selected row in a
card, faint on the card). Known limit (not checked): an item fill is only checked over panel and card; `text-muted` on `bg-item-selected`
over `bg-raised` or `bg-card-field` is about 4.0:1 in dark, so a selected row never sits on those two surfaces.

`text-strong` replaces `text-contrast`. The contrast colour itself (pure white in dark, pure black in light) is the
private `--semi-contrast`, which every line and fill below mixes; it has no utility.

## Lines and fills (from the contrast colour)

| Utility | Use | Dark | Light |
|---|---|---|---|
| `border-field-line` | input border at rest | white 10% | black 10% |
| `border-field-line-focus` | input border on focus | white 25% | black 25% |
| `border-outline-line` | outline buttons, a selected card's border | white 20% | black 20% |
| `bg-item-hover` | hover on rows, nav and sub-nav items | white 5% | black 9% |
| `bg-item-selected` | selected nav / sub-nav item, selected row (the open record), selected option | white 15% | black 15% |
| `bg-item-checked` | checked rows / cards in selection mode | white 9% | black 12% |
| `bg-subtle-button` | ordinary content button fill | white 5% | black 5% |

Light item fills step hover < checked < selected and each is visible on a card (composited black over `bg-card`
#e3e3e3, ratio against the card; over the panel about the same): hover 9% #cfcfcf 1.21:1 · checked 12% #c8c8c8
1.30:1 · selected 15% #c1c1c1 1.40:1. In 0.x / the first 1.0 draft they were 4% (1.09:1), 5% (1.11:1) and 6%
(1.14:1), hard to tell from the card and from each other; the light `text-muted` went to #4f4f4f so it still reaches
4.5:1 on a selected row in a card.

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
and `text-tone-*` are one fixed palette for every brand. Their text (light: the 800 shade; dark: 300 / 400) reaches
4.5:1 on its own tint (`*-bg`, `bg-<hue>-500/10`) over every surface, a card and the field in a card included.

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
| `text-input` | 16 · lh 24 | text you type in, below `sm` only (`max-sm:text-input`): iOS zooms into a field under 16px |
| `text-ui` | **14 · lh 22, the content size** (13 compact) | list and table rows, form labels and help text, field values and placeholders, buttons, menu items, dialog text, body and reading copy |
| `text-chrome` | **12 · lh 18, the shell chrome size** | nav items, group-label rows, breadcrumb, route-header and toolbar compact buttons (`BTN_SM`), meta (timestamps, counts, hints, captions), kbd and the "/" hint, tooltips, status pills and badges |
| `text-tag` | 10 · 500 · +0.02em | tags, chips |
| `text-badge` | 10 · 700 · lh 1 | count badges only |
| `text-overline` | 11 · 600 · +0.1em · uppercase | section labels |

Two sizes for UI text (C-011, #155): **content is 14px, only the shell chrome is 12px.** 12px suits the frame around the
work (nav, breadcrumb, toolbars, meta), but dense content at 12px reads poorly, Vietnamese diacritics most of all.
`text-ui` keeps its pre-1.0 name and size (14px), so apps' content text does not change; `text-chrome` is new. When
unsure, it is content: `text-ui`. (The 14px size is not called `text-body`: that is the body text colour, and one
Tailwind `text-*` name cannot be both a size and a colour.)

Which Semi piece uses which: **`text-chrome`**: the AppShell sidebar (nav items, sub-items, group labels, product name,
create button, utilities), Breadcrumb, Kbd and SearchPill's "/" hint, the command palette's group labels, hints and
footer, `BTN_SM`, `headerPrimary`, Badge, `STATUS_PILL` / `BADGE_BASE` / `COUNT_PILL` / `TAG`, Tooltip, the Menubar,
ThemeToggle, table header cells, chart axes and tooltip labels, calendar weekday row, counts and timers (Tabs, Item meta,
FileDrop sizes, DetailOverlay position, TaskHost timer, FilterChipRow / FilterPanel counts), menu-item descriptions and
shortcuts, Separator labels, field-row hints of HintTextarea, MobileTabBar labels. **`text-ui`**: everything else that
is UI text: buttons (`BTN_*`, `MODAL_BTN_*`), Field labels, help and errors, inputs and placeholders, select / combobox /
menu items, list and table rows, dialogs, toasts, empty states, disclosure, chat, the phone drawer of the shell (touch
rows stay 14).

Weights: headings are not bold. 400 and 500 do almost everything (`font-title` is 500); 600 only for overlines and a
few emphasised labels; 700 only in count badges. Phones: fields you type in stay 16px below `sm` (`text-input`, iOS zoom) and touch
targets stay 44px.

Density and type scale (`data-density`, `data-type-scale` on `<html>`): compact sets `text-ui` 13 and `text-lead`
14; the contrast type scale raises figure 22, section 24, tab-xl 32, title-xl 52, hero 44 (hero and tab-xl still step
down below sm).

Removed sizes and their 1.0 names (the `1.0.0-foundation` migration rewrites them): `text-caption`, `text-label` →
`text-chrome` (a `text-label` is flagged: a form label, help text or row is content, `text-ui`); `text-ui` is unchanged; `text-ui-lg`, `text-title`, `text-title-lg` → `text-lead` (`max-sm:text-title-lg`, the phone size of a field, → `max-sm:text-input`); `text-heading-sm`, `text-heading` →
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
(none), `border-card` (transparent 1px), `h-control` 34, `h-field` 36, `font-title` 500, `font-figure` (big numbers, the sans), the density unit `--spacing`.

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
