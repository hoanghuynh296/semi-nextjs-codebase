# Semi Design System

**This file is the single source of truth for every UI rule of every Semi app** (3D Noobs Studio, sales-hub and the
other Semi products). Rules change **only in the semi repo** (`hoanghuynh296/semi-nextjs-codebase`): update this file,
`QUICK_REF.md` and `DECISIONS.md` in the same commit as the code, extend `lint/semi-lint.mjs` when the rule can be
grepped, then release a new version (see the repo README). Apps never keep their own copy of a rule; agent memory,
skills, AGENTS.md and plan docs only point here. A rule that lives in two places drifts.

Apps read this file from `node_modules/@semi/ui/docs/DESIGN_SYSTEM.md` (the version they installed). Companion docs:
`TOKENS.md` (every token name and value), `QUICK_REF.md` (the cheatsheet), `MIGRATION-1.0.md` (moving an app from 0.x),
`BRANDS.md` (brand kits), `ICONS.md`. Tokens: `@semi/ui/tokens.css` (generated from `tokens/tokens.json`). Base layer:
`@semi/ui/base.css`. Components: `@semi/ui`; class constants: `@semi/ui/styles` (§16). Lint: `npx semi-lint`.

**1.0.** Semi 1.0 is one breaking release (tickets T1–T9 all merged on `main`; upgrading from 0.x: `MIGRATION-1.0.md`).
Every rule, token and component below is shipped in 1.0.0; never build a local stand-in.

## 0. The 1.0 look in one page

A **restrained product UI, dark and light**: a neutral grey frame, panels and cards that separate by tone (no borders,
no shadows), compact 12px shell chrome around 14px content, headings that are not bold, ordinary actions in neutral
buttons and the brand colour on very few things. Few words; icons where they help scanning.

### Brand colour rule

The brand primary (`bg-primary` + `text-on-primary`) and the optional brand secondary (`bg-secondary` +
`text-on-secondary`) are used **only** for:

1. **The main button of a whole page or of a modal:** its commit action (Gửi, Lưu, Gửi yêu cầu báo giá). **At most one
   filled brand button per page and per modal**; a second one is a warning (`primary-actions`), unless the app's owner
   asked for that case (say so in a comment).
2. **The nav's one main action** (`mainAction` of `AppShell`).
3. **The active underline of big text tabs** (`decoration-primary`).
4. **Attention marks:** count badges that ask for action (unread, to approve) and "Mới" tags.
5. **A case the app's owner asks for** (say so in a comment where it is used).

Nothing else. Links, check marks, active tabs, selection, focus rings, toggles, charts' first series, icons and
headings are neutral. Every ordinary action is a neutral button (subtle, surface, inverse, outline, ghost: §9). Status
colours (success, warning, danger, info) are one fixed palette for every brand and carry meaning only (§3). Owner
decisions C-006, C-008.

### When to use which

**Buttons** (§9, `Button variant`; T4, #146):

| Need | Variant |
|---|---|
| An ordinary action (Lưu bản nháp, Xuất, Lọc) | `subtle` (the default) |
| A toolbar action (Mời, Tuỳ chỉnh) | `surface` |
| The main action of a card, or of a list page's title row (Thêm, Xem) | `inverse` (the pill: small, fully round) |
| A secondary action beside an inverse one (Chia sẻ) | `outline` |
| An icon button (32×32), the nav bottom row, a quiet row action | `ghost` |
| The one commit action of a page or modal; the nav's main action; a case the owner asked for | `primary` (or `secondary`, when the brand has one) |
| A destructive confirm in a dialog | `danger` |

**Tabs and filters** (§4h, T5 #147):

| Need | Use |
|---|---|
| 5+ sections of one page, or sections with icons (settings-like pages, Cấu hình) | `PillTabs` |
| 2–5 filter values shown in full, often with counts (Đang mở · Đã đóng · Tất cả) | `SegmentedControl` |
| 2–4 top-level views of a discovery or reading page, as its heading (display face, brand underline) | big `TextTabs` |
| Filters of a list (status, owner, date) | `FilterChipRow` (md+) / `PhoneFilterBar` + `FilterPanel` (phones) |
| Sections of one record inside a card or dialog | `Tabs` (underline) |
| List ↔ grid (and optional density) icon toggles | `ViewSwitch` |

**Page layouts** (§4a; `Page`, `SubNav`, `ListReaderLayout`, #149):

| Page | Layout |
|---|---|
| A list, a table, a workspace: people work in it all day | **work**: flush, no centred max-width, card padding 16 / 24 |
| Settings, an explore or catalogue page, an article: people read it | **reading**: one column centred at max 1536px, 16px card padding, 64px bottom |
| An area with its own sub-pages (Cấu hình › Tài khoản, Thông báo …) | **two-column**: a 240px sub-nav card, then the main card |
| A mailbox, a queue, chats: a list and the open item side by side | **list + reader**: a list card and a reader card |

### Core principles

- **Few words, icons where they help scanning.** Nav items, actions, statuses and empty states carry an icon; a label,
  a row or a card title does not need one (§19). No subtitle or caption under page titles, no caption that repeats what
  an icon says.
- **Flat, no glow, no gradients.** Depth comes from the neutral surface steps (§2); emphasis ("on", active, selected)
  comes from a neutral fill (`bg-inverted`, `bg-item-selected`, `bg-item-checked`) or a `border-outline-line` border.
  Skeletons pulse quietly by opacity (`motion-pulse`), never a gradient shimmer.
- **Neutral chrome, colour on content.** The nav is neutral (grey 16px icons, the active item `bg-item-selected
  text-strong`). Colour goes where it helps reading content: a status badge, a coloured dot on a filter chip, a tile
  tone. The brand colour follows the rule above.
- **Space first, then frames.** Group with white space; a card (`rounded-card`) only for one thing people act on. At most
  three frames inside each other, one line between two things (§4c).
- **One look.** Every brand and app shares the same neutrals, radii, control sizes and type scale (`TOKENS.md`). There
  are no styles and no `data-style` since 1.0. A brand changes its two fills, its fonts, its logo and its voice; a
  product changes its density and type scale (§19).
- **Phone first.** No horizontal page scroll at 375px; touch targets 44px; fields you type in are 16px below `sm`.
- **No scrollbars.** Hidden everywhere (`base.css`); areas still scroll.
- **App-styled controls only.** No native `<select>`, `<input type="date">` or `type="number"` (their OS popups ignore
  the theme): `CustomSelect`, `DatePicker`, `NumberInput`.

## 1. Typography

Names and values: **`TOKENS.md`** "Type scale" (the contract; values in `tokens/tokens.json`).

| Role | Classes |
|---|---|
| Hero | `font-display text-hero font-normal text-strong` (36, 32 below sm) |
| Reading-page title (one column) | `font-display text-title-xl font-medium text-strong` (44) |
| Page title of a work page, in its content card | `text-figure font-normal text-strong` (18 / 400), on the row of the page's main action (`PageTitle`, default `variant="work"`) |
| Big text tabs | `font-display text-tab-xl font-normal` (28, 24 below sm; weight 400 in the brand display face; active `decoration-primary`, inactive `opacity-20`) |
| Section heading | `text-section text-strong` (20 / 500 from the token) |
| Card title, lead text | `text-lead font-medium text-strong` (15) |
| **Content**: list and table rows, form labels and help, field values, buttons, menu items, dialog text, body | `text-ui` (**14**) `text-body` / `text-muted` |
| **Shell chrome**: nav, breadcrumb, route header, toolbar compact buttons, meta (times, counts, hints), kbd, badges, tooltips | `text-chrome` (**12**) `text-body` / `text-muted` |
| Group label, kbd hint, "Untitled" | `text-chrome text-faint`; the nav group label is `text-nav-label` (10 / 500 uppercase, normal tracking, faint; AppShell draws it) |
| Section label in a form or detail panel ("MODEL", "PROMPT") | `text-overline text-muted` (11 / 600 / +0.1em uppercase) |
| Tag, chip | `text-tag` (10 / 500 / +0.02em) |
| Count badge | `text-badge` (10 / 700) |
| Numbers | add `tabular-nums` |
| Code | `font-mono`, only there |

- **Two UI sizes (C-011):** content is 14px (`text-ui`); only the shell chrome around the work is 12px
  (`text-chrome`). When unsure, it is content. `TOKENS.md` lists which Semi piece uses which.
- **Headings are not bold.** 400 and 500 do almost everything (`font-title` is 500); 600 only for overlines, "n đã chọn"
  and a few emphasised labels; 700 only in count badges. Never `font-bold`.
- **Two families.** `font-sans` (the UI face: brand `fonts.sans`, default Geist) for everything; `font-display` (brand
  `fonts.display`, falling back to the UI sans) only for the hero, reading-page titles, big tabs and editorial section
  heads. Tracking −0.01em on display sizes from 20px (in the tokens).
- **Overline** (`text-overline`) is the only uppercase text, and only as a **group or section label**: a nav or drawer
  group, a palette group, a mega menu column, a section of a form or detail panel, and the meta line of a `MediaCard`
  (a category or count under the caption, #191). Never the label of one field, a
  button, a link, a table cell or a heading (`overline-place`).
- Sizes come from the type tokens only, never `text-[13px]` or `text-xs` / `text-sm` / `text-base`. Every size carries
  its line height (about 1.5 for UI and body: 12/18, 14/22, 15/24; 1.1–1.3 for display), so text rarely needs
  `leading-*`. Minimum `text-tag` / `text-badge` (10px, marks only). Sentence case for buttons and labels ("Lưu", "Xem
  lại"). Sizes are emitted in rem, so text follows the browser's font size (WCAG 1.4.4).
- **Fields on a phone:** text you type in is 16px below `sm` (`max-sm:text-input`): iOS zooms into a field under
  16px and never zooms back. Never `maximum-scale` / `user-scalable=no`. `FIELD_INPUT`, `FIELD_TEXTAREA` and every
  Semi text-entry control (Input, SearchInput, NumberInput, InputGroup, InputOTP, Textarea, CustomCombobox, Command, the
  Chat composer) already do it; a field of your own adds `max-sm:text-input`. Touch rows stay 14.

## 2. Colour tokens

Components and apps use the semantic utilities only, never a hex, a palette shade (`bg-white`, `text-slate-900`,
`text-amber-600 dark:text-amber-400`) or a `dark:` pair. Every token has a value per theme, so one class works in dark
and light. Full list with values: **`TOKENS.md`**.

| Group | Utilities | Use |
|---|---|---|
| Surfaces (pure neutral, same for every brand) | `bg-canvas`, `bg-app`, `bg-panel`, `bg-field`, `bg-field-focus`, `bg-raised`, `bg-raised-2`; `bg-card`, `bg-card-field`, `bg-panel-0…4` | frame, content column, nav / card / modal, input fill, segmented track and toolbar buttons, segmented active pill |
| Text tiers | `text-strong`, `text-body`, `text-muted`, `text-faint` | titles and values; card text; descriptions, inactive items, breadcrumb, placeholders; group labels, kbd hints, "Untitled" |
| Lines | `border-field-line`, `border-field-line-focus`, `border-outline-line`, `border-line`, `border-divider`, `border-control-line` | input at rest / on focus (quiet fields), outline buttons and a selected card, frames, dividers, checkboxes and radios |
| Neutral states | `bg-item-hover`, `bg-item-selected`, `bg-item-checked`, `bg-subtle-button`, `bg-inverted` + `text-on-inverted`, `ring-focus` / `border-focus` | hover; the open record or active item; checked rows in selection mode; ordinary buttons; checked controls and the inverse button; focus |
| Brand fills | `bg-primary` / `hover:bg-primary-hover` + `text-on-primary`; `bg-secondary` / `hover:bg-secondary-hover` + `text-on-secondary` | only what the brand colour rule (§0) allows |
| Status (same for every brand) | `text-*-fg`, `bg-*-bg`, `border-*-border`, `bg-*-solid` + `text-on-solid`; `text-tone-*` | danger, success, warning, info; tile and tag tones |

- **Text on surfaces:** every tier reaches 4.5:1 on `panel`, `app`, `canvas` and `card` in its theme; `text-strong`,
  `text-body` and `text-muted` also on `card-field`, `raised` and the item fills. `text-faint` is for page surfaces and
  the card only. The token build checks every pair and fails on a miss.
- **Selection is neutral:** `bg-item-hover` (hover), `bg-item-selected` (the open record, the active nav item, the
  selected option), `bg-item-checked` (checked rows or cards in selection mode); a checked control is `bg-inverted`.
  Light row states step hover < checked < selected, each visible on a card (C-010).
- **Focus is neutral:** `ring-focus` / `border-focus` (the strong text colour, ≥ 3:1 everywhere), never the brand.
- There is **no brand-derived colour**: no tinted greys, no `accent-*`, no `primary-50…900` scale (removed in 1.0;
  `MIGRATION-1.0.md`).

### Surfaces (C-030)

Pages separate by **tone, not borders**. One numbered scale from the outer frame to the brightest step:

| Step | Utility | Use |
|---|---|---|
| `panel-0` | `bg-panel-0` = `bg-canvas` | the frame around the panels |
| `panel-1` | `bg-panel-1` | a band between the frame and the content (rare) |
| `panel-2` | `bg-panel-2` = `bg-app` | the content column; holds the route header |
| `panel-3` | `bg-panel-3` | a calm block inside the content (an inset area, a workspace control panel) |
| `panel-4` | `bg-panel-4` = `bg-panel` | nav panel, content card of the frame, sub-nav card, modal, popover, menu, toast |
| card | `bg-card` | a card inside content: `CARD`, `<Card>`, `HERO` |
| card-field | `bg-card-field` | tiles, readings, table heads inside a card (`TILE`) |
| tint / tint-hover | `bg-tint`, `hover:bg-tint-hover` | `ICON_BTN`, `MODAL_CLOSE`; `tint-hover` is the hover of a subtle button (`BTN_SUBTLE`, fill `bg-subtle-button`) |
| inverted | `bg-inverted` + `text-on-inverted` | checked controls, the selected day, the inverse button |

- Dark: canvas #101010, app #161616, panel #1a1a1a; light: canvas #ebebeb, app #f3f3f3, panel #ffffff. The steps
  between, the card, the fills and inverted are mixed from them in CSS (`color-mix(in oklab, …)`).
- **Cards have no border** (`card-border` is a transparent 1px, so hover borders do not move the layout). A dense data
  view that needs an edge uses `<Card bordered>` / `CARD_BORDERED`.
- **A block that means "card" is `bg-card`**, never `bg-panel` (that is the frame's panel, modal and popover step).
- `bg-card` and `bg-card-field` are `@utility` rules, so opacity modifiers (`bg-card/80`) do not work; `var(--color-card)`
  is there for app CSS.

How the CSS is built: each themed value is a source variable `--semi-*` set in `:root, [data-theme=dark]` and
`[data-theme=light]`; utilities read them through `@theme inline` (`bg-panel` → `var(--semi-panel)`), and `--color-*`
is re-declared per theme scope for app CSS (`var(--color-panel)`).

### Status, overlay, elevation and layers

| Need | Tokens |
|---|---|
| Status callout / badge / quiet danger button | `bg-{danger,success,warning,info}-bg` + `border-*-border` + `text-*-fg` (`Alert`, `BTN_DANGER_SUBTLE`) |
| Danger button (solid red, #189) | `bg-danger-fill` (hover `danger-fill-hover`) + `text-on-solid` (`BTN_DANGER`, `MODAL_BTN_DANGER`) |
| Status dot, progress fill, destructive solid | `bg-*-solid` (+ `text-on-solid`) |
| Backdrop of modal / drawer / dialog | `bg-overlay` (or `OVERLAY`) |
| Floating layer (modal, popover, menu, toast, tooltip) | `shadow-overlay` |
| Controls floating over a canvas | `shadow-float` |
| Global stacking | `z-sticky` 30 < `z-drawer` 40 < `z-modal` 50 < `z-dialog` 60 < `z-sheet` 70 < `z-popover` 80 < `z-toast` 90 < `z-tooltip` 95 |

Surfaces stay flat: no `shadow-sm/md` on cards (`shadow-card` is none). Local stacking inside one component keeps
`z-10` / `z-20`; anything that covers the page uses a layer token, never `z-[9999]`.

### Theme switching

Themes are set by `data-theme` on `<html>` (with `.dark` / `.light` classes); `data-theme="system"` follows the OS in
pure CSS. Any element can pin a theme for its subtree with `data-theme="light|dark"`. Users pick one with
the account avatar menu of AppShell's route header (Light / Dark / System as radio items, from the internal `useThemeChoices`: the default place in an app),
`<ThemeSwitcher />` (Sáng · Tối · Hệ thống; `variant="menu"`: one icon button with a Menu), `useThemeUtility()` (the same
Menu as an AppShell `tools` item, for an app without an account) or `<ThemeToggle />` (one tap). Apps render `<ThemeScript />` in `<head>` (no flash of the wrong theme) and
wrap the body in `<ThemeProvider>` with the **same options**:

```tsx
import { ThemeProvider, ThemeScript } from "@semi/ui";

export default function RootLayout({ children }) {
  return (
    <html lang="vi" data-theme="dark" className="dark" suppressHydrationWarning>
      <head>
        <ThemeScript defaultTheme="dark" />
      </head>
      <body className="bg-app text-body">
        <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

## 2b. Brand per product

A product's brand comes from its **brand kit** (`BRANDS.md`), never from its own CSS: the kit's `dist/brand.css`
(imported after `@semi/ui/tokens.css`) sets only the primary fill (and an optional secondary), the text colour on each,
and the fonts (`fonts.sans`, optional `fonts.display`). Surfaces, text, lines, focus and status are the same for every
brand. With `"brand"` in `semi-lint.json` the app may not set any of them (`brand-override`). An app without a kit uses
Semi's own green. A brand change is made in the brand repo (`/semi-brand`) and reaches products with `/semi-sync`.

## 3. Colour meaning

- **Brand:** the brand colour rule (§0). `BTN_PRIMARY` is `bg-primary hover:bg-primary-hover text-on-primary`.
- **Selection** is neutral (§2).
- **Status** carries meaning only, never decoration or a brand mark: success (online, ready, done), warning (busy,
  paused, connecting), danger (error, destructive), info (neutral news, cost). `<Alert tone>`, `<Badge tone>`,
  `StatusDot`; callouts use `bg-*-bg border-*-border text-*-fg`.
- **Tones** (`SemanticTone`: purple, violet, indigo, blue, sky, cyan, teal, emerald, green, amber, yellow, orange,
  rose, red, pink, gray) mark a **category** on a tag, a tile or a dot, never a whole surface: `<Badge tone>`,
  `<Chip tone>`, `TILE_TONES` + `TONE_TEXT` (`Icon.tsx`), `TONAL_SURFACE[tone]` (= `TONAL_CONTAINER`, a 10% tint, a 20%
  line, `text-tone-<color>`) and `TONAL_HOVER[tone]`. Each app maps its areas to tones once (in its extension doc) and
  keeps the mapping. Never a solid pastel (`bg-purple-50`, `border-amber-200`: glaring slabs in dark) and never a fixed
  shade (`text-purple-700`): `no-solid-pastel-surfaces`, `no-fixed-tone-text`.
- **Rows:** a selected row is `bg-item-selected`, a checked one `bg-item-checked`; a row that needs attention keeps a
  neutral fill and shows its state on a badge. Its secondary text stays `text-muted`.
- **Chips and tags** (`Chip.tsx`) share one pill (`rounded-full h-control px-3.5 text-ui font-medium`), with **no border**
  (#190, C-014 / C-015): `chipClass(active)`; off = `bg-subtle-button` (the subtle button / icon button fill, hover
  `tint-hover`), on = `bg-raised` or the tone's tint (`<Chip tone>`) **and a leading check** (`CHIP_CHECK`; `Chip` adds it,
  a hand-built chip adds `<Icon name="check" className={CHIP_CHECK} />`), so the state never rests on colour alone. 34px
  with a mouse; on a touch phone `CHIP_BASE` grows to at least 44 × 44px (`pointer-coarse:max-sm:`, the `BTN_HIT` pair,
  real size: a wrapping or scrolling row of chips never shares a tap point). Static tags `TAG` and `<Badge>` have no
  border either: the tint alone. `<Badge tone="overlay">` (`BADGE_OVERLAY`: the canvas grey at 55%, 12px backdrop blur,
  strong text) is for text on an image or video **only**. Per-item colour only on a leading dot (`TONE_DOT`) or icon (`chipIconClass(tone)`). The chosen
  segment of `Toggle` and theme / style switchers is `SEGMENT_ON`.
- Data series in charts use the fixed `chart-1…8` hues; syntax colours in code views are the other exception.

### 3b. Callouts and category cards

```tsx
// A category card: neutral card, the tone on its icon tile.
<Card>
  <div className="flex items-center gap-2">
    <IconTile name="plug" tone="violet" size="sm" />
    <span className="text-lead font-medium text-strong">{title}</span>
  </div>
  <p className="text-ui text-muted mt-1">{description}</p>
</Card>

// 3b. A callout (Alert, tinted status surface): <Alert tone="warning">Giấy phép sắp hết hạn.</Alert>
// A status on a row: <TD><Badge tone="sky">Chờ duyệt</Badge></TD>, the row itself stays neutral.
```

## 4. Frame and shell

- **Radius scale (shape tokens):** tiny marks (checkbox, swatch, key cap, inline code) `rounded-chip` 4 · controls,
  inputs, buttons, inner tiles, list rows and nav items `rounded-control` 8 · cards, popovers, menus, toasts
  `rounded-card` 12 · frame panels, modals, drawers `rounded-panel` 16 · chips, pills, avatars, badges, dots
  `rounded-full`. Never `rounded-lg/xl/2xl` or `rounded-[Npx]` (`radius-token`).
- **Control height:** toolbar buttons, chips, pills, search inputs, selects and date pickers use `h-control` (34px);
  form inputs `h-field` (36px). Never `h-[34px]`.
- **Spacing by role** (from `tokens.json` "space", scaled by density: compact 90%, airy 115%):

  | Utility | Regular | Use |
  |---|---:|---|
  | `p-card` | 16px | inside a card, popover, list panel, side panel section (`<Card>` sets it) |
  | `sm:p-panel` | 24px | a roomy card or page panel from `sm` (`p-card sm:p-panel`) |
  | `gap-stack` | 12px | between items inside a card or a form |
  | `gap-group` | 16px | between cards in a grid or a list of cards |
  | `gap-section` | 24px | between sections of a page |

  `gap-1`–`gap-2`, `px-2`, `py-1` are for the inside of one control, never a row's or a box's padding. A card is never
  tighter than `p-card` (`card-padding`), a list row never shorter than a control (`Item` is `px-4 py-3`). Budgets: §4c.

### The frame (T2, #144)

- **Frame (1.0, #144):** a `bg-canvas` frame (`sm:p-2 sm:gap-2`, none on phones) holding the **nav panel** (`bg-panel`,
  `rounded-panel`, padding 16 / 20, 224px or the 72px rail, `railWidth`) and the **content column** (`bg-app`,
  `rounded-panel`). The column holds the **RouteHeader** (h60 from `lg`, padding 0 16px, the content's inset, phones included, #188; the column's
  full width; below `sm` the trail shows only the current page: crumbs left, an optional `middle` hidden below `md`, `actions` icon buttons 32×32 and the account avatar
  menu right; `middle` and `actions` sit in their own `Suspense`; three slots, see below) and under it the **content card** (`bg-panel`,
  `rounded-panel`, flush with the column, 4px above its bottom, no border; inside it `bg-app` is the panel colour, since the card sets
  `--semi-app` to `--semi-panel`, so sticky strips that paint `bg-app` match the card). `page="fixed"`: the card does not scroll, its panels do. `flush`: no centred
  `max-w-[1440px]` container or padding around the page (the page layout decides). `header={false}` drops the row.
- **Crumbs:** default group (a link: `section.href`, else its first item) › item › sub-item › the record a detail page
  names with `useRecordCrumb(label)`; or `header.crumbs`. Every crumb is `text-chrome` muted 400 with a chevron, the
  current one is not highlighted, the trail never wraps (long crumbs truncate). New crumbs enter with
  `animate-crumb-in`, the old ones fade out (`motion-crumb-out`); the shell itself never moves on a route change.
- **Three header slots (#192):** the RouteHeader always renders three slot containers (`data-route-slot` left / center /
  right), even when one is empty, so emptying one never moves another. Left: the trail (`left` replaces it); centre:
  empty by default (`middle`, or `header.banner`), hidden below `md`, at most 40% of the row and the first to give way;
  right: `actions` + account (`right` replaces both), always justified to the row's end. Beside a centre with content,
  left and right share the rest equally (the centre stays centred); with an empty centre the right group takes only its
  own width. The right group's right edge is the same with and without a centre. Never lay the row out as a grid whose
  cells come and go (a 3-column grid that loses its centre cell slides the right group into the middle).
- **Route header banner (`RouteHeaderBanner`, `header.banner`, #192):** one announcement at a time in the centre slot:
  a `Badge` tag ("Mới", `tag` / `tagTone`), one line of text that truncates with … before the trail or the right
  group shrink, an optional muted `sub` (a date), a `Button size="pill"` inverse CTA (`cta: { label, href | onClick }`),
  a close button (sm ghost, round, locale `bannerClose`), on a `bg-field` pill. The CTA and the close button keep their
  drawn size on a touch phone (`buttonClass(…, { hit: false })`, no `BTN_HIT`) and get an invisible 44px area
  (`HIT_AREA`) instead, 8px apart so the two areas never overlap; the row stays about 40px tall. Closed per
  `id` in a store (`localBannerStore`: `localStorage["semi_banner_<id>"]`, or your own async `get` / `set`, as
  `FeatureIntro`), read after mount only and again when `store` changes (keep it stable). It covers `header.middle`
  only while it shows: before the store answers and after it is closed, the app's `middle` is in the centre
  (`fallback`). Below `md` the same banner is one row at the top of the page content (above the
  title): full width, `rounded-card`, `bg-card-field` (the field fill inside the content card, where `bg-field` would equal the card), text up to 2 lines, CTA + close on the row (`placement="inline"`,
  `md:hidden`); AppShell renders both copies from `header.banner` and closing either hides both. The row appears after
  mount, so on phones the page content moves down once when it appears and stays there until it is closed. Each copy is
  `role="status"`, but it is already in place when it appears, so do not count on screen readers announcing it; closing
  moves focus to the next control after it.
- **Account avatar menu (`AccountMenu`, `header.account`):** a one-letter avatar (32px) whose `Menu` has a header
  (name, `detail` role or email: not an item), then Light / Dark / System (radio items), the app's `items` and
  "Đăng xuất" (`onSignOut`). The nav has no account or company block.
- **Nav order:** logo + collapse button (the logo expands the rail at `lg+`) · the **main action** (`mainAction`: an
  ordinary primary button with the app's label and icon, a `Menu` when it has `items`, its icon with a Tooltip in the
  rail; or your own slot) · the groups (`sections`, `pinned`) separated by a 24px spacer with a 1px `bg-raised` line,
  labels `text-nav-label` (10 / 500, uppercase, normal tracking, `text-faint`) in an h32 row with optional 16px icon actions (`section.right`) · the
  **bottom row** pinned to the bottom (`tools`: 32×32 ghost icon buttons 4px apart with a Tooltip and an optional
  `count` badge, brand-filled, "99+"; `toolsMenu` in a ••• Menu), stacked in the rail. Items are h32, 4px apart,
  `rounded-control`, `text-chrome` 500, icon 16; inactive `text-muted`, hover `bg-item-hover`, active
  `bg-item-selected text-strong`, the fill cross-fading with `transition-nav`. Brand colour in the shell: only the main
  action and count badges.
- **Responsive priority:** (1) the rail first: always between `md` and `lg`; between `lg` and `railBelow` (1280 by
  default) it is the default, expanded from it; the user's toggle is one stored value (`storageKey`, "rail" / "full")
  for every width; a 0.x value ("1" / "0", or the old `semi_sidebar_collapsed` key) is upgraded once on load. The width is CSS (media queries plus the stored choice, set on `<html>` before paint), and what the
  rail hides is a container query on the panel, so the server HTML is exact and nothing remounts when the width
  crosses a breakpoint or the nav collapses. (2) Below `md` a page's sub-nav stacks above its content (T7). (3) Phones
  get the drawer and no frame padding. In the rail every item keeps its name (the label is `sr-only`) and shows it in
  a `Tooltip` on the right with its shortcut. An item without `icon` shows its initials (`shortLabel`).
- **Slots are components:** `mainAction`, `header.left`, `header.middle`, `header.actions`, `header.account` and `header.right` take an element or a
  function of `{ collapsed, rail }` that is rendered as the body of one stable component, so it may call hooks; each
  keeps one instance (and its state) across a collapse, a resize over any breakpoint and a route change. `rail` and
  `collapsed` are exact after mount only: style what the rail hides with CSS.
- **Nav shortcuts:** the first nine items (visual order) are numbered; ⌥ / Alt + digit (matched on `event.code`) clicks
  the item, so the router and an unsaved-changes guard run as for a mouse; ⌘ / Ctrl + digit only in an installed app
  (`display-mode: standalone`). Holding the modifier shows the numbers (row end, or a corner badge in the rail);
  release, blur and any other key hide them. Ignored while composing (IME), in fields, `[role=combobox]` and
  contenteditable, and when the app already took the key; `shortcuts={false}` turns them off. The keys are in the
  expanded nav's titles, the rail tooltips, `useAppShell().shortcuts` and `navShortcutKeys(n)` (for a CommandPalette
  item's `shortcut`).
- **Mega menu:** a nav item with `mega` opens a `MegaMenu` flyout beside the sidebar: 2–4 category columns headed by
  `text-overline`, links with a grey icon, a hint and a "Mới" badge, and a "Xem tất cả" link.
- **Phones (`< md`):** the route header's menu button opens a full-screen drawer with the same groups:
  one brand-filled main action row (its items open as a level), rows `min-h-12` with › for sub-items and mega menus (a
  drill-down level with a back row; a parent with its own page is the level's first row, "Tất cả …"), the pinned
  group, and the tools (with their counts and the ••• menu as a level) at the bottom. The drawer is the default when the app sets neither `mobileNav` nor
  `mobileTabIds`; `mobileNav="tabs"` keeps the bottom tab bar (`MobileTabBar`) with the items named in `mobileTabIds`
  (the first ones without it). `mobileTabIds` alone still keeps the tab bar (C-034) but warns in development.

Also:

- **Shell lifecycle:** `AppShell` renders once in the root or a route-group `layout.tsx`, so it stays mounted while
  people navigate; a page renders only its content (`app-shell-in-page`). Items carry `href` and stay `next/link` links
  (`onSelect` only reports the click; never `onSelect` + `router.push`: `shell-nav-href`). The session check runs once,
  in the layout (best on the server); loading is §13b.
- **Sub-menus:** a nav item may carry one level of sub-items (`children`: mailbox folders, saved views), closed by
  default and open only while the parent or a sub-item is active; no colour dot, no count. The rail, widths below `lg`
  and phones never show them: pages read `useAppShell().submenuVisible` and offer the same choice in their own toolbar
  when it is false.
- Every flex / grid child that holds text gets `min-w-0` + `truncate`, so long names never push the page wider.

## 4a. Page layouts and rhythm (#149)

Inside the content card, pick one of four layouts with `<Page layout="work" | "reading" | "two-column">` (and `<ListReaderLayout>` inside `Page fixed` / `AppShell page="fixed"`; the "when to use which" table is in §0):

- **Work** (`layout="work"`, default: lists, tables, workspaces): flush, no centred max-width; card padding 16 / 24 (`px-4 sm:px-6`).
- **Reading** (`layout="reading"`: settings, explore, articles): one column centred at max 1536px (`max-w-screen-2xl`) inside 16px card padding, 64px bottom padding; pass `titleVariant="reading"` (or `<PageTitle variant="reading">`) to opt into the 44 / 500 display title (`font-display text-title-xl font-medium`).
- **Two-column** (`layout="two-column"` + `subNav={<SubNav … />}`: an area with sub-pages or mailbox folders): a sub-nav card 240px (`md:w-60`), flush left, padding 20 / 10; a 4px gap; the main card to the right edge, padding 24; no wide side padding. Below `md` the sub-nav stacks above the content. When the main card holds a `ListReaderLayout`, the list and the reader get the room first (owner priority: the rail first, then the SubNav): while the page is narrower than SubNav + gap + the main card's padding + the layout's side-by-side width (956 / 1020 / 1068px for `listWidth` sm / md / lg), the SubNav card hides and a select-like trigger at the top of the main card (`data-page-subnav-trigger`: active item icon + label, `aria-haspopup="dialog"`) opens the same `SubNav` in a left `Drawer`, closed by choosing an item (#196). It is CSS (a container query on the page, `:has([data-list-width])`), so the server HTML is exact; only a `subNav` that is a `<SubNav>` element collapses. `SubNav` sections have a group label (`text-nav-label`, 10 / 500 uppercase faint, row h32, optional 16px icon actions on the right), then items (h32, `rounded-control`, padding 4 / 16, `text-chrome` 500, 16px icon, 2px apart; inactive muted, hover `bg-item-hover`, active `bg-item-selected text-strong`); sections split by a 1px `bg-raised` line.
- **List + reader** (`ListReaderLayout` + `ReaderHeader`, mail, tickets, chat): a list card and a reader card, each its own scroller (`overflow-y-auto overscroll-contain`), filling the remaining column height on `Page fixed` / `AppShell page="fixed"` with zero hand-tuned `calc()`. Open item lives in `?open=` (`useDetailParam`, Back closes) and feeds `RouteHeader` breadcrumbs via `useRecordCrumb` (`recordTitle`). Side by side only while the reader keeps 360px: a container query on the layout's own width (list width + 16px + 360px: 664 / 728 / 776px for `listWidth` sm / md / lg), not the viewport, so a rail, a `SubNav` or a side panel count; below it the reader replaces the list with a Back button (#188: at 1024px with the rail and a `SubNav` the reader would have been ~270px); the Back button follows the same split (also an app's own `onBack`), and focus moves to the reader's title on open and back to the open row on Back, never to `<body>`. `className` sizes the outer container (`data-list-reader`), `gridClassName` styles the panes' grid. The container query classes live in `@semi/ui/src`, so they need the README's `@source` line for `src` (every set-up has it). `ReaderHeader` is the general pattern for every list + reader: one sticky row, wrapping title on the left (at least 70% of the row, clamped to 3 lines, a string title in full as the native tooltip; a cut title also gets a chevron toggle with `aria-expanded` that shows it whole, since touch screens never show the tooltip, #196), `[•••]` menu then one main action on the right, top-aligned, identical button height; every other action goes into `•••`. In a narrow pane, where the actions do not fit beside a 70% title, they wrap to their own row under it, on the right (flex-wrap, so it follows the pane, not the viewport).

**Vertical rhythm** (owned by `Page`, `PageSection` and `PageGrid`, so pages set no margins on these joins): 32px from the card top to the header block · 28px from the title or tabs to the intro (or toolbar) · 16px from the filter row to the list · 32px between blocks · 16px from a section heading (`PageSection`) to its content · 8px inside grids (`PageGrid`) and cards.

**Page title.** A work page's title (`PageTitle`, default `variant="work"`) is 18 / 400 UI sans (`text-figure font-normal text-strong`) on the same row as the page's main action (`actions`: an `inverse` or `primary` button); a one-column reading page can opt into `variant="reading"` (`text-title-xl`, 44 / 500 display face); a page with 2–4 sub-pages uses big `TextTabs` as its heading. One `h1` per page. `Page` provides the shared anatomy slots (`title`, `actions`, `tabs`, `intro`, `toolbar`, `children`, `footer`) so pages fill slots instead of hand-building headers.

Grids expand across wide screens (`sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-group`); touch screens stop at 4
columns (`not-any-pointer-coarse:` for 5+). Card grids beside a sidebar size columns by `@container`
(`@xl:grid-cols-…`), never by viewport breakpoints (`viewport-grid-cols`). No narrow `max-w-4xl/5xl/6xl` page
containers (`narrow-container`). A filter sidebar beside long results scrolls on its own (two `overflow-y-auto
overscroll-contain` columns). Long lists load the next page near the end ("Xem thêm" as fallback).

## 4b. Stand-alone app header

Every stand-alone app page uses the same top bar, `<AppHeader>`: logo + app title on the left, the app's actions on
the right. Props: `title`, `productName` (home bar), `logo` / `logoIcon`, `homeHref`, `onHome`, `hideTitleOnPhone`.

- Title = the app's name only (the product's name is never put in front of a module's name).
- On the right: icon buttons (`HEADER_ICON_BTN` + `HEADER_ICON_OFF|ON`), "Huỷ" when opened from another app, and ONE
  green main action (`headerPrimary(enabled)`), disabled until it can run; never a second green button elsewhere on the
  screen (a panel's own action is `BTN_SUBTLE`).
- **There is no Home button.** Clicking the logo + title returns home in the same tab; pass `onHome` when leaving needs
  a confirmation. The bar is full width, `h-13`, `bg-app/95 backdrop-blur-xl border-b border-divider`, sticky.
- Tool apps (an editor around a canvas / 3D view): left `SidePanel` (320 px, collapses to a rail with the sidebar
  icon), sections `p-3 sm:p-3.5 border-b border-divider`, labels `text-ui font-medium text-muted`, rarely used
  options under a collapsed "Tuỳ chọn khác". Floating canvas controls come from `@semi/ui/styles` (`VIEWPORT_TOOLBAR`
  top centre, `VIEWPORT_PILL` undo/redo bottom centre, `VIEWPORT_ROUND_BTN` bottom left, `VIEWPORT_BADGE` bottom
  right). Phones: canvas on top, settings in a bottom sheet titled with the app name. No file open: a start screen
  whose heading is the app's name and whose big tile is the app's icon in its tone.

## 4c. Density & hierarchy budgets

A screen gets cluttered one reasonable step at a time: a tile in a card in a panel, a fifth text size, a third
colour, a second filled button, rows 2px apart. Each budget below has a number, so it can be measured, and every
length is in density units (`--spacing`, 4px at regular), so a compact dashboard and an airy store are each held
to their own scale. Measured on the rendered page by the density audit (`lint/density.mjs`: `test:ui` on every docs
and brand book page, `/semi-check` and `/semi-ui` on an app); semi-lint reads code a line at a time and cannot add up
padding that comes from three files.

| Budget | Rule id | Do instead |
|---|---|---|
| Text in a box (card, panel, callout, tile ≥ 48px tall) sits ≥ 3 units (12px) from its sides and ≥ 2 units (8px) from top and bottom | `tight-box` | `p-card` (`<Card>` pads itself); a callout `px-3 py-2`, or `Alert` |
| A row of a list or menu (three or more stacked alike, clickable or split by lines) is at least a control tall (`h-control`) when clickable, and keeps ≥ 1.5 units (6px) above and below its text | `tight-row` | `Item` / `ItemGroup`, `Menu`, `DataTable` |
| At most three frames inside each other (page panel › card › tile) | `box-nesting` | white space, a divider or plain text instead of the fourth frame |
| At most four text sizes in one box (title, body, label, caption) | `type-mix` | weight and colour (`font-medium`, `text-muted`) for the rest |
| At most three colours in one box (brand and status; greys do not count) | `colour-noise` | neutral icons, a tone only where it means a state (§3) |
| One filled brand button per view (page, dialog, form) | `primary-actions` | `Button` (`subtle`, `inverse` for a card's main action) or `ghost` for the rest |
| Boxes side by side keep ≥ 2 units (8px) apart, or share an edge on purpose | `cramped-boxes` | `gap-group` between cards, `gap-stack` between tiles |
| One line between two things | `double-line` | no `border-b` on the last row of a card (`TBody`, `ItemGroup` do it), no border next to a `divide-y` |

Not counted: controls and chips (their size is the style's), trees (`FileTree` rows are dense on purpose), field
frames (a composer: a field and its buttons), charts, code and drawings, text a scroller or a clamp hides. Two
attributes cover the rest, and review lists both:
- `data-density-view` on a frame that stands for a whole screen (a docs example, a sample app in a brand book): it is
  not a box, its boxes count from zero, and it is its own view for the one filled button.
- `data-density-skip="<reason>"` on a specimen that breaks a budget on purpose (the type scale, all badge tones).
  Never on app screens to silence a hit.

What no number catches stays a review by eye (§19): one main block per screen, rhythm, alignment.

## 4d. List pages

A list page that people search and filter has, from the top: the **title row** (the title and the page's one main
action: `inverse`, or the brand `primary` when it is the page's commit action; a ⋯ `Menu` for the rest), then the
**`StickyContextBar`**, then the list.

- **The bar** holds one `SearchPill` (it feeds the list or `DataTable`; 250ms debounce, Escape clears, `focusKey="/"`),
  then the filters. On `md+` the filters are a `FilterChipRow`: one line of chips, each a multi-select `Popover`, a
  single-choice radio `Menu` (`kind: "single"`, "Hộp thư: Tất cả"; `clearValue` is the default, never in the URL and
  never an active filter) or a switch chip; the row scrolls sideways with ‹ › and never wraps (`filter-chip-wrap`);
  "Xoá lọc" shows while one is on; the page's views lead it in `leading`, a `ViewSwitch` ends it in `trailing`. Below
  `md` a `PhoneFilterBar` (views · "Bộ lọc · N" · settings) opens a `FilterPanel` (full screen, sort first, one
  accordion per filter, "Xem N kết quả" at the bottom). State lives in the URL: `useFilterParams(specs)` (or
  `readFilters` / `writeFilters` / `clearFilters` / `activeFilterCount`); a filter change is a history entry, so Back
  undoes it.
- **1.0 list calm & selection (#149, #173):** no result-count row: the list sits
  16px under the filter row. Sort (`sort`) and "Chọn" (`selection`, managed with `useListSelection`) sit on the filter
  row (`FilterChipRow` trailing; phones: `PhoneFilterBar` keeps Bộ lọc + sort / Chọn on the same row). **Selection
  mode:** `"n đã chọn"` (600) and the bulk actions (at most one filled button, the rest in `•••`) plus `"Xong"` replace
  the right side of the filter row at the exact same height — nothing pushes the list down (replacing the `DataTable`
  bulk bar on list pages). Checked rows/cards use `bg-item-checked`, the open record's row (`DataTable activeRowId`,
  `Card selected`, `Item selected`) uses `bg-item-selected`. `Card selectable` and `Item selectable` share the same
  non-nested, keyboard-accessible selection model.
- **Opening a record:** a record opens in a `DetailOverlay` over the list, not on its own page. Its id lives in the URL
  (`useDetailParam()` → `?open=<id>`; Back closes it, ‹ › replace it); the list stays mounted, so close / Esc / Back land
  at the same scroll. The header has close, the title, "n / N" and ‹ › through the **current** results (one 56px row; in a dialog narrower than the title's 60% plus the controls, copy link, "n / N" and ‹ › wrap to a row under the title, which then may take 3 lines, #188) (over a
  `DataTable`: `sortRows(searchRows(rows, columns, search), columns, sort)`, never a copied comparator); the side panel
  holds the actions (one `SplitButton` or main button, icon buttons, a ⋯ `Menu`) then the facts. A palette item or a
  notification opens a record of the current route with `openDetail(id)`. Cards and media tiles in a grid get
  `CardActions`.
- **A `SubpageToolbar` page** (a page with filters but no search bar) gets the same on phones with `filters` (typed: up
  to two as chips, more collapse into "Bộ lọc"), or `collapseFilters` for its `left`, and `secondaryActions`.
- The app-wide "Tìm hoặc tạo" box is one `CommandPalette` in the root layout (⌘K / Ctrl+K, `openCommandPalette()`):
  places from the layout, each page's actions and records from `useRegisterCommands`; groups under `text-overline`
  headings; ⌘↵ opens an item with `href` in a new tab.

## 4e. StickyContextBar behaviour

- **Pinning.** `StickyContextBar` (`pin={true}` by default) pins when the scroller scrolls past it, or when its search text field gets focus (not a filter chip, sort or view button). Focus scrolls smoothly to the pin in 250ms ease-out (instant under `prefers-reduced-motion`, cancelled by wheel or touch), with zero layout shift, even on a short list; already pinned does not scroll.
- **Unpinning (#207).** Once pinned, one upward gesture never unpins, however long, slow or fast, with or without layout-pin: the page stops at the pin (the bar stays stuck) and the list scrolls to its top. The user **stops** there (no wheel event for 400ms), and only a **new** upward wheel gesture that starts at the pin with the list at its top unpins the bar. A gesture is wheel events less than 400ms apart, so momentum tails, flings and a slow trackpad scroll with pauses up to ~350ms stay one gesture.
- **No `scrollTop` write during native scrolling (#193).** Chrome sends only the first wheel event of a natively scrolled sequence as cancelable and has already painted each later position on the compositor, so writing `scrollTop` back from a non-cancelable wheel event or a `scroll` event shows two positions on alternate frames (the bar and list flicker). Every hold is decided on the gesture's first event instead: preventing it keeps the rest of the sequence cancelable (`preventDefault` then holds without moving anything). `scrollTop` is written only for wheel events the bar itself prevented (pinning on the way down, forwarding a new upward gesture out of an `overscroll-behavior: contain` list, a driven gesture below) and by focus-pin. Layout-pin is read from its real state (the `md` media query and an `AppShell` `[data-shell-container]` child of the scroller), never guessed from the scroll range. Without layout-pin (below `md`, or a scroller outside `AppShell`'s page structure) the scroller itself runs past the pin, so while the bar holds, **every** wheel sequence over the page is driven by the bar from its first, cancelable event (#207), up or down (a downward sequence left native could carry a reversal past the pin): the event is prevented, the bar moves `scrollTop` towards the target on the next frames (steps up to 40px land at once, larger notched-wheel steps ease over a few frames) and clamps it at the pin. Native scrolling never runs for those sequences, so there is nothing to fight. Not driven: a wheel over an inner box that can still scroll that way, a downward wheel at the end of the scroller (it chains to the page around it), and the new upward gesture that unpins. The pin and `data-stuck` are measured from the scroller's padding edge, where `position: sticky` sticks. Regression checks: `tests/sticky-flicker.spec.ts` (per-frame invariants at DPR 1 / 2 and 90% / 110% zoom; #207: a long wheel, a slow trackpad with 250-350ms pauses and a fling, on layout-pin, below `md` and on the padded doc example, through Chrome's own gesture pipeline) and `tests/sticky-bar.spec.ts`. Test note: starting an `Input.synthesizeScrollGesture` takes Chrome about 100ms and a Playwright `mouse.wheel` about 35ms, so the #207 tests measure the real pauses between wheel events and assert they stay under 400ms.
- **State is kept.** Filter, sort, search, selection-mode and data changes leave the current state alone: pinned stays pinned (fewer results cannot unpin it), unpinned stays unpinned.
- **Pin by layout (`md+`).** From `md` (768px), `StickyContextBar` sets `data-sticky-host`, `--sticky-pin` and `--sticky-view` on its scroller (`main#main` or nearest scrollable ancestor) and `data-stuck` / `data-searching` on itself (all cleared on unmount). CSS sizes the page container to `var(--sticky-view) + var(--sticky-pin)` so the page's exact scroll range equals the pin height (including in selection mode) and the list area (`[data-page-body]`, or each `ListReaderLayout` panel) scrolls independently with `overscroll-behavior: contain`. Never clamp wheel events on a scrolling document or write `scrollTop` per wheel event while scrolling the list. Below `md` (phones), the page keeps native scrolling and touch behaviour (the wheel stop is proven for trackpad / wheel; touch scrolling is unverified).
- **Actions when pinned (`BarActions`).** Pass `<BarActions actions={…} menu={…} />` in `SearchPill`'s `trailing` slot: while pinned and not searching (`[data-stuck]:not([data-searching])`), the title row's actions appear inside the search field on the right — at most 2 icon-button slots with tooltips in title-row order (`[•••][main action]`, 8px apart, last button inset matching the `"/"` hint; > 2 actions keep the main one and collapse the rest into `•••`; main uses `inverse` by default, or `primary` only if the title row itself uses the brand button). Hidden while unpinned or while the search field has focus (150ms fade, opacity-only under reduced motion, out of flow and out of the accessibility tree so `"/"` never shifts).
- **URL state (`useFilterParams`, `filterParams`, `urlState`).** `useFilterParams(specs, { prefix, legacy, sort })` supports `legacy` (rewritten once after hydration via `replaceState`, zero extra history entries), `patch(values, mode)` (change several filters in one history entry), and URL-backed `?sort=key.dir` (`sort`, `setSort`, `sortDef` shared by `FilterChipRow`, `PhoneFilterBar`, `FilterPanel` and `DataTable`, plus pure helpers `readSort`, `writeSort`, `parseSort`, `formatSort`, `SORT_PARAM`). Outside the hook, use `replaceFilters` and `writeSearch`. `DataTable` reports its searched + sorted rows via `onResultsChange` (alongside pure `sortRows` / `searchRows`) so a `DetailOverlay`'s ‹ › walks the table's exact order. In `FilterPanel`, `single` radio groups have an accessible name directly on `role="radiogroup"` and write with `"replace"` so arrowing adds no history entries; a `single` `FilterChip` with no options is disabled.

## 4f. Workspace pages

A tool where people set inputs and see what they produce (a quote request and its comparison, a generator, an import
with a preview) is a `WorkspaceLayout`: a `bg-panel-3 rounded-panel` control panel on the left (`lg:w-[380px]`, sticky,
scrolls inside) and the result on the right. Top of the panel: the tool's parts as a full-width `ToggleGroup`, then
`WorkspaceHeader` (round back link named by where it goes, the tool name as the page `h1`, one muted line). Then
`WorkspaceSection`s (a `text-overline` label, a counter "3/8", a small text action); inside, cards of lines with a
`Stepper`, a `DropZone`, a `HintTextarea`. The **main action** is pinned to the panel's bottom (one primary
`fullWidth`, a secondary beside it at most). Below `lg` the panel stacks above the result and its action stays at the
bottom of the screen while the panel is in view (above MobileTabBar: AppShell sets `--semi-bottom-bar` in tabs mode;
never put the layout in an `overflow-*` box). Headings in the result start at `h2`.

## 4g. Motion (#151)

Semi wires T1's motion tokens (`TOKENS.md` "Motion": `--motion-hover`, `--motion-nav`, `--motion-crumb-in` / `-out`,
`--motion-enter`, `--motion-stagger`, `--motion-pulse`, `--motion-tooltip`, `--motion-disclosure` /
`--motion-disclosure-close`, `--motion-slide`, and the utilities `transition-hover`, `transition-nav`,
`transition-slide`, `animate-enter`, `animate-crumb-in`, `animate-tooltip-in`, `animate-pulse`) across components:

- **Hover & nav:** colours on hover and active change in 150ms (`transition-hover`) on links, buttons, tabs, menus and
  rows; the nav's active background in 150ms (`transition-nav`).
- **Page enter (`PageEnter` / `<Page enter>`):** top blocks and the first ~10 rows / cards (`tbody > tr`,
  `[role="listitem"]`, `[data-page-grid] > *`, `[data-motion-item]`, `Item`) rise in with `motion-enter` (400ms,
  opacity + 4px) and `motion-stagger` (35ms per item), **once per route** (keyed by pathname — never on filter, search,
  sort or `?tab=` changes, and never for rows arriving after the initial enter window). `PageEnter` uses
  `display: contents`, so it adds no layout box and never breaks fixed-height chains or inner scrollers.
- **Skeleton pulse:** `Skeleton` and `PageSkeleton` pulse quietly with `motion-pulse` (2.5s ease-in-out, opacity
  1 → 0.6 → 1), replacing Tailwind's default pulse; content replaces skeletons in place with no jump.
- **Media card hover:** `MediaCard` scales its media to 1.05 in 300ms ease-out (`--motion-slide`) on devices that hover.
- **Tooltip & disclosure:** `Tooltip` enters with `animate-tooltip-in` (200ms, opacity + scale 0.96 → 1); `Accordion`
  and `Collapsible` open in 300ms ease-out (`--motion-disclosure`) and close in 300ms ease-in
  (`--motion-disclosure-close`); `PillTabs` / `SegmentedControl` slide in 300ms (`transition-slide`).
- **Reduced motion (`prefers-reduced-motion: reduce`):** opacity only (no translate, no scale, no slide); skeleton
  pulse stops.
- **Shell stillness:** the shell (nav, frame, route header bar, content card) never animates, remounts or moves on a
  route change.

Apps should use these tokens in their own CSS (`transition: background-color var(--motion-hover)`); never hard-code a
duration or easing that a token covers.

## 4h. Tabs, segmented controls & URL `?tab=` (#147, #121)

Choose the tab or filter control mechanically from §0 "When to use which":

- **`PillTabs`** (5+ sections of one page, or sections with icons, e.g. Cấu hình): no track; h30 fully round pills
  (`rounded-full`), 16px icon + 4px + label in `text-chrome font-semibold` (12px/600), inactive `text-muted`, active
  `text-strong`; one `bg-item-hover` pill slides behind the active tab in 300ms ease-out (`transition-slide`). WAI-ARIA
  `tablist` / `tab` / `tabpanel` with `id`, `aria-controls` and `aria-labelledby`, roving `tabIndex`, ←/→, Home / End.
- **`SegmentedControl`** (2–5 filter values shown in full, with optional tabular-nums counts): `bg-raised` track
  (`rounded-control`, padding 4, gap 4, h32), h24 items (`px-4 py-1.5`, 12px/600, inactive `text-muted`, active
  `text-strong`), one solid `bg-raised-2` pill (white in light theme) sliding in 300ms (`transition-slide`). WAI-ARIA
  `radiogroup` / `radio` with ←/→, ↑/↓, Home / End.
- **Big `TextTabs`** (strictly 2–4 top-level views of a discovery or reading page, as its heading): `font-display
  text-tab-xl font-normal` (24px below `sm`, 28px from `sm`, weight 400 in the brand display face — never force 600–800
  bold on top of `font-display`, lh 1.2, tracking −0.01em), every tab in `text-strong`, inactive `opacity-20` (hover
  raises opacity in 150ms, keyboard `:focus-visible` restores full contrast), active 2px `decoration-primary` underline
  at 6px offset under the word only; gaps 16 / 20 / 24 (`base` / `sm` / `md`); 28px (`pt-7` / `mb-7`) to the intro
  below.
- **Shared behaviour across all three (#121):**
  - **Overflow:** one horizontal row (`no-scrollbar`), active item scrolls horizontally into view without moving the
    page vertically, no horizontal page scroll at 430px, and a 2px `bg-outline-line` edge cue (`data-edges`) marks each
    side with more tabs.
  - **Manual activation:** `activation="manual"` moves focus with arrows and commits on Enter / Space (default
    `"automatic"` switches button tabs on arrow keys; `href` tabs always move focus on arrows and navigate on Enter / Space).
  - **Guard (`onBeforeChange`):** `(key) => boolean | Promise<boolean>`, honoured by both button tabs and `href` link
    tabs (an `href` tab does not navigate when the guard refuses). In automatic mode arrow keys move focus and selection
    only after `value` really changed.
  - **URL `?tab=` (`useTabParam`):** `const [tab, setTab] = useTabParam("mail", { values })` (built on `urlState.ts`,
    Next 16 App Router safe: `null` history state, `queueMicrotask` listeners, no `useSearchParams`). Arrow-key stepping
    always replaces (`history.replaceState`), so pressing ←/→ never pushes a history entry per key. Pages already using
    `useFilterParams` can call `setParams({ tab: next === defaultTab ? null : next }, "replace")`.
  - **Reduced motion:** sliding pills and edge-cue fades turn off under `prefers-reduced-motion` (opacity only, no slide).

## 5. Card

Cards separate from the page by tone (`bg-card`, Surfaces in §2), with no visible border.
`<Card>` (`@semi/ui`) wraps the same classes and pads itself (`padding`: `"card"` = `p-card` by default, `"panel"` =
`p-card sm:p-panel`, `"none"` for media that runs to the edge; a `p-*` in `className` replaces it): `<Card>`, `<Card interactive>` (CARD_HOVER, the border shows on hover), `<Card active>`
(CARD_ACTIVE), `<Card bordered>` (CARD_BORDERED: panel fill + 1px line, for a dense table or list that needs an edge). It owns its surface: pass padding / layout only, never `bg-*` or `shadow-*`. With `onClick` it is a
button for keyboards and screen readers too (`role="button"`, in the tab order, Enter / Space, `FOCUS_RING`; `active`
becomes `aria-pressed`): a selectable tile is `<Card onClick active>`, never a `<div onClick>` (`click-target`).

```tsx
import { CARD, CARD_BORDERED, CARD_HOVER, CARD_ACTIVE } from "@semi/ui/styles";

<div className={`${CARD} p-card flex flex-col gap-stack`}>…</div>          // static
<button className={`${CARD_HOVER} p-card text-left`}>…</button>         // opens something
<div className={`${CARD} ${CARD_ACTIVE} p-card`}>…</div>                // active / "on" / running: border-outline-line, no glow
<div className={`${CARD_BORDERED} overflow-hidden`}>…table…</div>        // dense data view that needs an edge
```

Card header row: `IconTile` (or the item's image) · name (`text-lead font-medium`: 500, headings are not bold) + caption · icon actions
(`ICON_BTN`, `ICON_BTN_DANGER`) on the right.

## 6. Hero card

`HERO` (`rounded-panel bg-card p-card sm:p-panel`): a plain card-surface block for the top of a page. No glow blob.

## 7. Icon tile

`<IconTile name="box" tone="green" size="sm|md|lg" />`: rounded square with a soft tint of the area's tone.
`sm` 28px (list rows) · `md` 36px (card headers) · `lg` 44px (dialogs, empty states). Nav items use a grey 16px icon in
an h32 row; the active item is `bg-item-selected text-strong` (§4). Dashboard quick feature tiles use `w-11 h-11
rounded-card` with their area's `TILE_TONES`.

## 8. Section heading

```tsx
<div className={SECTION_HEAD}>
  <h2 className={SECTION_TITLE}>Thiết bị</h2>
  <span className={COUNT_PILL}>3</span>
  <button className={SECTION_LINK}>Quản lý <Icon name="chevron" className="w-3.5 h-3.5" /></button>
</div>
```

### Discovery and gallery sections (#191, C-014)

`SectionHeader` is the header row of a discovery or gallery section: the title (`text-section`, 20 / 500), an optional
muted line, `actions` on the right (one `<Button variant="ghost">Xem tất cả <Icon name="chevron" /></Button>`) and an
optional `pager`: two subtle round icon-only `Button`s ‹ › (`size="sm"`, 44px on touch phones) that scroll a rail by one
view (`pager={{ target: railRef }}`) or call your handlers (`onPrev` / `onNext` + `prevDisabled` / `nextDisabled`), disabled
at the ends. It draws nothing of its own: no colours, no hand-made buttons. Under it, `MediaCard`s: 16:9 media at
`rounded-card` (12), caption `text-ui font-medium text-strong` (14 / 500), an optional meta line in `text-overline`, and two
optional slots over the media that take any node (`topLeft`: `Badge tone="overlay"`; `bottomRight`: an Avatar + name in an
overlay Badge, or `Button size="pill"`). The whole card is one link (`href`) or button (`onClick`) with the focus ring around
it; the slots sit beside that control. Hover scales the media to 1.05 in 300ms ease-out (`--motion-slide`), never under
reduced motion.

- **Grid:** `grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-4 gap-y-6`.
- **Rail:** `flex gap-4 overflow-x-auto snap-x snap-mandatory overscroll-x-contain`; cards `snap-start shrink-0
  basis-[75%] sm:basis-[calc((100%-2rem)/3)] lg:basis-[calc((100%-3rem)/4)]` (phones: 75% wide, the next card peeks).
  The header's `pager={{ target: railRef }}` pages it.
- A work page's section with its content stays `PageSection`.

## 9. Buttons

1.0 variants (#146), `Button variant` or the `BTN_*` constants from `@semi/ui/styles` (`rounded-control`, `h-control`,
`text-ui` 14px `font-medium`, flat, hover in 150ms `transition-hover`, a 2px `outline-focus` focus outline, disabled
neutral for every variant, at least 44 × 44px on a phone with a touch screen (`BTN_HIT`: `pointer-coarse` + `max-sm`, real size, no pseudo-element that could cover a neighbour)):

| Variant | Constant | Look | When |
|---|---|---|---|
| `subtle` (default) | `BTN_SUBTLE` | `bg-subtle-button`, strong text | ordinary actions |
| `surface` | `BTN_SURFACE` | `bg-raised` | toolbar actions (Mời, Tuỳ chỉnh) |
| `inverse` | `BTN_INVERSE` | `bg-inverted` + `text-on-inverted` | the main action of a card or a list title row (Thêm, Xem); `size="xs" shape="round"` is the pill |
| `outline` | `BTN_OUTLINE` | transparent, 1px `outline-line` | beside an inverse one (Chia sẻ) |
| `ghost` | `BTN_GHOST` | no fill, `item-hover` on hover | icon buttons, the nav bottom row, quiet row actions |
| `primary` / `secondary` | `BTN_PRIMARY` / `BTN_SECONDARY` | the brand fills with their on-colours | only the one main button of a page, a dialog (its commit: Gửi, Lưu) or the nav, or a case the app's owner asks for; `secondary` is the brand secondary (the primary when the brand has none) |
| `danger` | `BTN_DANGER` | solid red (`bg-danger-fill`, hover `danger-fill-hover`) with white text (`text-on-solid`) | destructive actions; the destructive confirm of a dialog (`confirmDelete`, `confirmDialog({ tone: "danger" })`) |
| `danger-subtle` | `BTN_DANGER_SUBTLE` | the danger status fill (tint, line, danger text): the pre-#189 `danger` | a destructive action that is not the main one (remove from a group beside other actions) |

Sizes: `md` (h-control 34px, 14px; the default), `lg` (`BTN_LG`, 40px, 14px / 500, the control radius: the one call to
action of a page header; lint `one-large-button` warns on a second one in the same header), `sm` (`BTN_SM`, 28px, 12px
`text-chrome`: dense rows, toolbars), `pill` (`BTN_PILL`, 24px, 12px / 500, fully rounded: a small pill CTA), `xs`
(`BTN_XS`, 24px, 12px), `modal` (`MODAL_BTN_*`: 44px / 15px on phones, h-control from sm: dialog footers, a full-width commit; commit
`primary`, cancel `subtle`, destructive `danger`). `badge` pins an attention `CountBadge` to an icon button's corner.
Every variant's text reaches 4.5:1 on its fill and on its hover fill in both themes (the token build checks it). Icon-only: add `BTN_ICON` (it carries `BTN_HIT`, so a hand-built `${BTN_SUBTLE} ${BTN_ICON}` is 44px on a touch phone too), or `ICON_BTN` (`w-7 h-7 rounded-control`) inside cards. Big
state toggles (power) are round: `w-20 h-20 sm:w-24 sm:h-24 rounded-full`, flat `bg-inverted text-on-inverted` when on (an "on" state is neutral, §0),
`bg-field` when off. A running action shows a spinner inside its own button only.

### Grouping actions (G1–G12, C-025 / C-026)

Related actions are one control, not a row of separate buttons (`Menu`, `SplitButton`, `ButtonGroup`, `CardActions`):

| Rule | What |
|---|---|
| G1 | One way to start one job. The other ways to create the same thing (type it in, import a file, copy from another system) go under the primary in a `SplitButton` (or a `Menu`), never as separate toolbar buttons. |
| G2 | Secondary page actions (export, settings, refresh, print, archive) go in the ⋯ `Menu`; at most one secondary button stays visible. |
| G3 | `ButtonGroup` is for toggles or steps of one control (view mode, ‹ Hôm nay ›, zoom), not for unrelated actions. |
| G4 | A table row has at most one inline action, the rest in a row ⋯ `Menu`; a card in a grid one or two `CardActions`, the rest in its ⋯. Bulk actions go in the bulk bar. |
| G5 | Destructive items sit last in a menu, after a divider, with `danger` (`Menu` puts them there for you). |
| G6 | An empty state repeats at most the toolbar's primary action, never a second way to create. |
| G7 | One filled primary per view (toolbar or card); a `SplitButton` counts as one. |
| G8 | Icon-only buttons have a `title` and an `aria-label`; three or more icon-only buttons in a row go into ⋯. |
| G9 | A bulk bar has one primary + ⋯, danger last. |
| G10 | Refresh comes only from `SubpageToolbar` `onRefresh`, never an extra button. |
| G11 | More than two filter controls collapse into "Bộ lọc" with the active ones as chips (D6, `FilterChipRow` / `PhoneFilterBar`). |
| G12 | A detail header (page or `DetailOverlay` side panel) has one primary (a `SplitButton` when it has variants) + ⋯. |

`Menu` items carry an icon, a `description` line, a `shortcut` (or a short hint such as a port), `checked`
(menuitemcheckbox; with `radio`, menuitemradio: one choice of a set, and the menu opens on the checked one), `loading`, `href` (a `next/link`), `disabled` (a string says why and keeps it reachable), `hidden`
(left out: a permission or device the user lacks; an empty group disappears) and `group` (a `text-overline` heading,
a divider between groups). A file picker item calls the hidden input's `click()` in `onSelect`. Below `sm` a `Menu`
opens as a bottom sheet (`sheet={false}` keeps the dropdown). Lint rules for G7–G11 come with #94 PR 6.

## 9b. Forms: actions, unsaved changes, validation

Forms behave the same everywhere and nobody loses typed work (owner decision C-021, F2 / D13 / P11). Additive: apps adopt
it form by form; the four lint rules below are warnings until 1.0.

- **`FormActions`** is the action row: `Huỷ` (ghost) then `Lưu` (edit) or `Tạo` (`create`, a new record) as the primary,
  right-aligned, with any destructive action (`destructive`, a `variant="danger"` button) alone on the left. On a page it
  is **sticky** at the bottom of the page (`FORM_ACTIONS_STICKY`: `sticky bottom-0 z-sticky bg-app`, a line above), lifted
  above the on-screen keyboard (it follows `visualViewport`) and padded by the safe-area inset; buttons are `h-11` below
  `sm`. In a `Modal` pass `placement="modal"` and put it in `footer`; the primary is then `type="button"` with `onSubmit`
  (the footer sits outside the form). Inside a `<form>` leave `onSubmit` off: the primary submits, so Enter works.
- **`useUnsavedGuard(dirty)`** warns when changes would be lost. The browser's own prompt covers reload, tab close and the
  address bar (`beforeunload`; its text cannot be changed). Inside the Next.js app router, which has no navigation event,
  a link click is caught in the capture phase, asked with `confirmDialog` (mount `<ConfirmHost />`: "Bạn có thay đổi chưa
  lưu…", `Rời đi` / `Ở lại`) and repeated on agreement, so `next/link`, `basePath` and prefetch are untouched; back /
  forward is asked through one history entry added while `dirty` (dropped before an agreed navigation; a "spent" marker after a save: go on with `confirmLeave(() => router.push(x))`, which pops it first). A navigation the app starts in code is wrapped:
  `confirmLeave(() => router.back())` (returned by the hook). Set `dirty` to false right after a successful save, before
  navigating on.
- **`Field kind`** (`email`, `tel`, `number`, `money`, `url`, `search`, `password`) sets `type`, `inputMode`,
  `autoComplete` and `enterKeyHint` on its `Input` (table in `FIELD_KINDS`; `NumberInput` takes only `autoComplete` and
  `enterKeyHint`, it keeps its own type and keypad); a prop on the control wins (`autoComplete="new-password"`, `type="text"`
  next to an `https://` addon). `number` and `money` stay text inputs with the decimal keypad, never `type="number"`; the text
  holds Vietnamese separators, so parse it in the app (strip grouping separators / locale-aware parser), not `Number()`.
- **Small counts and hinted text (#106, #148).** A small whole number people nudge (tấn per line, copies, seats) is a `Stepper`
  (− value +, a spinbutton: arrows, Page Up / Down, Home / End; the − + buttons are out of the Tab order); typed numbers stay
  `NumberInput`. A message or note that can mention a record or insert a template or plain-text snippet is a `HintTextarea`:
  a hint row under the text ("Gõ @ để nhắc nhà cung cấp · Gõ / để chèn mẫu") and a suggestion list positioned with the Popover
  engine (portaled at `z-popover`, flips above near the bottom, never clipped by a pane or modal; `HintToken.insert` overrides
  what is inserted, `showValue` controls the right-hand key column, long values truncate; keyCode 229 / composing keys are left
  to the input method). For a reply box, pass `autoGrow` / `resizable` on `Textarea` or `HintTextarea` (grows from 3 rows up to
  50% of its container, then scrolls; from `md` a top `role="separator"` resizes by drag or ArrowUp / ArrowDown ±24px up to
  80%, double-click resets to auto; phones auto-grow only).
- **Layout and validation.** Labels sit above fields, required fields get `*` (`Field required`), the error shows under the
  field (`Field error`). Group related fields with a `text-overline text-muted` section label (never on a single field's
  `<label>`). Use `MultiCombobox` for searchable multi-select with removable chips (supports `group`), `OptionCards` for
  selectable radio-group cards (neutral `item-selected`, 8px grid gap). Validation runs on blur, then on every change (`useFormValidation`: `form.errors`, `onBlur={form.blur("x")}`,
  `form.validate()` on submit). With more than one error `FormErrorSummary` puts an `Alert` above `FormActions`; one error is
  shown only under its field. A problem inside a field is never a toast. Page forms are at most `max-w-2xl` (`FORM_PAGE`).
- **Lint (warnings, they never fail):** `form-no-guard` (a page form without `useUnsavedGuard`), `action-order` (the primary
  before Huỷ), `toast-for-validation` (a toast about a missing or invalid field), `field-input-mode` (an email / phone / URL /
  password / money field without `kind`). `npx semi example form-actions`.

## 10. Pills, chips, badges

- Single choice (2–5 filter values shown in full, with counts): `SegmentedControl` (`bg-raised` track, sliding
  `bg-raised-2` pill, `radiogroup` / `radio`, §4h).
- Sub-page filter tabs / chips: `Chip` (see §3 Chips). Static labels: `TAG`.
- Filter chips may carry an icon and a count: icon `w-3.5 h-3.5` + label + `COUNT_PILL`.
- Status pill: `STATUS_PILL` + `bg-*-bg text-*-fg` (danger, success, warning, info) with a status dot (§11), or `<Badge tone>`.
- Tag / meta chip: `TAG` (`h-6 px-2 rounded-full bg-field text-chrome text-muted`, no border) with an icon.
- Text on an image or video (duration, "Video", a count on a thumbnail): `<Badge tone="overlay">`, only on media.

## 11. Status dot

Flat dot next to state text, no glow: online `bg-success-solid`, running `bg-inverted animate-pulse`,
busy/paused/connecting `bg-warning-solid`, error `bg-danger-solid`, offline `bg-muted`. Use `STATUS_DOT`.
Size `w-2 h-2` (`w-1.5 h-1.5` inline in a caption).

## 12. Tiles & readings

Nested facts (readings, KPIs, sensor values) sit in `TILE` (`rounded-control bg-card-field`, no border)
with an icon above or before a `tabular-nums` value. Progress is a ring or a `h-1.5 rounded-full` bar on `bg-raised`
(`Progress`): `bg-inverted` by default, a status `tone` when it means one; never the brand fill.

## 13. Empty state

`EMPTY`: dashed `rounded-card` card with an icon in a `w-12 h-12 rounded-card bg-field` square above one short
line. Make it the button that adds the first item when there is one.

`EmptyState` has two variants (D14): **`first-use`** (nothing exists yet): one icon, one sentence (the title, no
description), and the one primary action that fills the list. **`no-results`** (a search or filter matched nothing):
its own title ("Không có kết quả"), a hint, and `onClearFilters` for a secondary "Xoá lọc" button; keep the title and
toolbar on screen around it. When an empty list shows its own primary action, hide the primary button in the page's
title row while the list is empty, so the view has one filled button (`primary-actions` in `semi density` catches two).
Below `sm` the state is compact and takes at most 40% of the viewport (`EMPTY_PHONE_CAP`, P13).

**Guided** (`GuidedEmptyState`, the variant `guided`, L13, #106): the first use of a page whose value needs a few steps
(suppliers before quotes). One card: the title (one sentence, `h2`), a link to the full guide from `sm`, the steps as a
carousel ("Bước 1 / 4" in `text-overline`, a visual, ‹ ›; `layout="carousel"`, the default) or as a numbered list
(`layout="steps"`), and the one primary action. Below it, rows of ready starting points by category (`templates`: grey
`IconTile`s, colour only where they need telling apart), each with "Xem tất cả". Below `sm` the card follows the phone
cap (the visual hidden); the starting points become one row that scrolls sideways. Hide the page's own primary while it shows.

## 13c. Error, not found, no access

`States.tsx`: **`ErrorState`** (title, message, optional `detail` code, primary "Thử lại" via `onRetry`; `role="alert"`),
**`NotFound`** and **`Forbidden`** (one sentence and a link home, `homeHref`; Forbidden has no retry). Defaults are
Vietnamese and come from the locale table (`errorTitle`, `notFoundMessage`, `forbiddenTitle`, `retry`, `clearFilters`,
…). A failed refetch shows `ErrorState` in place of the failed part and keeps the loaded data on screen.
**Route-file recipe (F1, D17, D23):** each Next.js route group ships three files beside `layout.tsx`, and the root
`app/` gets a `not-found.tsx` for URLs that match no group:

```tsx
// loading.tsx  → <PageSkeleton shape="list" inShell />   (shape = the page's: cards, list or detail; inShell = no full-page height / padding)
// error.tsx    → "use client"; <ErrorState headingLevel={1} onRetry={reset} detail={error.digest} />
// not-found.tsx → <NotFound />
```

The shell stays mounted; only the content area changes. A route state is the page's `h1` (`headingLevel={1}`;
`NotFound` and `Forbidden` default to it). A group's `error.tsx` does **not** catch errors in its own `layout.tsx`: add
`app/error.tsx` for the root layout's children and `app/global-error.tsx` (it renders its own `<html>` and `<body>`)
for the root layout itself. A phone-capped state whose content still overflows becomes focusable and scrolls. Examples: `npx semi example states route-error` (and
`route-not-found`, `route-loading`). 401 (not signed in) redirects to login; 403 (signed in, not allowed) is `Forbidden`.

## 13b. Loading (shimmer skeleton)

While a page, tab, list or number loads, show its shape with shimmering placeholders, never a "Đang tải…" line or a
centred spinner. `Skeleton.tsx`: `Skeleton` (one block, size via className), `SkeletonCard`, `SkeletonGrid` (use the
real grid's classes), `SkeletonRows` (lists, dialogs, tables), `PageSkeleton` (Suspense fallbacks), `Loading` (adds
`role="status"` / `aria-busy`; its `label` is for screen readers only). Shaped skeletons (L16, #106): `SkeletonList`
(divided rows: avatar, title, meta, short values on the right), `SkeletonTable` (a header and rows, the first column
long, number columns short and right-aligned), `SkeletonDetail` (a record: title and status, actions, label / value
pairs, a text block, `side` facts column). `DataTable` draws the same table shape while `loading` (rows `aria-hidden`,
the table `aria-busy`). **No spinners in lists**: a list, grid or table that loads shows its rows' shape. The sweep is the `.shimmer` class in
`base.css` (stops under `prefers-reduced-motion`). Keep "not loaded yet" apart from "empty" (e.g. `undefined` =
loading, `null` = failed, or a `loaded` flag) so an empty state never flashes before data. Long operations the user
started (upload, export) show a progress bar with a short label and percentage; files the user picks or drops use `FileDrop` (one `Progress` row per file). When the user cannot do anything
useful until the job ends (upload before printing, import, firmware update, payment step), use the blocking overlay:
`const task = startTask({ label, step, value, timer, onCancel })`, `task.update({ value })`, `task.done()` /
`task.fail(title)` (closes and shows a danger toast), with `<TaskHost />` mounted once in the root layout beside
`<ToastHost />` / `<ConfirmHost />`. One task at a time; Cancel and Escape only when `onCancel` is set.
**Before the shell exists (boot):** while the app does not yet know its layout (session, auth, brand / theme boot)
there is no shape to show, so a page skeleton would draw a page that may never appear (a redirect to login flashes
it). Prefer a server-side check (a Next.js proxy redirect or an async server layout), which needs no gate. A client-only
app renders `<BootLoader />` once in the root or route-group layout: the one centred spinner (`bg-app`, `Spinner` in
`text-muted`, no visible text, after a 300 ms `delay`, still under reduced motion). Inside the shell, loading is
skeletons: a route `loading.tsx` beside the layout shows `PageSkeleton` in the content area only. Never gate
`AppShell` behind a skeleton (`shell-gate`), never `BootLoader` in a page, a `loading.tsx` or shell content
(`boot-loader-place`).
A list, grid or table never swaps its rows for a `Spinner` or loading text (`no-spinner-in-list`, warning): `DataTable` and
`List` take `loading`, other lists render a skeleton of their shape: `SkeletonList` (divided rows), `SkeletonTable` (a
hand-made table), `SkeletonDetail` (a record), `SkeletonRows` / `SkeletonGrid` (cards).
Another exception: a list a form field fetches by itself in the background shows one small `role="status"` line under that
field while it loads: a `w-3 h-3` spinner + "Đang tải …" in `text-ui text-muted` (the text sits in the
`role="status"` element, which the lint allows), gone when done; a failed fetch stays silent.

## 14. Modal & dialog

`MODAL_BACKDROP` (`bg-overlay backdrop-blur-lg`) + `MODAL_PANEL` (`bg-panel border-line`): full screen on phones
(`max-sm:h-dvh max-sm:rounded-none max-sm:border-0`, edge-to-edge), a centred `rounded-panel` dialog from `sm` up.
The panel caps itself at `92dvh` and scrolls; pass only a width (`max-w-md`…) and, for a fixed header / footer,
`flex flex-col` with a `flex-1 overflow-y-auto` body. `MODAL_HEAD` / `MODAL_TITLE` / `MODAL_FOOT`: header = `IconTile`
+ title + close `MODAL_CLOSE`; footer buttons right-aligned, stretched on a phone. Buttons are `MODAL_BTN_*`.
Every overlay (modals, full-screen viewers, popups, numpad) uses this backdrop. Big detail views split into two columns
from `md` (iPad). Confirmations go through `confirmDialog()` / `confirmDelete()` (mount `<ConfirmHost />` once in the root layout), never
`window.confirm`; what to use when is §14c. Phones can use a bottom sheet for pickers and filter panels.

**Feature intro** (`FeatureIntro`, L14, #106): the first visit of a new or reworked feature gets one small dialog: a
16:9 visual, a title, one line, dots, "Bỏ qua" and "Tiếp" / "Bắt đầu" (a bottom sheet on phones). It shows once per user
per `id`: "seen" lives in a store (`localIntroStore`, localStorage, by default; pass `store` to keep it on the account),
read after mount only. It never opens over another dialog (it waits until none is open), and one intro opens at a time; Escape and the backdrop skip.
At most three slides and one per page; a page that is empty on first use gets `GuidedEmptyState` instead.

**Links to other sites** always use `ExternalLink` (new tab, `rel="noopener noreferrer"`). Apps inside a native
WebView pass an `onClick` that opens the URL outside. Never a bare `<a target="_blank">` to another site.

**AI text** is rendered with `Markdown` (light markdown: paragraphs, headings as bold lines, lists, bold, code,
links), never raw. AI conversations use the chat parts below (§14b), never an app's own composer or bubbles.

## 14c. Feedback: one toast API, undo or confirm

One way to answer an action (owner decision C-021, D20 / F10, owner question 17). Additive: apps move over one call at a time;
the lint rule `local-toast` is a warning until 1.0.

| The action is… | Feedback | Never |
|---|---|---|
| Done, nothing to take back (saved, sent) | `toast.success("Đã lưu")`, once | a modal, a second toast for the same thing |
| **Reversible and destructive** (archive, remove from a list, move to trash) | do it at once, then `toast.undo("Đã lưu trữ "A"", restore)`: a "Hoàn tác" button for 8 s | asking first |
| **Irreversible** (delete for good, disconnect, send) | `confirmDelete({ name })` before: the title names the object, the button is red (`MODAL_BTN_DANGER`) and says "Xoá", Huỷ is the safe default; then `toast.success` | a bare "Bạn chắc chắn?" or a red button that says "Đồng ý" |
| Takes a moment (save, import) | `toast.promise(promise, { loading, success, error })` | a page spinner, a modal "Đang lưu" |
| Failed | `toast.error("Không lưu được", { description })` (assertive) | an `alert()`; use `Alert` when it must stay on the page |
| A problem inside a field | `Field error` (§9b) | a toast |

- **The API** (`Toast.tsx`): `toast({ title, description, tone, duration, action, undo, onCommit, pending })` and the shorthands
  `toast.success|error|warning|info(title, options | ms)`, `toast.undo(title, onUndo, options)`, `toast.promise(promise, { loading,
  success, error })` (messages may be functions of the value or the error; it returns the promise), `updateToast(id, patch)`,
  `dismissToast(id)`. `<ToastHost />` is mounted once in the root layout.
- **Defaults:** 4 s, danger 6 s, a toast with an action or undo 8 s; hover and keyboard focus pause the timer; `pending` has no timer
  until it settles. A plain toast with the same text, tone and description already on screen is **replaced, not stacked**, so success
  appears once; a toast with `undo`, `action` or `onCommit` is never merged (each carries its own callback). At most four show.
- **Time (WCAG 2.2.1):** `<ToastHost durationScale={2} />` multiplies every auto-dismiss time (`0` keeps toasts until dismissed).
  **Alt+T** moves keyboard focus to the newest toast's action (to Hoàn tác, or its close button); focus inside a toast pauses its timer.
  The shortcut is the `hotkey` prop (`"Ctrl+Alt+T"`, `false` turns it off); it is ignored in inputs, textareas, contenteditable and during
  IME composition. Firefox on Windows / Linux may open its Alt menu bar on Alt+letter: set another `hotkey` or `false` there.
- **Undo means undone:** `onUndo` reverses what already happened; if it cannot (a sent email), the action is irreversible: confirm first.
  `onUndo` must restore on the **server**, not only in local state: it can run after the component that showed the toast is gone.
  `onCommit` runs once when the undo window closes without an undo (timeout, closed, pushed out by newer toasts, the route changed, or
  `pagehide`: tab close and reload). It is **best effort and fire-and-forget**: a closing page cannot wait for it, so use
  `fetch(url, { keepalive: true })` or `navigator.sendBeacon`. The robust pattern is to **commit first** (a soft delete on the server when
  the user acts) and let `undo` restore on the server, so a missed `onCommit` only leaves a soft-deleted row.
  A **route change closes undo toasts** that were already showing (and commits them), so an undo never fires on a page that is gone; a toast
  shown within 2 s before the change (`TOAST_NAV_GRACE`) is the action's own navigation (delete on a detail page, then `router.push(list)`) and stays.
- **`toast.promise(p, { loading, success, error, timeout })`:** `timeout` (default 30000 ms, `0` = none) ends a wait that never settles:
  the toast turns into the neutral "Vẫn đang xử lý…" (locale `stillWorking`; not an error, the work may still succeed) and closes on its normal
  timer. A rejection always shows `error`; a result that arrives later updates the toast while it is still showing. Pass `timeout: 0` to wait for ever.
  `updateToast(id, patch)` keeps the id, so a second update and `dismissToast(id)` still work.
- **`confirmDelete({ name, message?, confirmLabel? })`** is `confirmDialog` with `tone: "danger"`; `ConfirmHost` takes `deleteTitle(name)`,
  `deleteMessage` and `delete` ("Xoá") from the **provider's locale** (English under `SemiLocaleProvider locale={en}`); a prop wins.
  Say what else goes in `message` ("12 bản in cũng bị xoá"). In a danger dialog focus starts on **Huỷ**, not on the red button.
- **Lint (warning, never fails):** `local-toast` flags `sonner` / `react-hot-toast` / `react-toastify`, an import of an app-level
  `toast` / `toastStore` / `useToast` module, and an exported `toast` / `notify` / `showToast` wrapper around Semi's toast: the extras apps
  added (an action, a longer duration, promise, undo) are in Semi's toast now. `npx semi example toast`, `npx semi example confirm-dialog`.

## 14b. AI chat

Every AI conversation (assistant panel, error diagnosis, "explain this setting") is built from `Chat.tsx`. It is
**UI only**: the app keeps the messages, streams the answer and talks to the model (provider, model picker, settings
are the app's); the parts draw it and report `onSend` / `onStop` / `onRetry` / `onNewChat`.

- **Ready-made:** `<AIChat messages busy onSend onStop onRetry onNewChat empty toolbar … />` with `ChatItem`
  (`role`, `content` = Markdown for answers, `pending`, `error`, `failed`). Custom bubbles via `renderUser` /
  `renderAnswer`; content under the last message via `listEnd`; model / attachment controls via `toolbar`.
- **Model picker:** `toolbar={<ChatModelPicker … />}`: chips under the field, left to right = provider (its logo,
  name as tooltip; shown only when more than one is ready) → model → thinking effort (only when the model takes one).
  The app supplies the ready providers, their models and logos and remembers the pick; switching provider resets the
  model to that provider's default. The chips stay usable while an answer streams (the pick applies to the next
  question). `CHAT_PICK_CHIP` for any other chip there (attachments).
- **Panel:** `ChatPanel`, a right side panel. `placement="workspace"` sits in the nearest positioned parent beside the
  content (`z-drawer`, `z-sticky` from `sm`); `"screen"` covers the page as a dialog (`z-dialog`, focus trap), also over
  an open `Modal`, and Escape closes only the chat. Full screen on phones, lifted above the iOS keyboard; resizable from
  `sm` by dragging or ←/→ on the edge (320–900px, double click = 380px, remembered per `widthKey`). Header = `IconTile`
  + title + "new chat" (only once there is a message) + close. Keep it mounted with `shown={false}` while it slides out.
- **Inside:** `ChatView` (skeleton while settings load, `setup` in place of the chat, e.g. an `EmptyState` "AI is not
  set up" + settings button) > `ChatList` + `ChatComposer`. Messages: `UserMessage` (right, neutral tint; `failed`
  dimmed), `AssistantMessage` (left behind `ChatAvatar`, actions such as `ChatCopyButton` once done), `ChatThinking`
  (label + three dots, before the first token), `ChatError` (status tint, optional retry). Empty conversation:
  `ChatIntro` + `ChatSuggestions` of `ChatSuggestion` rows (`href` = external link). `CHAT_ROW` / `CHAT_CHIP` for
  custom rows and chips.
- **Agent parts (`Agent.tsx`, `Terminal.tsx`):** what an agent does, in the order it happened, inside the same
  `ChatList`. `Reasoning` (open while it streams, folds to "Đã suy luận trong N giây"), `ToolCall` (name in words +
  status badge: pending / running / done / error / awaiting; opens to the input and output as JSON), `TaskList` (the
  plan: step marks + "2/5 bước"; the running step is `aria-current`), `ActionConfirmation` (human in the loop: every
  outward-facing, paid or irreversible action waits for Cho phép / Từ chối, and the outcome stays in the log; `danger`
  for what cannot be undone), `Terminal` (command + streamed output, follows the end unless scrolled up, exit code),
  `FileTree` (keyboard tree with A / M / D change marks), `Sources` + `Citation` (numbered links that match),
  `ContextMeter` (context window ring in the composer `toolbar`; amber from 80%, red from 95%). Details stay behind
  disclosures and are never live regions: only the answer is announced. Example to copy: the *Agent workspace* block (`semi add agent-run`).
- **Behaviour built in, do not re-implement:** Enter sends, Shift+Enter breaks the line, Enter while an input method
  composes (Telex / VNI) does not send; the field grows to 45% of the screen; focus returns to it after a typed
  question is answered; the list follows new text only while the reader is at the bottom (else a "jump to latest"
  button); streamed tokens are not read out one by one, the finished answer is announced once (`role="log"` + a polite
  status).

## 15. Icons & Semantic Registry

`<Icon name="…" />` from `Icon.tsx` (new Lucide-style 24×24 paths go into `ICONS` in the semi repo). Follow the
**Semantic Icon Guide** in `docs/ICONS.md`: every icon has an explicit purpose, do's & don'ts, and canonical action mapping
(e.g. `trash` for delete, `close` for dialog dismiss, `refresh` for sync, `sliders` for process parameters, `user` for profile, `filter` for search filters).

Stroke 1.75, round caps and joins, no fills (play / stop too). Sizes: `w-4 h-4` default, `w-3.5 h-3.5` in chips and captions,
`w-5 h-5` in `md` tiles, `w-6 h-6` in empty states and `lg` tiles. No emoji or unicode pictograms (✕ ✓ ✗ ⚠) in UI
text, toasts or buttons: use `<Icon name="close" />`, `check`, etc. An app-only icon (a product logo) lives in the app
and is listed in `semi-lint.json` → `skip.inline-svg-path`.

## 16. Shared building blocks (`@semi/ui`)

| Import | Exports |
|---|---|
| `@semi/ui` → `AppShell.tsx`, `RouteHeader.tsx`, `RouteHeaderBanner.tsx`, `MobileTabBar.tsx` | `AppShell` (1.0 frame: nav panel with main action, groups, pinned, bottom row of tools; 224px or the 72px rail; RouteHeader; content card; phone drawer; nav shortcuts), `useAppShell` (sub-items shown, rail, shortcuts), `navShortcutKeys`, `RouteHeader` (three slots: crumbs or `left`, middle, actions + account or `right`), `RouteHeaderBanner` (the centre slot's announcement, `localBannerStore`, types `RouteHeaderBannerProps`, `RouteHeaderBannerStore`), `AccountMenu` (the account avatar menu), `useRecordCrumb` (a detail page names its record), `MobileTabBar`, `TAB_BAR_PAD` (opt-in `mobileNav="tabs"`) (§4) |
| `MegaMenu.tsx`, `MinimalHeader.tsx`, `TextTabs.tsx`, `PillTabs.tsx`, `SegmentedControl.tsx`, `useTabParam.ts` | `MegaMenu` (flyout of category columns, `text-overline` headers, New badges, See all), `MinimalHeader` (breadcrumb left, one link + one primary right), `TextTabs` (big display tabs for 2–4 top-level views, brand underline, `href`, `onBeforeChange`, `activation`), `PillTabs` (default section tabs for 5+ sections or sections with icons, sliding `item-hover` pill, `tabpanel`, `href`, `onBeforeChange`, `activation`), `SegmentedControl` (2–5 filter values with counts, sliding `raised-2` pill, `radiogroup`), `useTabParam` (`?tab=` URL state without history spam per arrow key) (§4, §4h) |
| `Page.tsx`, `PageEnter.tsx`, `ListReader.tsx` | `Page` (shared 1.0 page anatomy and `work` / `reading` / `two-column` layouts + vertical rhythm + `enter`), `PageEnter` (`display: contents` route-level `motion-enter` + `motion-stagger` wrapper for top blocks and first ~10 rows / cards, once per route), `SubNav` (240px sub-nav card with `text-nav-label` groups and h32 items), `PageSection` (20/500 heading + 16px content gap), `PageGrid` (8px `@container` grid), `ListReaderLayout` (two independent scrollers on `fixed` mode, `?open=`, `useRecordCrumb`, phone swap), `ReaderHeader` (sticky one-row reader header: wrapping title left, `[•••]` + one main action right) (§4a, §4g) |
| `PageTitle.tsx`, `SubpageToolbar.tsx` | `PageTitle` (18/400 UI sans on the action row; `variant="reading"` 44/500 display title for one-column reading pages), `SubpageToolbar` (`STICKY_TOOLBAR` + icon-only CTA + search + refresh; phone layout with `filters` / `collapseFilters` / `secondaryActions`), `ToolbarFilters` (§4a) |
| `SearchPill.tsx`, `FilterChipRow.tsx`, `ViewSwitch.tsx`, `FilterPanel.tsx`, `filterParams.ts`, `urlState.ts` | `StickyContextBar` (trackpad-proven layout-pin search + filter bar, focus-pin, `data-stuck` / `data-searching`, `--sticky-pin` / `--sticky-view`), `BarActions` + `BarAction` (pinned in-field actions slot, ≤ 2 slots `[•••][main]`), `SearchPill` (wide pill search, debounce, `/`, `trailing`), `SortDef`, `FilterChipRow` (one-line chips, ‹ ›, Xoá lọc, leading views, trailing `sort` + `selection` in-place bulk bar + `ViewSwitch`), `useListSelection` (selection-mode state hook), `BulkAction`, `ListSelection`, `FilterChip`, `FilterOptions`, `useFilterParams` (URL filter + `?sort=key.dir` state, `legacy` rewrite, `patch`, Back / Forward), `FilterParamsOptions`, `FilterParamsSortOptions`, `LegacyParamsMap`, `replaceFilters`, `writeSearch`, `ViewSwitch` (list ↔ grid, density), `PhoneFilterBar` (views · Bộ lọc · sort · Chọn / in-place selection bar), `FilterPanel` (full-screen / side-sheet filters); URL helpers `readFilters`, `readFilterValues`, `writeFilters`, `clearFilters`, `activeFilterCount`, `toQueryString`, `readSort`, `writeSort`, `parseSort`, `formatSort`, `SORT_PARAM`, types `FilterSpec`, `FilterDef`, `FilterOption`, `FilterValues` (§4, §4d, §4e) |
| `SplitButton.tsx`, `CardActions.tsx`, `DetailOverlay.tsx` | `SplitButton` (main action + ▾ `Menu` of its variants, one button on phones, G1), `CardActions` (hover / focus icon actions + ⋯ on cards, ⋯ only on touch), `DetailOverlay` (record over its list: ‹ › with n / N, side panel, scroll kept), `useDetailParam` (`?open=` in the URL, Back closes), `openDetail` (open one from anywhere on the route), types `CardAction`, `DetailParamState` (§4, §9) |
| `WorkspaceLayout.tsx`, `GuidedEmptyState.tsx`, `FeatureIntro.tsx`, `HintTextarea.tsx` | `WorkspaceLayout` (page type workspace: control panel + sticky main action, result), `WorkspaceHeader` (back + tool name, tabs), `WorkspaceSection` (`text-overline` label + counter), `Stepper` (− value +, spinbutton), `GuidedEmptyState` (EmptyState variant guided: step carousel or numbered steps, starting points), `FeatureIntro` (once-per-user feature dialog, `localIntroStore`), `HintTextarea` (@ / `/` hints and suggestions), types `GuideStep`, `GuideTemplate`, `GuideTemplateGroup`, `FeatureIntroSlide`, `FeatureIntroStore`, `HintToken`, `HintTrigger` (§4, §9b, §13, §14) |
| `SectionHeader.tsx`, `MediaCard.tsx` | `SectionHeader` (discovery / gallery section head: 20 / 500 title, description, `actions`, ‹ › `pager` of subtle icon Buttons over a rail or handlers; types `SectionHeaderProps`, `SectionHeaderPager`, `SectionHeaderPagerHandlers`, `SectionHeaderPagerTarget`), `MediaCard` (16:9 media card, caption + overline meta, optional `topLeft` / `bottomRight` slots, one link or button, hover scale; type `MediaCardProps`) (§8) |
| `KpiCard.tsx`, `Modal.tsx` | `KpiCard` (metric card in the brand's figure font, neutral icon, `featured` for the screen's main number, shimmer), `Modal` (shared portal dialog with `MODAL_HEAD` + `MODAL_FOOT`) (§13, §14) |
| `Icon.tsx` | `Icon`, `ICONS`, `IconName`, `IconTile`, `TILE_TONES`, `TONE_TEXT`, `TileTone` |
| `AppHeader.tsx` | `AppHeader` (stand-alone app top bar, §4b) |
| `PageActions.tsx` | `PageActions` (a tab's header buttons), `PageActionsSlot` + `PageActionsProvider` |
| `Skeleton.tsx` | `Skeleton`, `SkeletonCard`, `SkeletonGrid`, `SkeletonRows`, `SkeletonList`, `SkeletonTable`, `SkeletonDetail` (shaped: list rows, table rows, a record), `PageSkeleton` (`shape` cards / list / detail), `Loading`, `BootLoader` (boot / session gate only) (§13b) |
| `FormActions.tsx`, `useUnsavedGuard.ts`, `formValidation.tsx`, `fieldKinds.ts` | `FormActions` (Huỷ + Lưu / Tạo, sticky on a page, `placement="modal"` footer), `useUnsavedGuard` (reload, tab close, link, back), `useFormValidation` + `FormErrorSummary` (blur, then change; Alert summary), `FIELD_KINDS` / `FieldKind` (§9b) |
| `Feedback.tsx`, `States.tsx` | `Alert`, `Progress`, `Avatar` (`initials={1 \| 2}`, `tone="auto \| neutral"`), `LetterAvatar` (one-letter neutral avatar, `vi` locale), `EmptyState` (`variant` first-use / no-results, `onClearFilters`), `ErrorState`, `NotFound`, `Forbidden` (§13, §13c) |
| `FileDrop.tsx` | `FileDrop`, `DropZone` (compact FileDrop for a workspace panel), `DropZoneProps`, `FileDropItem`, `FileRejection`, `matchesAccept`, `formatFileSize`, `classifyFiles`, `FileRejectReason` (§13b uploads: `FileDrop` + `Progress`) |
| `confirmDialog.tsx` | `confirmDialog()`, `confirmDelete()`, `ConfirmHost`, `ConfirmOptions`, `ConfirmDeleteOptions` (§14, §14c) |
| `TaskHost.tsx` | `startTask()`, `TaskHost`, `TaskOptions`, `TaskHandle` (blocking task overlay, §13b) |
| `ThemeProvider.tsx` | `ThemeProvider`, `useTheme`, `ThemeToggle`, `ThemeSwitcher` (segmented, or `variant="menu"`), `useThemeUtility` (§2) |
| `Markdown.tsx` | `Markdown` (AI answers) |
| `Chat.tsx` | `AIChat`, `ChatPanel`, `ChatView`, `ChatList`, `ChatComposer`, `UserMessage`, `AssistantMessage`, `ChatAnswer`, `ChatError`, `ChatThinking`, `ChatIntro`, `ChatSuggestion(s)`, `ChatAvatar`, `ChatCopyButton`, `ChatModelPicker`, `CHAT_ROW`, `CHAT_CHIP`, `CHAT_PICK_CHIP`, `ChatItem` (§14b) |
| `ExternalLink.tsx` | `ExternalLink` |
| `Chip.tsx` | on-off chips (`Chip`, `CHIP_BASE`, `CHIP_CHECK`, `chipClass`, `chipIconClass`, `TAG`, `TONE_DOT`) |
| `SearchInput`, `CustomSelect`, `CustomCombobox`, `MultiCombobox`, `OptionCards`, `DatePicker`, `Pagination` | toolbar and form inputs (`CustomCombobox` & `MultiCombobox`: diacritic-aware, IME-safe search + `group` headings; `OptionCards`: selectable radio-group cards with neutral `item-selected` fill, 8px grid gap) |
| `NumberInput` (+ `NumPadPopup`, `useCoarsePointer`) | every number field (app numpad on touch screens) |
| `SidePanel`, `SidePanelToggle`, `RefreshButton` | tool-app left panel, icon-only reload action |
| Hooks (`Field.tsx`, `a11y.ts`, `floating.ts`) | `useField` (a custom control reads its `Field`: id, `aria-describedby`, invalid), `useDialog` (focus trap + scroll lock + Escape for a modal-like surface; built on `useFocusTrap` and `useScrollLock`), `focusFirstField(root)` (focuses the first field only on `(hover: hover) and (pointer: fine)` unless focus already sits in a field; `Modal` and `Drawer` run it on open by default, `autoFocusFirstField={false}` opts out), `useBackdropClose` (a backdrop that wraps its panel closes only on a click that starts and ends on it), `useAnchoredPosition` (fixed menu / tooltip next to its trigger, flips above, never clipped), `useCoarsePointer`, `useTheme` |
| `@semi/ui/styles` → `surfaces.ts` | `SHELL_*`, `CARD`, `CARD_HOVER`, `CARD_BORDERED`, `CARD_BORDERED_HOVER`, `CARD_ACTIVE`, `HERO`, `TILE`, `SECTION_*`, `COUNT_PILL`, `EMPTY`, `ICON_BTN` / `ICON_BTN_DANGER`, `STATUS_PILL`, `STATUS_DOT`, `STICKY_TOOLBAR`, `MODAL_*`, `FIELD_LABEL`, `FIELD_INPUT`, `FIELD_TEXTAREA`, `FORM_PAGE`, `FORM_ACTIONS`, `FORM_ACTIONS_STICKY` |
| `buttons.ts` | `BTN_PRIMARY`, `BTN_SECONDARY`, `BTN_OUTLINE`, `BTN_DANGER`, `BTN_DANGER_SUBTLE`, `BTN_ICON`, `BTN_LG`, `BTN_PILL`, `MODAL_BTN_*` (incl. `MODAL_BTN_OUTLINE`, `MODAL_BTN_DANGER_SUBTLE`) |
| `appChrome.ts` | `HEADER_ICON_*`, `headerPrimary`, `HEADER_PILL`, `VIEWPORT_*` |

Components are client components (`"use client"`), shipped as TypeScript source: the app adds
`transpilePackages: ["@semi/ui"]` to `next.config.*` and `@source` lines for `src` and `styles` to its CSS (README).

A component used by **two or more Semi apps** belongs here; open a change in the semi repo instead of copying it.

## Form fields

Wrap every control in `<Field label hint error required kind>` (`kind` sets the phone keyboard and autofill, §9b): it renders the label (`FIELD_LABEL`), links the hint / error
with `aria-describedby`, sets `aria-invalid` and announces the error (`role="alert"`). `Input`, `Textarea`,
`NumberInput`, `CustomSelect` (`variant="field"`) and `CustomCombobox` read the Field automatically:

```tsx
<Field label="Tên máy in" hint="Hiện trên thẻ." error={errors.name} required>
  <Input value={name} onChange={(e) => setName(e.target.value)} icon="printer" />
</Field>
```

Input surface: `FIELD_INPUT` (quiet 1.0 field: `bg-field border border-field-line rounded-control px-3 h-field text-ui max-sm:text-input`; on focus `border-field-line-focus bg-field-focus`, no glow ring; on keyboard focus `:focus-visible` a 2px `outline-focus` outline shared with buttons); invalid adds `border-danger-fg` (`danger-border` is too faint for an input's edge). Never `outline-none` without a visible focus indicator. Choices: `Checkbox` (with `indeterminate`), `Switch` (settings that apply at once), `RadioGroup` (2–5 exclusive
options; more → `CustomSelect`), `OptionCards` (selectable radio-group cards with neutral `item-selected`, 8px gap), `MultiCombobox` (searchable multi-select with removable chips and option groups). A `Switch` or `Checkbox` without a visible `label` (on a card whose title names it, a
table row) gets `aria-labelledby` (the title's id) or `aria-label`; `label` wins, and in development an unnamed one logs
a warning. Both get `HIT_AREA`: a 24 × 24 px click area (44 × 44 px on touch screens) from a pseudo-element, so the
visible size (`size="sm" | "md"`) and the layout stay the same.

## 17. Primitives (`@semi/ui`)

| Need | Use |
|---|---|
| Any action | `Button` (`variant` subtle (default) / surface / inverse / outline / ghost / primary / secondary (brand) / danger, `size` xs / sm / md / modal, `badge` (attention count on an icon button), `icon`, `iconOnly` + `aria-label`, `shape="round"` for a round icon button, `loading`); `Spinner` only inside a button or field running its own action, never for a page) |
| Overflow actions of a row / card / page | `Menu` (icon-only "more" trigger or your own; `danger` items always last; `group`, `description`, `checked`, `loading`, `href`, `hidden`; a bottom sheet below `sm`) (§9 G2, G4, G5) |
| Other ways to start the main action | `SplitButton` (Thêm khách hàng \| ▾ Nhập từ file, Tìm trong Data Hub) (§9 G1) |
| Quick actions on a card or media tile | `CardActions` (inside a `group relative` card; `label` names the item) |
| Open a record from a list and step through it | `DetailOverlay` + `useDetailParam` (§4) |
| Hint for an icon-only control | `Tooltip` (never essential text: touch screens do not show it) |
| Feedback after an action | `toast.success|error|warning|info(title)`, `toast.undo(title, restore)` after a reversible destructive action, `toast.promise(p, { loading, success, error })` (§14c) + `<ToastHost />` in the layout (`label` when a page section is also called "Thông báo"). Irreversible: `confirmDelete({ name })` first |
| A job the user must wait for | `startTask({ label, onCancel, timer })` + `<TaskHost />` in the layout |
| Something waits for the user (unread, to approve); a new item | `CountBadge` (brand fill, 99+; `tone="neutral"` for a plain count) or Button `badge`; `NewTag` ("Mới": brand at 18%, AA-picked text) |
| Persistent message in a page | `Alert` (tone, title, action, `onDismiss`) |
| Save / Cancel under a form; losing typed work; field errors | `FormActions`, `useUnsavedGuard`, `useFormValidation` + `FormErrorSummary` (§9b) |
| Secondary task beside the page | `Drawer` (right / left / bottom / top sheet) |
| Sections of one page (5+, or with icons); 2–5 filter values with counts; 2–4 top-level views; sections of one record | `PillTabs` (5+ sections / icons) · `SegmentedControl` (2–5 filter values with counts) · big `TextTabs` (2–4 top-level views as the page heading, display face + brand underline) · `Tabs` (underline, sections of one record inside a card) · `useTabParam` (`?tab=` in the URL) (§4h) |
| Top row of a detail / settings page | `MinimalHeader` (`Breadcrumb` left, one link + one primary right) |
| Title row of a list page (title + create action + refresh) | `PageTitle actions` above the `StickyContextBar` (block `list-page`) |
| Many destinations of one area in a few groups | `MegaMenu` (AppShell item `mega`, or its own trigger) |
| Compared rows | `Table` + `THead` / `TBody` / `TR` / `TH` / `TD numeric`; cells stay on one line and the table scrolls sideways on phones (`TD wrap` for a long-text column); entity overviews stay Bento `Card`s |
| Progress / quota | `Progress` (determinate or indeterminate) |
| Choose or drop files, per-file upload progress | `FileDrop` (controlled `items`; `onAdd` accepted files, `onReject` (type, size, directory, duplicate, multiple), `onRemove`, `onRetry`; `accept`, `maxSize`; inside `Field`). Never a native `<input type="file">` |
| People | `Avatar` (photo or 1–2 initials on a stable tone), `LetterAvatar` (one letter upper-cased with `vi` locale, `?` when empty, neutral fill) |
| Nothing to show yet | `EmptyState` (icon, one line, action) |
| Related buttons as one control | `ButtonGroup` (‹ Hôm nay ›, zoom, view mode: G3); a main action with variants → `SplitButton` |
| Pressed state / icon option sets | `Toggle` (one, `aria-pressed`); `ToggleGroup` (`type` single = radio group, multiple = toolbar). Text filter sets use `SegmentedControl` |
| Fixed parts around an input | `InputGroup` (`start` / `end`: prefix, unit, small button) |
| A number by dragging | `Slider` (one thumb, or `range` for min–max; `format` for units) |
| Pick a day / a range on the page | `Calendar` (`mode` single / range); a date field → `DatePicker` (uses Calendar) |
| Where the page sits | `Breadcrumb` (collapses the middle into "…" past `maxItems`) |
| Hide / show sections | `Collapsible` (one), `Accordion` (list; `type` single / multiple) |
| Small interactive panel under a trigger | `Popover` (non-modal dialog); a hover preview of a link → `HoverCard` |
| Actions at the pointer | `ContextMenu` (right-click, long-press, Menu key); the same actions must exist in a visible `Menu` |
| Jump / run anything from the keyboard | `CommandPalette` once in the root layout (⌘K, pages add items with `useRegisterCommands`, `openCommandPalette()`); `CommandDialog` + `useHotkey` for a palette of your own, `Command` inline; matching ignores Vietnamese marks |
| Sort / filter / select / page rows | `DataTable` (`columns`, `search`, `selectable` + `bulkActions`, `pageSize`, `loading`). Many columns (a tablet beside the rail, a split view): give the less important ones `priority` 1–3; they fold into the first column's second line when the table's **own box** is too narrow (3 first; the first column and columns without a priority never fold). The sorted column never folds (its header is the sort control). Folding is measured after hydration, so such a table may shift once on first load. What still does not fit scrolls sideways with a 2px strong line (outline-line) on each edge that has columns past it and the scroll box focusable; `stickyFirstColumn` keeps the names in place. The order it shows is `sortRows(searchRows(rows, columns, search), columns, sort)` (pure, also for a DetailOverlay's ‹ ›) |
| Fixed-height scrolling list | `ScrollArea` (edge lines, optional thin scrollbar, keyboard focusable) |
| Divider / key cap | `Separator` (horizontal, vertical, with a label); `Kbd` (`keys={["⌘", "K"]}`) |
| Charts | `BarChart` (grouped / `stacked`), `LineChart` (`area`), `DonutChart` (≤ 5 parts), `Sparkline` (trend in a KPI tile). Series colours are the fixed `chart-1…8` tokens in order, a 9th series folds into “Khác”; one y axis only; legend for 2+ series, keyboard tooltip and table view built in |
| One-time code / PIN | `InputOTP` (one real input, paste and SMS autofill work) |
| Slides in a row | `Carousel` (`perView`, scroll-snap, no auto-play) |
| Areas people resize | `ResizablePanels` (`direction`, `defaultSizes`, `storageKey`) |
| Media at a fixed ratio | `AspectRatio` (`ratio`, default 16 / 9) |
| A gallery or discovery section | `SectionHeader` (title, `actions` "Xem tất cả", ‹ › `pager`) over a grid or rail of `MediaCard` (§8) |
| Website top navigation | `NavigationMenu` (links + panels of described links; a sheet below md) |
| Commands of a desktop-style tool | `Menubar` (Tệp · Sửa · Xem; items like `Menu`) |
| Code to read or copy | `CodeBlock` (`title`, copy button) |
| A code a phone scans (VietQR, link) | `QRCode` (`value`, `label`, `errorCorrection`, `caption`, `copyValue`, `print` for receipts). Modules are always black on white with a 4-module quiet zone, in both themes: a documented exception, never recolour |
| Long-form text (articles, Markdown) | `Prose` |
| List rows | `Item` (icon / media, title, description, meta, actions, `href`) in an `ItemGroup` |

The full inventory with props is generated into `components.json` (`npm run build:manifest`).

## 17b. `data-semi`: component names in the DOM (#194)

Every exported component marks its root element with `data-semi="<ComponentName>"` (the idea of shadcn's `data-slot`); a significant part carries `<Component>.<Part>` (`ToastHost.Toast`). Floating layers carry the name of what they are: the bubble of `Tooltip` and the panel of `Menu` / `Popover` / `HoverCard` (they render in `document.body`, away from their trigger; `ContextMenu` and `Menubar` lists are `Menu` panels too). A component whose root is another Semi component passes its own name down (`SkeletonGrid` renders `<Loading data-semi="SkeletonGrid">`) through the internal `SemiName` prop (`src/a11y.ts`; API tables leave `data-*` props out), and `Menu` / `Popover` put a given `data-semi` on their trigger (`FilterChip`, `AccountMenu`). Context providers and `ThemeScript` render no element and carry none. On a component that spreads its other props onto the root (`Button`, `Card`, `ExternalLink`), a `data-semi` you pass replaces its own.

- **Use it for:** debugging (`document.querySelectorAll('[data-semi="Button"]')`), tests (`page.locator('[data-semi="Card"]')`) and the docs site's component inspector (docs/COMPONENT_DOCS.md).
- **Never style by it:** no `[data-semi=…]` selector, no `data-[semi=…]:` variant. `lint/test/data-semi.test.mjs` fails on one in `src/` or `styles/`, and on an exported component without its `data-semi`.
- **Stable:** the value is the exported name; it changes only when the component is renamed.
- **A new component:** put `data-semi="<Name>"` first on its root element (before a `{...rest}` spread, so a wrapping component's name wins).

## 18. Accessibility & UI strings

- Contrast: every text / background pair ≥ 4.5:1 (3:1 for ≥ 24px) in **both** themes; `npm run test:ui` checks every
  Storybook page in light and dark, plus axe (WCAG 2.2 AA), control boundaries ≥ 3:1 and focus in forced colours.
  One explicit owner exception (#147): inactive tabs of big `TextTabs` render `text-strong` at `opacity-20` (hover
  raises opacity, keyboard `:focus-visible` restores full opacity).
- Keyboard: every control is reachable and shows `FOCUS_RING` (`focus-visible` only); dialogs (`Modal`, `Drawer`,
  `confirmDialog`, `NumPadPopup`) trap focus, close on Escape and return focus to the opener (`useDialog`); menus,
  tabs and comboboxes follow the WAI-ARIA keyboard patterns.
- Layers in a dialog: a select list, popover, menu, date picker or tooltip open inside a dialog gets Escape first
  (one Escape closes the layer, the next the dialog). A custom layer does the same by handling Escape in its own
  `onKeyDown` with `preventDefault()` (or `stopPropagation()`); the trap ignores a handled key. Layers portaled to
  `body` keep their own Tab handling; focus that leaves the dialog anywhere else is sent back.
- Triggers keep their own props: `Popover`, `HoverCard`, `Tooltip` and `Menu` add theirs to the trigger element
  without replacing its `ref` or handlers (the trigger's handler runs first; `preventDefault()` there skips ours).
- Boundaries and states (WCAG 1.4.11): checkboxes and radios keep `border-control-line` (≥ 3:1). Text-like fields
  (`Input`, `NumberInput`, `Textarea`, `HintTextarea`, `CustomSelect`, `CustomCombobox`, `MultiCombobox`, `DatePicker`,
  `SearchInput`, `SearchPill`, `Command`, `InputGroup`, `InputOTP`) use the 1.0 quiet field style (`bg-field`, 1px
  `border-field-line`, `rounded-control`; on focus `border-field-line-focus` + `bg-field-focus`, no glow ring). Their
  resting edge is below 3:1 by the owner's choice (C-007), backed by a keyboard-only (`:focus-visible`) 2px
  `outline-focus` outline (≥ 3:1 in both themes, shared with buttons). The chosen segment of a segmented control
  (`Toggle`, theme switcher) uses `SEGMENT_ON`: its inset ring marks which one is on.
- Dialog autofocus: `Modal` and `Drawer` focus their first field only on devices with a physical keyboard
  (`(hover: hover) and (pointer: fine)`), never when focus already sits in a field, and opt out with
  `autoFocusFirstField={false}`; touch phones keep the on-screen keyboard closed. Use `focusFirstField(root)` for the
  same rule after a tab change.
- Forced colours (Windows high contrast) drop box-shadow, so `base.css` draws a system-colour outline on
  `:focus-visible`; keep `base.css` imported, and never rely on a shadow alone to show focus.
- Names: icon-only controls carry `aria-label` (Button's type requires it); form controls get their label from `Field`.
- Target size (WCAG 2.5.8): every control is at least 24 × 24 px or keeps 24px from the next one. A control drawn
  smaller (a carousel dot, a slider thumb, a text button in a line, a 16px checkbox) takes `HIT_AREA`
  (`@semi/ui/styles`): a pseudo-element that grows the click area to 24px, 44px on touch screens, while the visible
  size and layout stay; the control needs `relative` and no `::before` of its own.
- Touch targets (#186): every control has a tap area of at least 44 × 44px on a touch screen, while the drawn size
  with a mouse stays. Two shared helpers, nothing hand-made: `BTN_HIT` (`pointer-coarse` + `max-sm`, touch phones only,
  real growth; in `Button`, `BTN_ICON`, `HEADER_ICON_BTN`, `MODAL_CLOSE`) for a control in a dense row or above
  content, whose 44px pseudo-element would cover a neighbour (Pagination, ViewSwitch, GuidedEmptyState step nav,
  `SidePanelToggle`), and `HIT_AREA` (an invisible `::before`: 24px with a mouse, 44px with `any-pointer-coarse`, i.e.
  any device with a touch screen at any width) for an isolated small control (Alert dismiss, MultiCombobox chip remove,
  SidePanel expand, CardActions ⋯, Calendar month nav). Never `HIT_AREA` on a row of small targets: Carousel dots sit in
  real buttons with no gap (24 × 24, `any-pointer-coarse:size-11`), the dot drawn 6px inside. Inline chips (`Citation`)
  get their own area: 4px wider each side (half the 8px between two chips, `mx-1`, so it is at least 24px wide), 24px
  tall, 44px on touch phones, so adjacent chips never overlap. A chevron inside a field (`CustomCombobox`) becomes its
  own 44px column with matching input padding, so its area never reaches the text. Pagination shows first · current ·
  last on a touch phone, chosen after mount (one list; the server renders the full window). `tests/touch-targets.spec.ts`
  measures a sample of each at 390 × 844 (touch), taps near each edge of the 44px box with `elementFromPoint`, checks the
  Carousel dots on a touch tablet and with a mouse, and checks the drawn size at 1440.
- Touch targets, selection controls (#187): items of a dense row grow to 44px on a touch phone (`BTN_HIT`,
  `pointer-coarse` + `max-sm`, real size, so neighbours never share a tap point): `SegmentedControl` (the track
  grows to 52px), `PillTabs`, `Tabs`, `TextTabs` (44px tall, the word stays on the baseline), `ToggleGroup` /
  `Toggle`, `ThemeSwitcher` segments, `Menubar` menus, `FilterChipRow` chips and "Xoá lọc", `ChatModelPicker` chips,
  `Breadcrumb` links and "…", the `DataTable` sort buttons and select-all cell (the header row is 44px there), the
  `Stepper` − + (44 × 44, flush with its 44px track). Rows that scroll keep scrolling sideways on one row; a
  `ToggleGroup` is never wider than its container and scrolls inside its own track (labels never wrap; ←/→ keep the
  focused option in view), so an app needs no wrapper. A labelled
  `Checkbox`, `RadioGroup` option or `Switch` is one `<label>` row: a tap anywhere on it toggles, and on a touch
  phone it gets 12px above and below (at least 44px tall); a box or switch without a visible label keeps `HIT_AREA`.
  `Chip` (34px) is not grown here: its look is the Magnific parity issue (#190). `tests/touch-targets.spec.ts` covers
  one of each at 390 × 844 (touch), the dense rows (one row, no overlap, no page overflow), a tap on a label row, and
  the drawn sizes at 1440.
- Motion: animations respect `prefers-reduced-motion`.

**Measured in apps.** Semi's components pass the checks above in `test:ui`, but a screen made of them can still fail:
muted text on a tinted card, an icon button without a name, a field whose edge disappears on a grey panel, a
hand-made control with no ring. `npx semi a11y <url…>` (`lint/a11y.mjs`) checks the rendered page in dark and light at
1280px and 375px, and adds axe-core's serious WCAG 2.2 AA findings (`axe/<id>`) when the app has `axe-core`
installed. Without Playwright, `--snippet` prints an expression to evaluate with a browser tool (once per theme).
`/semi-check` runs it as phase 6; `test:ui` runs the same audit on every docs and brand book page.

| Rule | Fails when |
|---|---|
| `contrast` | Text is under 4.5:1 against the surface under it, translucent tints blended in (3:1 from 24px, or bold from 18.66px); disabled controls are exempt |
| `edge` | A field you type in or pick from (input, textarea, select, combobox) shows no edge, or an edge below 3:1 without a quiet edge (≥ 1.2:1, `border-field-line`) backed by a 2px ≥ 3:1 `:focus-visible` outline; a wrapper hugging the field (an input group, a composer) counts as its edge; an open combobox (a command palette) is told apart by its list |
| `name` | A button, link, field or ARIA control has no name (text, `aria-label`, `aria-labelledby`, a label, `title`), or only a placeholder |
| `focus-ring` | Focusing a control from the keyboard changes nothing on it, its three wrappers or its siblings (outline, shadow, border, fill, colour), compared with the control unfocused (the focus a dialog's trap already put on it is taken off first; a control that takes focus back on blur is reported as "could not be moved off", a control focus cannot land on while another element keeps it as "could not be moved onto"; the page behind an `aria-modal` dialog is left out) |
| `target-size` | A control is smaller than 24 × 24 px (its `::before` / `::after` hit area included) and a 24px circle on its centre touches another target or another small target's circle; links in a sentence are exempt |
| `img-alt` | An `<img>` has no `alt`, or a `role="img"` has no name |
| `lang` | `<html>` has no `lang` |
| `field-size` | At a viewport under 640px, an input, textarea or select you type in has text under 16px (iOS Safari zooms the page on focus and never zooms back); read-only and disabled fields are exempt. Fix: `FIELD_INPUT`, or `max-sm:text-input` |
| `zoom-lock` | The viewport meta has `user-scalable=no` or `maximum-scale` below 2 |

`data-a11y-skip="<reason>"` marks a specimen that breaks a rule on purpose (a contrast sample in a brand book); never
put it on an app screen to silence a hit.
- Strings: shared components never hard-code UI text; they read `useSemiLocale()` (Vietnamese default). Apps switch
  language with `<SemiLocaleProvider locale={en}>` or override single strings (`locale={{ close: "Thoát" }}`).

## 19. Product look & the generic AI look

Every AI-made app tends towards the same screen: sidebar, title, four equal KPI cards with a coloured icon each, a
table; a landing page with a hero and three feature cards ("Fast / Secure / Dedicated"). Semi screens avoid it in two
ways.

**The product's look.** Colour (the two brand fills), fonts and voice come from the brand; shape, title weight and the
font of big numbers are Semi's one look (`tokens.json` "shape"). Density and type scale belong to each **product**, because one brand has a dense dashboard and a
roomy store: `data-density` / `data-type-scale` on `<html>` (or any wrapper), mirrored as `"density"` /
`"typeScale"` in `semi-lint.json`, picked in `/semi-new-app` by the kind of product.

| Choice | Set by | Token | Read by |
|---|---|---|---|
| Density compact / regular / airy | product | `--spacing` (Tailwind's unit: every `p-*`, `gap-*`, `space-*`) | everything |
| Type scale even / contrast | product | `--text-figure` … `--text-tab-xl` | `PageTitle`, `KpiCard`, headings |
| Title weight | shape | `font-title` (`--font-weight-title`) | `PageTitle`, `KpiCard` |
| Font of big numbers | shape | `font-figure` | `KpiCard` |

Titles are 500 (`font-title`, headings are not bold) and figures use the sans. Apps use `font-title`
and `font-figure` for their own titles and big numbers, change density and type scale only through the attributes,
and never override the variables (`brand-override`).

**Composition rules** (agents and reviewers; `/semi-check` reviews them, `semi-lint` catches the colour one):

- One main block per screen, bigger than the rest: the thing the user came for. `KpiCard featured` for the main
  number of a row; not four equal cards by default.
- KPI and card icons are neutral or left out; colour means a status (`tone`, a status `iconTone`), never one
  decorative colour per card (`decorative-icon-tones`: three or more icon colours in a file).
- No row of three feature cards with an icon, a one-word title and a vague promise: show proof (a product shot,
  a real number in `font-figure`, a customer quote).
- Icons where they help scanning (navigation, actions, status), not in front of every label or row.
- Sample, placeholder and empty-state text comes from the brand's brief and voice, never "Lorem", "John Doe", "Acme"
  or another product's domain.
- Vary the rhythm: plain sections, dividers and white space next to cards, not every block a card with the same
  padding.
- Stay inside the density budgets (§4c): frames, text sizes, colours, filled buttons, row and box padding. The density
  audit measures them; the rest of this list is a person's judgement.

### 19b. Screen review

What a person (or an agent with a browser) answers for every key screen before it ships, and what `/semi-check`
walks through per screen. The measured rows are already caught by tools; the review is for the questions no tool can
answer. A "no" is fixed, or written down with its reason.

| Factor | Measured by | Ask of each screen |
|---|---|---|
| Visual hierarchy | `primary-actions`, `type-mix` | Is it clear in two seconds what the screen is for and what to do next? Is there one main block, bigger than the rest (§19)? |
| Typography | `semi-lint` (sizes, weights, case) | Do titles, labels and numbers read as three levels? Do long names wrap or truncate with the full text on hover? |
| Spacing & layout | `semi density` (§4c), phone overflow | Do related things sit together and unrelated ones apart? Does it still read at 375px, and on a 1440px screen? |
| Colour | `contrast`, `colour-noise`, `no-fixed-tone-text` | Does every colour mean something (§3)? Would the screen still make sense in greyscale? |
| Consistency | `semi-lint` (no own primitives), `/semi-check` phase 4 | Does the same thing look and behave the same as on the other screens (names, icons, the place of actions)? |
| Accessibility | `semi a11y` (§18), axe | Can the whole task be done with the keyboard alone, and does a screen reader announce what changed? |
| Usability & conventions | — | Does it follow the platform: Escape closes, Enter submits, the back gesture and the browser's back work, a link opens in a new tab with ⌘-click? Is a destructive action confirmed (`confirmDialog`) or undoable (`toast` with an action)? Does a form keep what was typed after an error? |
| States & micro-interactions | — | Does the screen have every state: **loading** (skeleton of the real shape, §13b), **empty** (first-use with the action that fills it, and "no result" for a search or filter, §13), **error** (what failed and how to retry, the data that loaded stays), **partial** (some items failed), **no permission**, **offline** when the app works offline, and **too much** (a long name, 1000 rows, a 7-digit number)? Does every action answer within 100 ms (pressed state, a spinner in its own button, then a toast or the changed data)? |
| Brand & feeling | `semi_brand` voice | Do the words sound like the brand's voice, in the user's language, with real sample data (§19)? Does the screen feel like this product, not a template? |

## Anti-patterns (enforced by `semi-lint`)

**Re-creating instead of composing (0.30.0)** — the corpus in `lint/test/invented-ui.test.mjs` lists what each rule
catches and what it must not:
- **Raw controls (`raw-control`):** `<button>`, `<input>`, `<textarea>`, `<table>` in app code: use `Button` /
  `IconButton`, `Input` / `Textarea` / `NumberInput` / `SearchInput` in a `Field`, `Checkbox` / `Switch` /
  `RadioGroup`, `DataTable`. Allowed: a hidden `type="file"` / `"hidden"` / `"color"` input, and a native element
  styled by a Semi constant (`HEADER_ICON_BTN`, `headerPrimary()`, `BTN_*`).
- **Another UI kit (`foreign-ui`):** `lucide-react`, `react-icons`, `@radix-ui/*`, `@mui/*`, `@headlessui/react`,
  `@heroicons/*`, `@chakra-ui/*`, `antd`, `@mantine/*`, `@tabler/icons-react`, `react-bootstrap`, `@heroui/*`, a
  shadcn `@/components/ui/*` copy. A missing piece goes to `/semi-propose`.
- **Own primitives (`local-primitive`):** `export function Card | Badge | Tooltip | Spinner | …` in an app. Product
  components with their own name (`OrderCard`) compose Semi.
- **Hand-made layers (`custom-overlay`, `custom-spinner`):** `fixed inset-0 bg-overlay|bg-black` → `Modal`, `Drawer`,
  `confirmDialog`, `Sheet`; `animate-spin` borders → `Spinner` (a spinning `<Icon>` is fine).
- **Escape hatches:** `p-[13px]`, `gap-[7px]`, `z-[9999]`, `bg-panel/[0.05]`, `bg-[var(--semi-…)]`
  (`arbitrary-value`; widths, heights, grid templates, `env()` safe areas and viewport units stay allowed);
  `shadow-sm…2xl` (`tw-shadow`); `uppercase` (`text-case`); `leading-*` other than `leading-tight` / `leading-none`
  (`leading-override`); colours, type or radii in `style={{}}` (`inline-style-value`; data colours are a per-file skip)
  or in a stylesheet (`css-raw-value`).
- **Keyboard (`click-target`, `focus-hidden`):** `<div onClick>` without a role (a backdrop is `role="presentation"`),
  `outline-none` with no focus style on the same element (a text field's caret counts).
- **Forms (warnings):** `form-no-guard`, `action-order`, `toast-for-validation`, `field-input-mode` (§9b). They print and never fail the run.
- **Feedback (warning):** `local-toast` (§14c): a toast library or an app-level toast wrapper instead of `toast` from `@semi/ui`.
- **The #94 patterns (#107, warnings, C-021):** `no-spinner-in-list` (a `Spinner`, a lucide `Loader2`, an `animate-spin` element or "Đang tải" / "Loading…" in a
  list, grid or table body, as the other branch of `loading ? … : rows.map(…)` or as an early `if (loading) return <Spinner />`
  of a component that renders a list: show the shape, §13b; a spinner inside the button or field that runs its own action is
  fine), `filter-chip-wrap` (clickable chips, hand-made or `Chip`, that filter, in a `flex-wrap`: `FilterChipRow` +
  `useFilterParams`, §4), `raw-pill-button` (a `rounded-full` button or link of 28px or more with a tint / field / panel fill, or a white / black alpha such as `bg-white/[0.06]`, or a class constant of one:
  `<Button iconOnly shape="round">`), `detail-overlay-url` (a `DetailOverlay` in a file that reads no URL state:
  `useDetailParam`; a wrapper that passes its own `open` prop on is fine), `overline-place` (an allow-list, C-032: `text-overline` only on
  a plain, non-clickable section or form-group label (`div`, `span`, `p`, `h2`–`h6`, `dt`, `figcaption`, `header`, `legend`) whose text is a label
  of 40 characters or less; anywhere else (a control, link, single field label `<label>` / `<Field labelClassName>`, `h1`, table cell, any component) it warns; a class
  constant is not checked). One hard rule: `card-hover-actions-touch` (`<CardActions>` without `label`: on touch the ⋯ is the only
  control). The fixtures are `lint/test/patterns.test.mjs`.
- **The 1.0 design rules (#145, warnings, fixtures in `lint/test/v1-rules.test.mjs`):**
  - **`one-brand-button`:** warns on a second filled brand button (`variant="primary"` / `"secondary"`, `BTN_PRIMARY`, `BTN_SECONDARY`, `MODAL_BTN_PRIMARY`, `MODAL_BTN_SECONDARY`) in the same standalone page or modal. `AppShell` `mainAction`, separate modals, neutral variants and mutually exclusive branches (`tab === "a" && (...)`, ternaries) are excluded. Fix by moving ordinary actions to neutral variants (`subtle`, `surface`, `inverse`, `outline`, `ghost`).
  - **`brand-colour-use`:** warns when brand utilities (`bg-primary`, `bg-secondary`, `text-primary`, `border-primary`, `bg-primary/10` …) are used outside 1.0's allowed places (main buttons, `AppShell` `mainAction`, active big-tab underline `decoration-primary`, `CountBadge`, `NewTag`). Fix with neutral tokens (`text-strong`, `bg-item-selected`, `border-outline-line`, `ring-focus`).
  - **`removed-token`:** warns on tokens, classes, CSS variables and style attributes removed in 1.0 (`bg-accent-subtle`, `border-accent-line`, `text-accent-fg`, `text-contrast`, `text-caption`, `text-label`, `text-title*`, `text-heading*`, `text-kpi`, `z-keypad`, `data-style`, `@semi/ui/styles.json`), naming the 1.0 replacement from `docs/MIGRATION-1.0.md`.
  - **`one-large-button` (#189):** warns on a second `<Button size="lg">` (or `SplitButton`) inside the same page header (`RouteHeader`, `AppHeader`, `WorkspaceHeader`, `MinimalHeader`, `ReaderHeader`, `PageHeader` or a `<header>`: its props such as `actions={…}` and its children). `lg` is the one call to action; give the other actions `md`. Mutually exclusive branches count once; `lg` outside a header is not checked.
  - **`heading-weight`:** warns on `font-semibold` / `font-bold` (≥ 600) on `<h1>`–`<h6>`, `PageTitle`, or heading/display utilities (`text-hero`, `text-title-xl`, `text-tab-xl`, `text-section`), and `font-medium`+ on big `TextTabs` (`text-tab-xl`, weight 400). `text-overline` headings are exempt.
  - **Opt-in allowance (with a reason):** for owner-approved exceptions (e.g. a second brand button or a product-specific brand colour), add `// semi-lint-allow <rule-id>: <reason>` on the same or immediately preceding line, or name the file with a reason under `skip` in `semi-lint.json` (`"skip": { "one-brand-button": { "app/checkout/page.tsx": "owner: dual CTA" } }`). An allowance without a reason is ignored.
- **Emoji as icons (`emoji-icon`):** a brand whose voice allows emoji in copy disables the rule in `semi-lint.json`.

**The baseline only shrinks.** `semi-lint --update-baseline` lowers it to what is left and refuses new hits;
`--accept-new` records them only after a Semi upgrade (`/semi-sync` runs it) or with the user's OK. `semi-lint --ci`
(the app's `.github/workflows/semi.yml`, wired by `/semi-new-app` and `/semi-check`) also fails when the baseline, a
`skip` or a disabled rule grew against the base branch. The edit hook lints `.css` too and flags any edit of
`semi-lint.json` or the baseline.

- **Physical / literal colors (`no-literal-palette`):** Never use neutral / white / black colour classes on any prefix or variant (`bg-white`, `text-slate-900`, `border-b-gray-200`, `divide-zinc-100`, `ring-slate-300`, `from-white`, `dark:bg-slate-800`). Always use Semantic Tokens (`bg-panel`, `bg-field`, `text-strong`, `text-body`, `text-muted`, `border-line`, `divide-divider`).
- **Fixed chromatic text (`no-fixed-tone-text`):** `text-emerald-400`, `text-rose-700 dark:text-rose-300`, `fill-amber-500` cannot pass contrast in both themes: use `text-strong`, `text-*-fg` or `text-tone-<hue>`.
- **Brand scale as a state colour (`accent-state-token`):** `ring-primary-500/50`, `bg-primary-500/15`, `border-primary-500/30` are not themed and vanish for light brands on light surfaces (a yellow ring is ≈ 1.3:1 on white): use `ring-focus`, `border-focus`, `bg-item-selected` / `bg-item-checked`, `border-outline-line`. `/semi-check` rewrites them.
- **Brand scale as a fill or border (`primary-fill`):** `bg-primary-500`, `hover:bg-primary-600`, `border-primary-500`. The `primary-50…900` scale is removed in 1.0. Main actions are `bg-primary hover:bg-primary-hover text-on-primary` (`BTN_PRIMARY`, §0), "on" marks `bg-inverted`, selected borders `border-outline-line`, focused ones `border-focus`; charts use `chart-1…8`. The `/semi-check` codemod rewrites `bg-primary-400…600` to `bg-primary` when the same class list has `text-white` / `text-on-primary`, and reports the rest.
- **Solid pastel surfaces (`no-solid-pastel-surfaces`), arbitrary colours (`hex-colour-class`), literal colours in code (`literal-colour-value`), off-scale sizes (`arbitrary-text-size`).**
- The colour / size rules read class tokens from every string literal (className, `cn()`, constants, template parts, `@apply`), not lines, so any spelling of a colour is caught.
- **Illustrations and data colours** (a device drawing, a 3D scene palette, other companies' logos) are content, not UI chrome: name each file under `skip` in `semi-lint.json` with a reason, for `literal-colour-value`, `inline-svg-path` or `no-literal-palette` only: `"skip": { "literal-colour-value": { "lib/scenePalette.ts": "data colours: 3D scene" } }`. The `/semi-check` audit lists each one ("Minh hoạ / màu dữ liệu") and its codemod leaves them; never a whole folder, never the baseline.
- **Overriding Card component (`card-class-override`):** Never pass any `bg-*` or `shadow-*` (with or without a variant such as `hover:`) to `<Card />`; use `TONAL_CONTAINER` on a plain element for a tinted card.
- Gradients, glow blobs, coloured glow shadows (`shadow-[0_0_…]`), "glassmorphism" panels.
- Solid greys for surfaces (`bg-gray-800/900`), `border-gray-700`, hard-coded hex colour classes (`bg-[#...]`, `text-[#...]`).
- `font-bold` / `extrabold` / `black`, or a heading heavier than 500 (`font-semibold` on a title); `text-[9px]` / `text-[10px]`; `text-xs` / `text-sm`; `uppercase` labels; ALL-CAPS button text.
- Raw or arbitrary radii (`rounded-lg`, `rounded-[10px]`) instead of the shape tokens; `font-mono` for numbers (fine on `<code>`, `<pre>`, `CodeBlock`, `Terminal` and `textarea` / `contentEditable` code editors); coloured icon tiles in front of every card title; one decorative icon colour per card (`decorative-icon-tones`, §19).
- Emoji or unicode pictograms as icons; filled glyphs mixed with stroke icons; stroke 2+; new inline `<svg>` paths.
- Native `<select>`, `type="date"`, `type="number"`, `window.confirm` / `alert`.
- Tokens are named by role, like the large design systems (Material, Carbon, Primer: a type role, a layer), never by
  one component: `text-figure` (was `text-kpi`), `z-sheet` (was `z-keypad`). 1.0 removed the old names; the 0.30.0 and
  1.0.0 migrations rewrite them (`MIGRATION-1.0.md`).
- `AppShell` in a page or in a component a page imports (`app-shell-in-page`); a shell gated behind a page skeleton (`shell-gate`); sidebar routing through `onSelect` + `router.push` instead of item `href` (`shell-nav-href`); `BootLoader` in a page, a `loading.tsx` or shell content (`boot-loader-place`).
- "Đang tải…" text or a page spinner instead of a skeleton (`loading-text`). A step label of a progress bar (`Progress label`, a call with a `fraction` / `value`), text in a `role="status"` / `role="progressbar"` element and a `TaskHost` label are fine.
- A Home button in an app header; subtitles under page titles.
- Coloured nav icons or count badges on nav items (only the nav's bottom-row `tools` carry attention badges); the brand fill anywhere the brand colour rule (§0) does not list; chips or tags with different background colours.
- Narrow `max-w-5xl` page containers that waste horizontal space (a reading page centres at 1536px, §4a) (`narrow-container`; a dialog or drawer with `MODAL_PANEL`, `Modal`, `Drawer` or `role="dialog"` keeps its max width).
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
