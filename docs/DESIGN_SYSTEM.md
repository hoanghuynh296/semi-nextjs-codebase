# Semi Design System

**This file is the single source of truth for every UI rule of every Semi app** (3D Noobs Studio and the other Semi
products). Rules change **only in the semi repo** (`hoanghuynh296/semi-nextjs-codebase`): update this file,
`QUICK_REF.md` and `DECISIONS.md` in the same commit as the code, extend `lint/semi-lint.mjs` when the rule can be
grepped, then release a new version (see the repo README). Apps never keep their own copy of a rule; agent memory,
skills, AGENTS.md and plan docs only point here. A rule that lives in two places drifts.

Apps read this file from `node_modules/@semi/ui/docs/DESIGN_SYSTEM.md` (the version they installed).

The UI is a **restrained dark product theme** with a **bento card layout**: dark page, rounded cards with thin borders,
a neutral icon menu, uniform chips and tags with coloured dots, one green accent for actions, few words.

Quick cheatsheet: `QUICK_REF.md`. Tokens: `@semi/ui/tokens.css` (generated from `tokens/tokens.json`). Base layer:
`@semi/ui/base.css`. Shared building blocks: `@semi/ui` (components) and `@semi/ui/styles` (class constants), see §16;
use them instead of re-typing class strings. Lint: `npx semi-lint` (config `semi-lint.json`, also run by the agent edit
hook of the `semi-design` plugin).

## Core principles

- **Icons over words.** Every nav item, card, section, empty state and dialog leads with an icon (tile or inline).
  Minimal text: no subtitle or caption under page titles, no captions that repeat what an icon already says.
- **Flat, no glow, no gradients.** No gradient fills, no blurred colour blobs, no coloured `shadow-[0_0_…]` glows
  (buttons, cards, status dots, power buttons). Depth comes from the surface tokens and translucent white overlays;
  emphasis ("on", active, running) comes from a flat primary fill or a `border-primary-500/30` border.
  The only gradient is the skeleton shimmer sweep in `base.css`.
- **Colour on content, not on chrome.** The nav menu is neutral (grey icons, no count badges; active item =
  `bg-white/[0.10] text-white`). Colour goes where it helps reading the content: a coloured dot or icon on filter chips
  and tags, card icon tiles use their area's soft tint, primary marks the main action and "on". Status colours (§3)
  appear only where they carry a state.
- **Unified sub-page toolbar.** Sub-pages open with a large `font-display` title (text only), followed by a single
  sticky toolbar row: pill filter tabs on the left, the icon-only primary CTA (`BTN_PRIMARY` + `BTN_ICON`) + secondary
  filter/search/refresh controls on the right (§4). All toolbar controls share `h-[34px]` and `text-[12px] font-medium`.
- **Cards, not lines.** Group content in rounded cards (`rounded-xl`, 12px) on the dark page; nested facts sit in tonal tiles.
- **One accent.** `primary-*` (Semi default green `#00AE42`; a product may override it, see §2b) for actions,
  selection and focus. Status colours carry meaning only (§3).
- **Phone first.** Used from iPhone and iPad: no horizontal page scroll at 375px, touch targets ≥ 36px (44px for nav),
  the home logo header is hidden under 768px (`md`).
- **No scrollbars.** Scrollbars are hidden on every page and screen size (`base.css`); areas still scroll. Don't add
  scrollbar styling back (`custom-scrollbar` is a no-op kept on old elements).
- **App-styled controls only.** No native `<select>`, `<input type="date">` or `type="number"`: their OS popups ignore
  the theme (iPad shows a white iOS wheel). Use `CustomSelect`, `DatePicker`, `NumberInput`.

## 1. Typography

| Role | Classes |
|---|---|
| Page title (sub-page) | `font-display text-[22px] sm:text-[26px] leading-[1.15] font-semibold text-white tracking-tight`, text only, no subtitle |
| Section / card title | `text-[13px]–text-[15px] font-semibold text-white tracking-tight` |
| UI / nav text | `text-[12px] font-medium text-gray-300` |
| Label | `text-[12px] font-medium text-gray-400` (sentence case, never uppercase) |
| Caption | `text-[11px]–text-[12px] text-gray-500` |
| Big number (KPI) | `text-[22px] leading-tight font-semibold tracking-tight tabular-nums text-white` |
| Numbers (temperatures, %, times, money, counts) | add `tabular-nums` (Geist, digits line up) |
| Code (code editors, parameter keys, error codes) | `font-mono`, only there |

Geist (`--font-sans` with `font-feature-settings: "ss02" on`) for UI and body text, and Montserrat Alternates
(`--font-display`, class `font-display`) for large page titles, both loaded with `next/font/google` (Latin + Vietnamese
subsets) in `app/layout.tsx` as the CSS variables `--font-geist` / `--font-montserrat-alternates` (or set
`--font-sans-family` / `--font-display-family`). ui-monospace only for code. Numbers stay in Geist with `tabular-nums`:
a monospace font for prices and readings looks like a terminal, not a product. Weights: only `font-medium` and
`font-semibold`. Sizes in px (`text-[11px]`…`text-[15px]`), not Tailwind's `text-xs` / `text-sm` / `text-base`.
Minimum `text-[11px]`. Button and label text is sentence case ("Lưu", "Xem lại"), never ALL CAPS.

## 2. Surfaces & colour

| Token | Hex | Use |
|---|---|---|
| `bg-canvas` | `#111111` | outer frame behind the floating menu & content panels (`md+`) |
| `bg-app` | `#181818` | page / content panel background |
| `bg-panel` | `#262626` | cards, sidebar panel, header |
| `bg-field` | `#2E2E2E` | inputs, modals, popovers |
| `bg-raised` | `#383838` | hover / track fill on top of field |
| `border-line` / `border-line-hover` | `#333333` / `#474747` | card and input edges / hover (quiet: cards read by fill) |
| `border-divider` | `#2E2E2E` | single-side separators inside a panel |
| Tonal fills | `bg-white/[0.04]` tile · `[0.05]` input · `[0.08]` active · `[0.10]` selected pill | depth on top of a card |

Text colour on the page root is a token (`text-gray-200`), never a hex class (`text-[#e5e7eb]`, `bg-[#16171b]`).

## 2b. Brand colour per product

`primary-*` is the only token a product may change. Override it in the app's own CSS **after** the Semi import, with
the full 50–900 scale (keep 500 = main, 400 = hover):

```css
@import "tailwindcss";
@import "@semi/ui/tokens.css";
@import "@semi/ui/base.css";
@theme {
  --color-primary: #3B82F6;
  --color-primary-50: #EFF6FF; /* … 100–800 … */
  --color-primary-500: #3B82F6;
  --color-primary-900: #1E3A8A;
}
```

Surfaces, greys, status colours, radius and type stay Semi's. Record the product's brand hex in its own AGENTS.md.

## 3. Colour meaning

- **Primary** `primary-*` (Semi default `#00AE42`, hover 400 `#1FBC5C`): buttons, focus ring, power-on.
- **Status green** `emerald-*`: online, ready, on, success. Never as an accent.
- **Amber**: busy, paused, warning, connecting. **Rose**: error, danger, destructive. **Sky**: info, cost.
- **Tile tones** (`TILE_TONES` in `Icon.tsx`, soft 15% tint + light icon; `TONE_TEXT` for a bare icon): green ·
  pink · sky · amber · violet (indigo) · gray (advanced / unknown). Each app maps its areas to tones once (in its own
  extension doc) and keeps the mapping everywhere. The nav menu uses neutral grey `w-4 h-4` (16px) icons
  (`text-gray-400`, active `bg-white/[0.10] text-white`).
- **Chips and tags** (`Chip.tsx`) all share one pill-tab style (`rounded-full h-[34px] px-3.5 text-[12px] font-medium`):
  borderless ghost pills when off (`bg-transparent border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]`)
  and subtle filled pills when selected (`bg-white/[0.10] border-white/[0.08] text-white`, `chipClass(active)`); static
  tags use `TAG` (neutral). Per-item colour appears only on a leading dot (`TONE_DOT`) or icon (`chipIconClass(tone)`).
  `Pills` selected = `bg-white/[0.10] text-white`.
- Data series in charts may use several hues; that is the one place extra colours belong. Syntax colours in code
  views are the other exception.

## 4. Layout

- **Radius scale:** controls, inputs, buttons and inner tiles `rounded-lg` (8px) · cards `rounded-xl` (12px) · panels,
  hero and modals `rounded-2xl` (16px) · filter chips, pills, avatars, badges `rounded-full`. Tiny inline marks
  (a colour swatch, a key cap) may use `rounded` (4px). No `rounded-md`.
- **Control height:** all toolbar buttons, filter chips, pills, search inputs, custom selects and date pickers use
  `h-[34px]` and `text-[12px] font-medium` so toolbar rows align evenly.
- **Spacing scale:** 4 / 8 / 12 / 16 / 20 / 24 px. Card padding `p-4`, gaps inside a card `gap-3`, between cards
  `gap-3.5`–`gap-4`, between sections `gap-5`.
- **Home shell (`md+`):** two inset `rounded-2xl` panels inside a `bg-canvas` frame (`md:p-2 md:gap-2`): a collapsible
  left **Panel Menu** (`w-52`, or `w-14` collapsed, toggled via the `sidebar` icon button) and a right **Panel
  Content** (`bg-app`) holding a full-width content container (`max-w-[1440px] px-4 sm:px-6`). Phones (`< md`) use a
  bottom tab bar with the same tabs (icons `w-5 h-5`).
- Each sub-page opens with a large display title (text only), followed by the toolbar row: pill filter tabs
  (`CHIP_BASE` + `chipClass(active)`) on the left, icon-only primary CTA + secondary controls on the right. The row
  carries `STICKY_TOOLBAR` so the filters stay on top of the scrolling content (below the safe area on phones).
  "Thêm …" and "Làm mới" buttons are icon-only (`BTN_PRIMARY`/`BTN_SECONDARY` + `BTN_ICON`, `RefreshButton`) with
  `title` + `aria-label` carrying the label.
- Grids expand across wide screens (e.g. `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`); touch screens
  (iPad) stop at 4 columns (`not-any-pointer-coarse:` for 5+). Card grids **beside a sidebar** size columns by
  `@container` (`@xl:grid-cols-…`), never by viewport breakpoints (lint rule `viewport-grid-cols`, enabled per path via
  `"only"` in `semi-lint.json`).
- A filter sidebar beside long results scrolls on its own: on desktop the row fills the screen and sidebar and results
  are two `overflow-y-auto overscroll-contain` columns (no sticky + JS height). Long lists load the next page near the
  end ("Xem thêm" stays as fallback). Where filters sit in a sheet, the active ones show as removable chips.
- Every flex/grid child that holds text gets `min-w-0` + `truncate` so long names never push the page wider.
- No narrow `max-w-4xl/5xl/6xl` page containers: content uses the full width (cap `max-w-[1440px]`).

## 4b. Stand-alone app header

Every stand-alone app page uses the same top bar, `<AppHeader>`: logo + app title on the left, the app's actions on
the right. Props: `title`, `productName` (home bar), `logo` / `logoIcon`, `homeHref`, `onHome`, `hideTitleOnPhone`.

- Title = the app's name only (the product's name is never put in front of a module's name).
- On the right: icon buttons (`HEADER_ICON_BTN` + `HEADER_ICON_OFF|ON`), "Huỷ" when opened from another app, and ONE
  green main action (`headerPrimary(enabled)`), disabled until it can run; never a second green button elsewhere on the
  screen (a panel's own action is `BTN_SECONDARY`).
- **There is no Home button.** Clicking the logo + title returns home in the same tab; pass `onHome` when leaving needs
  a confirmation. The bar is full width, `h-13`, `bg-app/95 backdrop-blur-xl border-b border-divider`, sticky.
- Tool apps (an editor around a canvas / 3D view): left `SidePanel` (320 px, collapses to a rail with the sidebar
  icon), sections `p-3 sm:p-3.5 border-b border-divider`, labels `text-[12px] font-medium text-gray-400`, rarely used
  options under a collapsed "Tuỳ chọn khác". Floating canvas controls come from `@semi/ui/styles` (`VIEWPORT_TOOLBAR`
  top centre, `VIEWPORT_PILL` undo/redo bottom centre, `VIEWPORT_ROUND_BTN` bottom left, `VIEWPORT_BADGE` bottom
  right). Phones: canvas on top, settings in a bottom sheet titled with the app name. No file open: a start screen
  whose heading is the app's name and whose big tile is the app's icon in its tone.

## 5. Card

```tsx
import { CARD, CARD_HOVER, CARD_ACTIVE } from "@semi/ui/styles";

<div className={`${CARD} p-4 flex flex-col gap-3`}>…</div>          // static
<button className={`${CARD_HOVER} p-4 text-left`}>…</button>         // opens something
<div className={`${CARD} ${CARD_ACTIVE} p-4`}>…</div>                // active / "on" / running: primary border, no glow
```

Card header row: `IconTile` (or the item's image) · name (`text-[14px] font-semibold`) + caption · icon actions
(`ICON_BTN`, `ICON_BTN_DANGER`) on the right.

## 6. Hero card

`HERO` (`rounded-2xl p-4 sm:p-6`): a plain panel for the top block of a page. No glow blob.

## 7. Icon tile

`<IconTile name="box" tone="green" size="sm|md|lg" />`: rounded square with a soft tint of the area's tone.
`sm` 28px (list rows) · `md` 36px (card headers) · `lg` 44px (dialogs, empty states). Nav items use a grey `w-4 h-4`
icon in a `h-8` row; the active item uses a neutral tonal fill (`bg-white/[0.10] text-white`). Dashboard quick feature
tiles use `w-11 h-11 rounded-xl` with their area's `TILE_TONES`.

## 8. Section heading

```tsx
<div className={SECTION_HEAD}>
  <h2 className={SECTION_TITLE}>Thiết bị</h2>
  <span className={COUNT_PILL}>3</span>
  <button className={SECTION_LINK}>Quản lý <Icon name="chevron" className="w-3.5 h-3.5" /></button>
</div>
```

## 9. Buttons

`BTN_PRIMARY` / `BTN_SECONDARY` / `BTN_DANGER` from `@semi/ui/styles` (`rounded-lg`, `h-[34px]`,
`text-[12px] font-medium`, flat). Icon-only: add `BTN_ICON`, or `ICON_BTN` (`w-7 h-7 rounded-lg`) inside cards. Big
state toggles (power) are round: `w-20 h-20 sm:w-24 sm:h-24 rounded-full`, flat `bg-primary-500 text-white` when on,
`bg-white/[0.05]` when off. A running action shows a spinner inside its own button only.

## 10. Pills, chips, badges

- Single choice: `Pills` (`h-[34px] rounded-lg` track, active = `bg-white/[0.10] text-white`).
- Sub-page filter tabs / chips: `Chip` (see §3 Chips). Static labels: `TAG`.
- Filter chips may carry an icon and a count: icon `w-3.5 h-3.5` + label + `COUNT_PILL`.
- Status pill: `STATUS_PILL` + `bg-<tone>-500/15 text-<tone>-300` with a status dot (§11).
- Tag / meta chip: `inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white/[0.05] text-[11px] text-gray-400` with an icon.

## 11. Status dot

Flat dot next to state text, no glow: online `bg-emerald-400`, running `bg-primary-400 animate-pulse`,
busy/paused/connecting `bg-amber-400`, error `bg-rose-500`, offline `bg-gray-500`. Use `STATUS_DOT`.
Size `w-2 h-2` (`w-1.5 h-1.5` inline in a caption).

## 12. Tiles & readings

Nested facts (readings, KPIs, sensor values) sit in `TILE` (`rounded-lg bg-white/[0.04] border border-white/[0.06]`)
with an icon above or before a `tabular-nums` value. Progress is a ring or a `h-1.5 rounded-full` bar in
`primary-500` on `bg-white/[0.08]`.

## 13. Empty state

`EMPTY`: dashed `rounded-xl` card with an icon in a `w-12 h-12 rounded-xl bg-white/[0.05]` square above one short
line. Make it the button that adds the first item when there is one.

## 13b. Loading (shimmer skeleton)

While a page, tab, list or number loads, show its shape with shimmering placeholders, never a "Đang tải…" line or a
centred spinner. `Skeleton.tsx`: `Skeleton` (one block, size via className), `SkeletonCard`, `SkeletonGrid` (use the
real grid's classes), `SkeletonRows` (lists, dialogs, tables), `PageSkeleton` (Suspense fallbacks), `Loading` (adds
`role="status"` / `aria-busy`; its `label` is for screen readers only). The sweep is the `.shimmer` class in
`base.css` (stops under `prefers-reduced-motion`). Keep "not loaded yet" apart from "empty" (e.g. `undefined` =
loading, `null` = failed, or a `loaded` flag) so an empty state never flashes before data. Long operations the user
started (upload, export) show a progress bar with a short label and percentage.
One exception: a list a form field fetches by itself in the background shows one small `role="status"` line under that
field while it loads: a `w-3 h-3` spinner + "Đang tải …" in `text-[12px] text-gray-500` (the text sits in the
`role="status"` element, which the lint allows), gone when done; a failed fetch stays silent.

## 14. Modal & dialog

`MODAL_BACKDROP` (`bg-black/70 backdrop-blur-lg`) + `MODAL_PANEL` (`bg-field border-line`): full screen on phones
(`max-sm:h-dvh max-sm:rounded-none max-sm:border-0`, edge-to-edge), a centred `rounded-2xl` dialog from `sm` up.
The panel caps itself at `92dvh` and scrolls; pass only a width (`max-w-md`…) and, for a fixed header / footer,
`flex flex-col` with a `flex-1 overflow-y-auto` body. `MODAL_HEAD` / `MODAL_TITLE` / `MODAL_FOOT`: header = `IconTile`
+ title + close `MODAL_CLOSE`; footer buttons right-aligned, stretched on a phone. Buttons are `MODAL_BTN_*`.
Every overlay (modals, full-screen viewers, popups, numpad) uses this backdrop. Big detail views split into two columns
from `md` (iPad). Confirmations go through `confirmDialog()` (mount `<ConfirmHost />` once in the root layout), never
`window.confirm`. Phones can use a bottom sheet for pickers and filter panels.

**Links to other sites** always use `ExternalLink` (new tab, `rel="noopener noreferrer"`). Apps inside a native
WebView pass an `onClick` that opens the URL outside. Never a bare `<a target="_blank">` to another site.

**AI text** is rendered with `Markdown` (light markdown: paragraphs, headings as bold lines, lists, bold, code,
links), never raw. An app's AI chat is built from one set of shared parts (list, composer, suggestion rows) kept in
that app; a new AI feature reuses them, never its own composer or row classes.

## 15. Icons

`<Icon name="…" />` from `Icon.tsx` (new Lucide-style 24×24 paths go into `ICONS` in the semi repo). Stroke 1.75,
round caps and joins, no fills (play / stop too). Sizes: `w-4 h-4` default, `w-3.5 h-3.5` in chips and captions,
`w-5 h-5` in `md` tiles, `w-6 h-6` in empty states and `lg` tiles. No emoji or unicode pictograms (✕ ✓ ✗ ⚠) in UI
text, toasts or buttons: use `<Icon name="close" />`, `check`, etc. An app-only icon (a product logo) lives in the app
and is listed in `semi-lint.json` → `skip.inline-svg-path`.

## 16. Shared building blocks (`@semi/ui`)

| Import | Exports |
|---|---|
| `@semi/ui` → `AppShell.tsx`, `MobileTabBar.tsx` | `AppShell` (floating Bento 2-panel frame, collapsible `w-52`/`w-14` menu), `MobileTabBar`, `TAB_BAR_PAD` (§4) |
| `PageTitle.tsx`, `SubpageToolbar.tsx` | `PageTitle`, `PageTabsTitle` (underline display tabs), `SubpageToolbar` (`STICKY_TOOLBAR` + icon-only CTA + search + refresh) (§4a) |
| `KpiCard.tsx`, `Modal.tsx` | `KpiCard` (`18px–22px` metric card with shimmer), `Modal` (shared portal dialog with `MODAL_HEAD` + `MODAL_FOOT`) (§13, §14) |
| `Icon.tsx` | `Icon`, `ICONS`, `IconName`, `IconTile`, `TILE_TONES`, `TONE_TEXT`, `TileTone` |
| `AppHeader.tsx` | `AppHeader` (stand-alone app top bar, §4b) |
| `PageActions.tsx` | `PageActions` (a tab's header buttons), `PageActionsSlot` + `PageActionsProvider` |
| `Skeleton.tsx` | `Skeleton`, `SkeletonCard`, `SkeletonGrid`, `SkeletonRows`, `PageSkeleton`, `Loading` (§13b) |
| `confirmDialog.tsx` | `confirmDialog()`, `ConfirmHost`, `ConfirmOptions` (§14) |
| `Markdown.tsx` | `Markdown` (AI answers) |
| `ExternalLink.tsx` | `ExternalLink` |
| `Pills.tsx`, `Chip.tsx` | single choice / on-off chips (`Chip`, `CHIP_BASE`, `chipClass`, `chipIconClass`, `TAG`, `TONE_DOT`) |
| `SearchInput`, `CustomSelect`, `CustomCombobox`, `DatePicker`, `Pagination` | toolbar and form inputs |
| `NumberInput` (+ `NumPadPopup`, `useCoarsePointer`) | every number field (app numpad on touch screens) |
| `SidePanel`, `SidePanelToggle`, `RefreshButton` | tool-app left panel, icon-only reload action |
| `@semi/ui/styles` → `surfaces.ts` | `SHELL_*`, `CARD`, `CARD_HOVER`, `CARD_ACTIVE`, `HERO`, `TILE`, `SECTION_*`, `COUNT_PILL`, `EMPTY`, `ICON_BTN` / `ICON_BTN_DANGER`, `STATUS_PILL`, `STATUS_DOT`, `STICKY_TOOLBAR`, `MODAL_*`, `FIELD_LABEL`, `FIELD_INPUT`, `FIELD_TEXTAREA` |
| `buttons.ts` | `BTN_PRIMARY`, `BTN_SECONDARY`, `BTN_DANGER`, `BTN_ICON`, `MODAL_BTN_*` |
| `appChrome.ts` | `HEADER_ICON_*`, `headerPrimary`, `HEADER_PILL`, `VIEWPORT_*` |

Components are client components (`"use client"`), shipped as TypeScript source: the app adds
`transpilePackages: ["@semi/ui"]` to `next.config.*` and `@source` lines for `src` and `styles` to its CSS (README).

A component used by **two or more Semi apps** belongs here; open a change in the semi repo instead of copying it.

## Form fields

Input: `bg-white/[0.05] border border-line rounded-lg px-3 py-2 text-[14px] text-white placeholder-gray-500
focus:outline-none focus:border-primary-500/50 focus:bg-white/[0.08] transition-colors`. Label above it (§1 label).
Never `focus:outline-none` without a visible focus border.

## Anti-patterns (enforced by `semi-lint`)

- Gradients, glow blobs, coloured glow shadows (`shadow-[0_0_…]`), "glassmorphism" panels.
- Solid greys for surfaces (`bg-gray-800/900`), `border-gray-700`, hard-coded hex colour classes.
- `font-bold` / `extrabold` / `black`; `text-[9px]` / `text-[10px]`; `text-xs` / `text-sm`; `uppercase` labels; ALL-CAPS button text.
- Off-scale radii (`rounded-md`); `font-mono` for numbers; coloured icon tiles in front of every card title.
- Emoji or unicode pictograms as icons; filled glyphs mixed with stroke icons; stroke 2+; new inline `<svg>` paths.
- Native `<select>`, `type="date"`, `type="number"`, `window.confirm` / `alert`.
- "Đang tải…" text or a page spinner instead of a skeleton.
- A Home button in an app header; subtitles under page titles.
- Coloured nav icons or count badges in the menu; chips or tags with different background colours.
- Narrow `max-w-5xl` page containers that waste horizontal space.
- Copies of `@semi/ui/styles` class strings (app chrome) instead of the constants; `window.open` / bare external links.

## App extensions

An app may have screens Semi does not cover (a 3D viewport, a printer dashboard, a code editor). It documents them in
its **own** extension doc (e.g. `docs/UI_EXTENSIONS.md`) that builds on these rules and never contradicts them. When a
pattern there is needed by a second app, move it into Semi.

## Implementation notes

1. Tokens: edit `tokens/tokens.json` in the semi repo, run `node scripts/build-tokens.mjs`; never edit `tokens.css`.
2. Pages are client components where they use Semi components (`"use client"`); Semi works with static export.
3. Persisted UI prefs use `localStorage` wrapped in try/catch, keys prefixed per app.
4. After UI edits: `npm run semi:lint` + `tsc --noEmit` + build, then look at 375px, iPad and 1440px.

The history of decisions is in `DECISIONS.md`.
