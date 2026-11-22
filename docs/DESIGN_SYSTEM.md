# Semi Design System

**This file is the single source of truth for every UI rule of every Semi app** (3D Noobs Studio and the other Semi
products). Rules change **only in the semi repo** (`hoanghuynh296/semi-nextjs-codebase`): update this file,
`QUICK_REF.md` and `DECISIONS.md` in the same commit as the code, extend `lint/semi-lint.mjs` when the rule can be
grepped, then release a new version (see the repo README). Apps never keep their own copy of a rule; agent memory,
skills, AGENTS.md and plan docs only point here. A rule that lives in two places drifts.

Apps read this file from `node_modules/@semi/ui/docs/DESIGN_SYSTEM.md` (the version they installed).

The UI is a **restrained product theme, dark and light,** with a **bento card layout**: neutral page, rounded cards with thin
borders, a neutral icon menu, uniform chips and tags with coloured dots, one accent (the brand's primary colour, Semi green
without a brand kit) for actions, few words. A brand kit (`BRANDS.md`) sets the colours, fonts, voice and allowed styles.

Quick cheatsheet: `QUICK_REF.md`. Tokens: `@semi/ui/tokens.css` (generated from `tokens/tokens.json`). Base layer:
`@semi/ui/base.css`. Shared building blocks: `@semi/ui` (components) and `@semi/ui/styles` (class constants), see §16;
use them instead of re-typing class strings. Lint: `npx semi-lint` (config `semi-lint.json`, also run by the agent edit
hook of the `semi-design` plugin).

## Core principles

- **Few words, icons where they help scanning.** Nav items, actions, statuses and empty states carry an icon; a label,
  a row or a card title does not need one (§19). Minimal text: no subtitle or caption under page titles, no captions
  that repeat what an icon already says.
- **Flat, no glow, no gradients.** No gradient fills, no blurred colour blobs, no coloured `shadow-[0_0_…]` glows
  (buttons, cards, status dots, power buttons). Depth comes from the surface tokens and translucent white overlays
  (plus the style's neutral resting card shadow `shadow-card`: none in Flat, soft in Soft, a hard offset in Sharp);
  emphasis ("on", active, running) comes from a flat accent fill (`bg-accent`), a tint (`bg-accent-subtle`) or a
  `border-accent-line` border.
  The only gradient is the skeleton shimmer sweep in `base.css`.
- **Colour on content, not on chrome.** The nav menu is neutral (grey icons, no count badges; active item =
  `bg-raised text-contrast`). Colour goes where it helps reading the content: a coloured dot or icon on filter chips
  and tags, card icon tiles use their area's soft tint, primary marks the main action and "on". Status colours (§3)
  appear only where they carry a state.
- **Unified sub-page toolbar.** Sub-pages open with a large `font-display` title (text only), followed by a single
  sticky toolbar row: pill filter tabs on the left, the icon-only primary CTA (`BTN_PRIMARY` + `BTN_ICON`) + secondary
  filter/search/refresh controls on the right (§4). All toolbar controls share `h-control` and `text-label font-medium`.
- **Space first, then frames.** Group with white space; put a group in a card (`rounded-card`) when it is one thing
  people act on, and nested facts in tiles. At most three frames inside each other, one line between two things
  (§4c): a screen of boxes in boxes reads as noise.
- **One style per app.** The look is a style (`docs/STYLES.md`): neutral colours, fonts, radii, card border and shadow,
  control sizes. An app picks Flat (default), Soft or Sharp once, with `<html data-style>`, and every component follows.
  Components, layout, the type scale, the accent and status colours are shared by every style.
- **One accent.** `primary-*` (Semi default green `#00AE42`; a product gets its own from its brand kit, see §2b) for actions,
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
| Page title (sub-page) | `font-display text-heading sm:text-display leading-[1.15] font-semibold text-contrast tracking-tight`, text only, no subtitle |
| Section / card title | `text-ui–text-title font-semibold text-contrast tracking-tight` |
| UI / nav text | `text-label font-medium text-body` |
| Label | `text-label font-medium text-muted` (sentence case, never uppercase) |
| Caption | `text-caption–text-label text-muted` |
| Big number (KPI) | `text-heading leading-tight font-semibold tracking-tight tabular-nums text-contrast` |
| Numbers (temperatures, %, times, money, counts) | add `tabular-nums` (Geist, digits line up) |
| Code (code editors, parameter keys, error codes) | `font-mono`, only there |

Geist (`--font-sans` with `font-feature-settings: "ss02" on`) for UI and body text, and Montserrat Alternates
(`--font-display`, class `font-display`) for large page titles, both loaded with `next/font/google` (Latin + Vietnamese
subsets) in `app/layout.tsx` as the CSS variables `--font-geist` / `--font-montserrat-alternates` (or set
`--font-sans-family` / `--font-display-family`). ui-monospace only for code. Numbers stay in Geist with `tabular-nums`:
a monospace font for prices and readings looks like a terminal, not a product. Weights: only `font-medium` and
`font-semibold`. Sizes come from the **type scale** tokens (`--text-*` in `tokens.json`), never `text-[13px]` and never
Tailwind's `text-xs` / `text-sm` / `text-base`:

| Token | px | Use |
|---|---:|---|
| `text-caption` | 11 | captions, counts, badges (minimum size) |
| `text-label` | 12 | field labels, buttons, chips, meta lines (a time, a count beside a title) |
| `text-ui` | 14 (13 in compact density) | body and UI text: card content, table cells, list rows, inputs, card titles |
| `text-ui-lg` | 15 (14 in compact) | phone dialog buttons, a lead paragraph |
| `text-title` | 15 | section / modal titles |
| `text-title-lg` | 16 | large section titles |
| `text-figure` | 18 | Con số nổi bật: giá trị KPI, phím số, tổng tiền (`KpiCard`: `text-figure sm:text-heading`) |
| `text-heading-sm` | 20 | sub-headings |
| `text-heading` | 22 | page titles on phones, KPI figures from sm |
| `text-heading-lg` | 24 | display numbers |
| `text-display` | 26 | page titles from sm (`text-heading sm:text-display`) |

**Fields on a phone:** text you type in is 16px (`text-title-lg`) below `sm`, whatever the field's desktop size. iOS Safari
zooms the page into a focused field under 16px and never zooms back; the fix is the text size, never `maximum-scale` /
`user-scalable=no` in the viewport (it blocks pinch zoom, an a11y failure). `FIELD_INPUT`, `FIELD_TEXTAREA` and every
Semi text-entry control (Input, SearchInput, NumberInput with `FIELD_INPUT`, InputGroup, InputOTP, Textarea, CustomCombobox,
Command, the Chat composer) already do it; a field of your own, or a NumberInput whose caller passes its own `text-ui`,
adds `max-sm:text-title-lg`. `base.css` does the same for a bare
`<input>` / `<textarea>` / `<select>`; the height stays `h-control` / `h-field`.

Minimum `text-caption`. Running text (a sentence, a description, a cell) is `text-ui`, never `text-label` or
`text-caption`: those are for short marks beside it. Every size carries its line height (1.5 for 11–16px, 1.25 for
18px and up), so text never needs `leading-*`; use `leading-tight` only on a title of more than one line. Button and
label text is sentence case ("Lưu", "Xem lại"), never ALL CAPS. Sizes are written in px here and in `tokens.json`
but `tokens.css` emits them in rem (14px = 0.875rem), so text grows with the browser's default font size (WCAG 1.4.4).

## 2. Dual-Theme & Semantic Tokenization (Two-Tier Tokens)

Semi architecture separates tokens into two tiers:
- **Tier 1 (Primitives & Brand):** Fixed raw hex palettes (`primary-*`, `emerald-*`, `gray-*`, `rose-*`, `amber-*`, `sky-*`) defined in `tokens/tokens.json`.
- **Tier 2 (Semantic Tokens):** Dynamic CSS variables that automatically adapt according to the active theme (`data-theme="dark"` or `data-theme="light"`). Developers build UI exclusively with Semantic Tokens (`bg-panel`, `bg-field`, `text-contrast`, `text-body`, `text-muted`, `border-line`), eliminating hard-coded physical colors and manual `dark:bg-...` / `light:bg-...` conditional classes.

### Semantic Tokens Mapping Table

| Semantic Token | Tailwind Utility | Purpose | Dark Mode (`[data-theme="dark"]`) | Light Mode (`[data-theme="light"]`) |
|---|---|---|---|---|
| `--color-canvas` | `bg-canvas` | Nền ứng dụng ngoài cùng (outer bento shell) | `#0c0d0e` | `#f1f5f9` (Slate-100) |
| `--color-app` | `bg-app` | Khung bề mặt màn hình chính (content panel) | `#121316` | `#ffffff` |
| `--color-panel` | `bg-panel` | Thẻ Bento Card, Sidebar, Modal shell | `#202226` | `#ffffff` |
| `--color-field` | `bg-field` | Nền ô nhập liệu, header bảng | `#272a2f` | `#f1f5f9` (Slate-100) |
| `--color-raised` | `bg-raised` | Hover / track fills trên nền field hoặc panel | `#31343a` | `#e2e8f0` (Slate-200) |
| `--color-text-contrast` | `text-contrast` | Tiêu đề, chữ độ tương phản cao | `#ffffff` | `#0f172a` (Slate-900) |
| `--color-text-body` | `text-body` | Nội dung văn bản chính | `#d1d5db` (Gray-300) | `#334155` (Slate-700) |
| `--color-text-muted` | `text-muted` | Nhãn phụ, placeholder, gợi ý | `#9ba1aa` | `#5b6779` |
| `--color-line` | `border-line` | Đường viền card, bảng, khung | `rgba(255, 255, 255, 0.12)` | `rgba(0, 0, 0, 0.08)` (Slate-200) |
| `--color-line-hover` | `border-line-hover` | Đường viền khi hover | `rgba(255, 255, 255, 0.2)` | `rgba(0, 0, 0, 0.16)` |
| `--color-control-line` | `border-control-line` | Viền ô nhập liệu, select field, checkbox, radio (≥ 3:1 trên mọi surface, WCAG 1.4.11). Card, bảng vẫn dùng `line` | `text-muted` 65% | `text-muted` 80% |
| `--color-control-line-hover` | `hover:border-control-line-hover` | Hover của `control-line` | = `text-muted` | = `text-muted` |
| `--color-divider` | `border-divider` | Đường phân cách nhẹ giữa các hàng | `rgba(255, 255, 255, 0.05)` | `rgba(0, 0, 0, 0.05)` (Slate-100) |
| `--color-accent` | `bg-accent` | Nền nút chính / mark "on" (BTN_PRIMARY, headerPrimary) | `primary-500` | `primary-700` |
| `--color-accent-hover` | `hover:bg-accent-hover` | Hover của nền accent | `primary-400` | `primary-800` |
| `--color-on-accent` | `text-on-accent` | Chữ / icon trên `bg-accent` (≥ 4.5:1) | `#0c0d0e` | `#ffffff` |
| `--color-accent-fg` | `text-accent-fg` | Chữ / icon màu primary trên surface (link, check, tab active) | `primary-400` | `primary-700` |
| `--color-focus` | `ring-focus`, `border-focus` | Viền focus (`FOCUS_RING`), viền ô nhập đang gõ (≥ 3:1 trên mọi surface) | = `accent-fg` | = `accent-fg` |
| `--color-accent-subtle` | `bg-accent-subtle` | Nền nhạt của mục đang chọn (option, trang hiện tại, pill active, IconTile) | `accent-fg` 14% | `accent-fg` 11% |
| `--color-accent-subtle-hover` | `hover:bg-accent-subtle-hover` | Hover của nền nhạt accent | `accent-fg` 22% | `accent-fg` 18% |
| `--color-accent-line` | `border-accent-line` | Viền của mục đang chọn (card được chọn, ngày hôm nay) | `accent-fg` 40% | `accent-fg` 40% |
| `--color-danger-fg` · `success-fg` · `warning-fg` · `info-fg` | `text-danger-fg` … | Chữ trạng thái trên surface | `rose/emerald/amber/sky-400` | `-700` (`warning`: `amber-800`, ≥ 4.5:1 cả trên ô nhập Soft / Sharp) |
| `--color-tone-<hue>` | `text-tone-<hue>` | Chữ tonal 12 hue (purple, violet, indigo, blue, sky, cyan, teal, emerald, amber, orange, rose, pink) | `<hue>-300` | `<hue>-700` |

Mọi cặp chữ / nền ở trên đạt WCAG AA (≥ 4.5:1) ở cả hai theme. Không viết `text-*-400` hay `text-*-700 dark:text-*-300` trong component: dùng `text-accent-fg`, `text-*-fg` hoặc `text-tone-*`.
Trạng thái (focus, chọn, hover) không dùng thang `primary-*` với alpha (`ring-primary-500/50`, `bg-primary-500/15`): thang đó
không đổi theo theme nên biến mất với brand sáng trên nền sáng (`accent-state-token`). Nền và viền đặc cũng vậy
(`bg-primary-500`, `border-primary-500`): màu thương hiệu chỉ nằm ở một sắc độ của thang (vàng ở `200`, navy ở `900`),
nên `primary-500` có thể nhạt hay lệch hẳn; nền nút / mark "on" là `bg-accent` + `text-on-accent` (`primary-fill`).
Thang `primary-*` chỉ dùng cho biểu đồ và hình minh hoạ. Brand: dùng brand kit
(`docs/BRANDS.md`); bộ sinh màu đặt `accent`, `on-accent`, `accent-fg` cho từng theme, các token trạng thái đi theo `accent-fg`.

**Cách sinh CSS:** giá trị theo theme nằm ở biến nguồn `--semi-*` (đặt trong `:root/[data-theme=dark]` và `[data-theme=light]`); utility đọc qua `@theme inline` (`bg-panel` → `var(--semi-panel)`), còn `--color-*` được khai báo lại ở mỗi theme scope cho CSS của app (`var(--color-panel)`).

### Status, overlay, elevation and layers

| Need | Tokens |
|---|---|
| Status callout / badge / danger button | `bg-{danger,success,warning,info}-bg` + `border-*-border` + `text-*-fg` (`Alert`, `BTN_DANGER`) |
| Status dot, progress fill, destructive solid | `bg-*-solid` (+ `text-on-solid`) |
| Backdrop of modal / drawer / dialog | `bg-overlay` (themed scrim) — or `OVERLAY` |
| Floating layer (modal, popover, menu, toast, tooltip) | `shadow-overlay` |
| Controls floating over a canvas | `shadow-float` |
| Global stacking | `z-sticky` 30 < `z-drawer` 40 < `z-modal` 50 < `z-dialog` 60 < `z-sheet` 70 < `z-popover` 80 < `z-toast` 90 < `z-tooltip` 95 |

Surfaces stay flat: no `shadow-sm/md` on cards; a resting card shadow is `shadow-card` only (already in `CARD`, `HERO`,
`SHELL_ASIDE`), whose value comes from the style. Local stacking inside one component keeps `z-10` / `z-20`; anything
that covers the page uses a layer token, never `z-[9999]`. Easing: `ease-out-soft` (entering), `ease-in-soft` (leaving).

### Theme Switching Mechanism

Themes are toggled via the `data-theme` attribute on `<html>` (with fallback `.dark` / `.light` classes):
```html
<html lang="vi" data-theme="dark" class="dark">
```
`data-theme="system"` follows the OS in pure CSS (no JS). Users pick a theme with `<ThemeSwitcher />` (Sáng · Tối · Hệ thống: settings pages, sidebar footer; `fullWidth` in a sidebar) or flip it with `<ThemeToggle />` (collapsed sidebar, header). Any element can pin a theme for its subtree with `data-theme="light|dark"` (plus the matching class): all semantic tokens re-resolve inside it. Apps render `<ThemeScript />` in `<head>` (sets the stored theme
before the first paint, so there is no flash of the wrong theme) and wrap the body in `<ThemeProvider>` with the **same options**:
```tsx
import { ThemeProvider, ThemeScript, ThemeToggle } from "@semi/ui";

export default function RootLayout({ children }) {
  return (
    <html lang="vi" data-theme="dark" className="dark" suppressHydrationWarning>
      <head>
        <ThemeScript defaultTheme="dark" />
      </head>
      <body className="bg-app text-body">
        <ThemeProvider defaultTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Why Physical Colors Are Prohibited
Hardcoding physical palette classes such as `bg-white`, `text-slate-900`, `border-slate-200`, or `bg-slate-50` creates the "Dark Shell, Light Core" conflict:
- In Dark Mode, a card with `bg-white` creates a blinding white rectangle inside a dark Bento frame.
- In Light Mode, text with `text-white` disappears completely on the white page background.
By using `bg-panel` and `text-contrast`, your UI seamlessly flips from dark obsidian to crisp slate without writing a single media query.

## 2b. Brand per product

A product's brand comes from its **brand kit** (`docs/BRANDS.md`), never from its own CSS: the kit's `dist/brand.css`
(imported after `@semi/ui/tokens.css`) sets the primary / secondary scales, the themed accent tokens, the neutrals per
style and the fonts. With
`"brand"` in `semi-lint.json`, the app may not set any of them (`brand-override`: `--color-primary-*`, `--semi-*`,
`--brand-*`, `--spacing`, `--density-spacing`, the font variables). Density and type scale are the product's own
choice, not the brand's (§19). An app without a kit uses Semi's own green and Flat. A brand change is
made in the brand repo (`/semi-brand`) and reaches products with `/semi-sync`.

## 3. Colour meaning

- **Accent** (the brand's primary; Semi default `#00AE42`): the main action, focus ring, "on" and selection, through
  `bg-accent` + `text-on-accent` (`BTN_PRIMARY`), `bg-accent-hover`, `text-accent-fg`, `bg-accent-subtle`,
  `border-accent-line`, `ring-focus`. Never `primary-*` shades or `primary-N/alpha` in an app.
- **Status** carries meaning only, never decoration or an accent: success (online, ready, done), warning (busy,
  paused, connecting), danger (error, destructive), info (neutral news, cost). Tokens `bg-*-bg` + `border-*-border` +
  `text-*-fg`, `bg-*-solid` for a dot or a fill (table in §2); `<Alert tone>`, `<Badge tone>`, `StatusDot`.
- **Tile tones** (`TILE_TONES` in `Icon.tsx`: a soft tint + `text-tone-*`; `TONE_TEXT` for a bare icon): green ·
  pink · sky · amber · violet (indigo) · gray (advanced / unknown). Each app maps its areas to tones once (in its own
  extension doc) and keeps the mapping everywhere. The nav menu uses neutral `w-4 h-4` (16px) icons in `text-muted`;
  the active item is drawn by `AppShell`.
- **Chips and tags** (`Chip.tsx`) share one pill style (`rounded-full h-control px-3.5 text-label font-medium`):
  `chipClass(active)` gives borderless ghost pills when off (`bg-transparent text-muted hover:text-contrast
  hover:bg-field`) and a raised pill when on (`bg-raised border-line text-contrast`); static tags use `TAG`
  (neutral). Per-item colour appears only on a leading dot (`TONE_DOT`) or icon (`chipIconClass(tone)`). The chosen
  segment of `Pills`, `Toggle` and pill `Tabs` is `SEGMENT_ON`.
- Data series in charts may use several hues; that is the one place extra colours belong. Syntax colours in code
  views are the other exception.

## 3b. Tinted cards, callouts & alert banners (Alpha-transparency over solid pastels)

**Never use solid pastel surface classes** (such as `bg-purple-50`, `bg-sky-50`, `bg-amber-50`, `border-amber-200`, `border-purple-200`) on cards or containers.
In `data-theme="dark"`, solid pastels have luminance > 95% and turn into glaring white/neon rectangular slabs that ruin the dark interface.

Instead, follow the canonical Semi patterns:
1. **Categorized / Feature Cards:**
   Keep the card shell neutral (`<Card>`, or `bg-panel border-line`) and express the category on the icon tile:
   ```tsx
   <Card>
     <div className="flex items-center gap-2">
       <span className={cn("p-1.5 rounded-control", TILE_TONES.violet)}>
         <Icon name="plug" className="w-4 h-4" />
       </span>
       <span className="text-ui font-semibold text-contrast">{title}</span>
     </div>
     <p className="text-label text-muted mt-1">{description}</p>
   </Card>
   ```
2. **Callout / Alert Banners:**
   When an inline banner or callout needs a chromatic tint (info, warning, success, danger), use `<Alert tone>` or the
   themed status surface tokens, which are tinted fills and borders tuned for AA text in both themes:
   ```tsx
   {/* Warning callout */}
   <div className="flex items-center gap-2 px-3 py-2.5 rounded-control bg-warning-bg text-warning-fg border border-warning-border text-label">
     <Icon name="alertTriangle" className="w-4 h-4 shrink-0" />
     <span>{warningMessage}</span>
   </div>
   ```
   *Why tokens:* the tint blends onto the panel in both themes, and `text-*-fg` is the shade that reaches 4.5:1 on it in each theme; a fixed `text-amber-600 dark:text-amber-400` pair cannot be checked and breaks under a brand or style.

## 3c. Universal Theme-Matching Tonal Architecture (All Components)

When migrating existing applications, UI elements across the interface often carry identifying chromatic colors:
- **Tonal Bento Cards & Stat Widgets** (e.g., purple analytics card, blue billing summary)
- **Alert Banners & Callouts** (e.g., amber warning banner, emerald success alert)
- **Table Rows & List Items** (e.g., highlighted pending order row)
- **Interactive Buttons & Pills** (e.g., soft green action button, violet pill)
- **Badges, Chips & Status Tags** (e.g., `<Badge tone="purple">`, `<Chip tone="emerald">`)

**Semi does not strip these colors down to monotonous gray.** Nor does it leave light-mode pastels (`bg-*-50`, `border-*-200`) that turn into glaring white/light boxes in Dark Mode.

Instead, Semi keeps each colour on a **themed tone**: a translucent tint that blends onto the surface in both themes,
and a text colour (`text-tone-<color>`, `text-*-fg`) whose value changes per theme so it reaches 4.5:1 on that tint.
Never a fixed shade (`text-purple-700`, `text-amber-400`) and never a `dark:` pair: the pair cannot be checked, and it
breaks under a brand kit or a style (`no-fixed-tone-text`, hard rule 10).

| Need | Use | What it gives |
|---|---|---|
| A status (error, success, warning, info) | `bg-*-bg border-*-border text-*-fg`, or `<Alert tone>` / `<Badge tone>` | Meaning, tuned for AA in both themes |
| A category tint (card, tile, tag) | `TONAL_SURFACE[tone]` (= `TONAL_CONTAINER`), `<Badge tone>`, `TILE_TONES` | `bg-<color>-500/10 border-<color>-500/20 text-tone-<color>` |
| Its hover | `TONAL_HOVER[tone]` | `hover:bg-<color>-500/15 hover:border-<color>-500/30` |
| Coloured text or icon alone | `text-tone-<color>` (`TONE_TEXT`), `text-*-fg` for a status | Themed shade, 4.5:1 on panel |
| A highlighted row | `bg-accent-subtle` (selected), a status `bg-*-bg` (a row that needs attention) | No hue picked per row |

### Examples Across Component Types

#### 1. Tonal card / stat widget
```tsx
// Before (light mode only):
<div className="rounded-card border border-purple-200 bg-purple-50 p-4 text-purple-900 hover:bg-purple-100">
  <p className="text-sm font-semibold">Pro Subscription</p>
</div>

// After:
<div className={cn("rounded-card border p-card", TONAL_SURFACE.purple, TONAL_HOVER.purple)}>
  <p className="text-ui-lg font-semibold">Pro Subscription</p>
</div>
```

#### 2. Alert banner / callout
```tsx
// Before:
<div className="rounded-control border border-amber-200 bg-amber-50 p-3 text-amber-800">Your license expires soon.</div>

// After:
<Alert tone="warning">Your license expires soon.</Alert>
// or, hand-made: rounded-control border border-warning-border bg-warning-bg px-3 py-2 text-warning-fg
```

#### 3. Highlighted table row
```tsx
// Before:
<tr className="bg-blue-50 border-b border-blue-100 text-blue-700">…</tr>

// After: the row stays neutral; the status sits on its badge, a selected row takes the accent tint.
<TR className={selected ? "bg-accent-subtle" : undefined}>… <TD><Badge tone="sky">Chờ duyệt</Badge></TD></TR>
```

#### 4. Badges & chips
```tsx
// Before:
<span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300">Urgent</span>

// After:
<Badge tone="rose">Urgent</Badge>
```

### Standard Palette Tones (`SemanticTone`)
Available in `@semi/ui` via `<Badge tone="...">`, `<Chip tone="...">` and in `@semi/ui/styles` via `TONAL_CONTAINER`, `TONAL_HOVER`, `TONAL_SURFACE`:
- `purple`, `violet`, `indigo`
- `blue`, `sky`, `cyan`, `teal`
- `emerald`, `green`
- `amber`, `yellow`, `orange`
- `rose`, `red`, `pink`
- `gray` (neutral fallback)

## 4. Layout

- **Radius scale (style tokens):** tiny marks (checkbox, colour swatch, key cap, inline code) `rounded-chip` · controls,
  inputs, buttons, inner tiles and list rows `rounded-control` · cards, popovers, menus, toasts `rounded-card` · panels,
  hero, modals, drawers, sidebar `rounded-panel` · filter chips, pills, avatars, badges, dots `rounded-full`. Values per
  style (Flat 4 · 8 · 12 · 16px, Soft 6 · 12 · 20 · 24px, Sharp 2 · 0 · 0 · 0): `docs/STYLES.md`. Never the raw scale (`rounded`,
  `rounded-lg/xl/2xl`) or `rounded-[Npx]`: they would not follow the style (`radius-token`).
- **Control height:** all toolbar buttons, filter chips, pills, search inputs, custom selects and date pickers use
  `h-control` (34px in Flat, set by the style) and `text-label font-medium` so toolbar rows align evenly. Form inputs and
  selects use `h-field` (36px in Flat). Never `h-[34px]`: it would not follow the style.
- **Spacing (semantic tokens, scaled by density):** pick by role, not by number. They come from `tokens.json` "space"
  and multiply the density unit, so a compact product gets 90% and an airy one 115% without any change in code:

  | Utility | Regular | Use |
  |---|---:|---|
  | `p-card` | 16px | inside a card, popover, list panel, side panel section (`<Card>` sets it by default) |
  | `sm:p-panel` | 24px | hero, page panel, a roomy card from `sm` (`p-card sm:p-panel`) |
  | `gap-stack` | 12px | between items inside a card or a form |
  | `gap-group` | 16px | between cards in a grid or a list of cards |
  | `gap-section` | 24px | between sections of a page |

  Smaller steps (`gap-1`–`gap-2`, `px-2`, `py-1`) are for the inside of one control (an icon and its label, a chip):
  never the padding of a row or a box. A card or panel is never tighter than `p-card` (`card-padding`), a list row
  never shorter than a control (`Item` is `px-4 py-3`): a cramped box with text against its edges is the most common
  layout bug. The budgets are in §4c.
- **Home shell (`md+`):** two inset `rounded-panel` panels inside a `bg-canvas` frame (`md:p-2 md:gap-2`): a collapsible
  left **Panel Menu** (`w-52`, or `w-14` collapsed, toggled via the `sidebar` icon button) and a right **Panel
  Content** (`bg-app`) holding a full-width content container (`max-w-[1440px] px-4 sm:px-6`). Phones (`< md`) use a
  bottom tab bar with the same tabs (icons `w-5 h-5`).
- **Shell lifecycle:** `AppShell` renders once in the root or a route-group `layout.tsx`, so it stays mounted while
  people navigate; a page renders only its content, never `AppShell` or a component that renders it
  (`app-shell-in-page`). Page items carry `href` and stay `next/link` links even when `onSelect` is set (`onSelect`
  then only reports the click); never route with `onSelect` + `router.push` (`shell-nav-href`). The session check runs
  once, in the layout (best on the server), never per page; loading is §13b.
- **Sub-menus:** a nav item may carry one level of sub-items (`children`: mailbox folders, saved views). They are
  **closed by default** and open under their parent only while the parent or one of its sub-items is active; choosing
  another item closes them (no manual toggle, no state to remember). Sub-items are indented on a thin
  `border-divider` guide, `h-7`, with an optional grey `w-3.5` icon (all sub-items of a parent get one, or none): no
  colour dot, no count (the menu stays neutral; counts and colours live in the page). The parent shows a chevron and keeps `text-contrast` while a sub-item holds the active fill. The `w-14` rail,
  widths below `lg` and phones never show sub-items: pages read `useAppShell().submenuVisible` and offer the same choice
  in their toolbar (a `CustomSelect`) when it is false.
- **Title and toolbar: two layouts, pick one per page.** (a) Title on its own row, toolbar below (`PageTitle` +
  `SubpageToolbar`), for pages with many filters. (b) Title on the toolbar row (`SubpageToolbar title="…"`, no
  `PageTitle`), for pages whose few filters and actions fit beside the title: the content starts higher. In (b) the
  title is still the page `h1` in display type and text only; filters follow it, actions sit at the right end; narrow
  screens wrap filters and actions below the title. Text buttons stay in the toolbar's `right` slot in both layouts.
- Each sub-page opens with a large display title (text only), followed by the toolbar row (or sharing it, above): pill filter tabs
  (`CHIP_BASE` + `chipClass(active)`) on the left, icon-only primary CTA + secondary controls on the right. The row
  carries `STICKY_TOOLBAR` so the filters stay on top of the scrolling content (below the safe area on phones).
  "Thêm …" and "Làm mới" buttons are icon-only (`BTN_PRIMARY`/`BTN_SECONDARY` + `BTN_ICON`, `RefreshButton`) with
  `title` + `aria-label` carrying the label.
- Grids expand across wide screens (e.g. `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-group`); touch screens
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
  icon), sections `p-3 sm:p-3.5 border-b border-divider`, labels `text-label font-medium text-muted`, rarely used
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
| At most three colours in one box (accent and status; greys do not count) | `colour-noise` | neutral icons, a tone only where it means a state (§3) |
| One filled accent button per view (page, dialog, form) | `primary-actions` | `Button` (secondary) or `ghost` for the rest |
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

## 5. Card

`<Card>` (`@semi/ui`) wraps the same classes and pads itself (`padding`: `"card"` = `p-card` by default, `"panel"` =
`p-card sm:p-panel`, `"none"` for media that runs to the edge; a `p-*` in `className` replaces it): `<Card>`, `<Card interactive>` (CARD_HOVER), `<Card active>`
(CARD_ACTIVE). It owns its surface: pass padding / layout only, never `bg-*` or `shadow-*`. With `onClick` it is a
button for keyboards and screen readers too (`role="button"`, in the tab order, Enter / Space, `FOCUS_RING`; `active`
becomes `aria-pressed`): a selectable tile is `<Card onClick active>`, never a `<div onClick>` (`click-target`).

```tsx
import { CARD, CARD_HOVER, CARD_ACTIVE } from "@semi/ui/styles";

<div className={`${CARD} p-card flex flex-col gap-stack`}>…</div>          // static
<button className={`${CARD_HOVER} p-card text-left`}>…</button>         // opens something
<div className={`${CARD} ${CARD_ACTIVE} p-card`}>…</div>                // active / "on" / running: primary border, no glow
```

Card header row: `IconTile` (or the item's image) · name (`text-ui-lg font-semibold`) + caption · icon actions
(`ICON_BTN`, `ICON_BTN_DANGER`) on the right.

## 6. Hero card

`HERO` (`rounded-panel p-card sm:p-panel`): a plain panel for the top block of a page. No glow blob.

## 7. Icon tile

`<IconTile name="box" tone="green" size="sm|md|lg" />`: rounded square with a soft tint of the area's tone.
`sm` 28px (list rows) · `md` 36px (card headers) · `lg` 44px (dialogs, empty states). Nav items use a grey `w-4 h-4`
icon in a `h-8` row; the active item uses a neutral raised fill (`bg-raised text-contrast`). Dashboard quick feature
tiles use `w-11 h-11 rounded-card` with their area's `TILE_TONES`.

## 8. Section heading

```tsx
<div className={SECTION_HEAD}>
  <h2 className={SECTION_TITLE}>Thiết bị</h2>
  <span className={COUNT_PILL}>3</span>
  <button className={SECTION_LINK}>Quản lý <Icon name="chevron" className="w-3.5 h-3.5" /></button>
</div>
```

## 9. Buttons

`BTN_PRIMARY` / `BTN_SECONDARY` / `BTN_DANGER` from `@semi/ui/styles` (`rounded-control`, `h-control`,
`text-label font-medium`, flat). Icon-only: add `BTN_ICON`, or `ICON_BTN` (`w-7 h-7 rounded-control`) inside cards. Big
state toggles (power) are round: `w-20 h-20 sm:w-24 sm:h-24 rounded-full`, flat `bg-accent text-on-accent` when on,
`bg-field` when off. A running action shows a spinner inside its own button only.

## 10. Pills, chips, badges

- Single choice: `Pills` (`h-control rounded-control` track, active = `SEGMENT_ON`).
- Sub-page filter tabs / chips: `Chip` (see §3 Chips). Static labels: `TAG`.
- Filter chips may carry an icon and a count: icon `w-3.5 h-3.5` + label + `COUNT_PILL`.
- Status pill: `STATUS_PILL` + `bg-*-bg text-*-fg` (danger, success, warning, info) with a status dot (§11), or `<Badge tone>`.
- Tag / meta chip: `TAG` (`h-6 px-2 rounded-full bg-field border-line text-caption text-muted`) with an icon.

## 11. Status dot

Flat dot next to state text, no glow: online `bg-success-solid`, running `bg-accent animate-pulse`,
busy/paused/connecting `bg-warning-solid`, error `bg-danger-solid`, offline `bg-muted`. Use `STATUS_DOT`.
Size `w-2 h-2` (`w-1.5 h-1.5` inline in a caption).

## 12. Tiles & readings

Nested facts (readings, KPIs, sensor values) sit in `TILE` (`rounded-control bg-field border border-line`)
with an icon above or before a `tabular-nums` value. Progress is a ring or a `h-1.5 rounded-full` bar in
`bg-accent` on `bg-raised` (`Progress`).

## 13. Empty state

`EMPTY`: dashed `rounded-card` card with an icon in a `w-12 h-12 rounded-card bg-field` square above one short
line. Make it the button that adds the first item when there is one.

`EmptyState` has two variants (D14): **`first-use`** (nothing exists yet): one icon, one sentence (the title, no
description), and the one primary action that fills the list. **`no-results`** (a search or filter matched nothing):
its own title ("Không có kết quả"), a hint, and `onClearFilters` for a secondary "Xoá lọc" button; keep the title and
toolbar on screen around it. When an empty list shows its own primary action, hide the primary button in the page's
title row while the list is empty, so the view has one filled button (`primary-actions` in `semi density` catches two).
Below `sm` the state is compact and takes at most 40% of the viewport (`EMPTY_PHONE_CAP`, P13).

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
`role="status"` / `aria-busy`; its `label` is for screen readers only). The sweep is the `.shimmer` class in
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
Another exception: a list a form field fetches by itself in the background shows one small `role="status"` line under that
field while it loads: a `w-3 h-3` spinner + "Đang tải …" in `text-label text-muted` (the text sits in the
`role="status"` element, which the lint allows), gone when done; a failed fetch stays silent.

## 14. Modal & dialog

`MODAL_BACKDROP` (`bg-overlay backdrop-blur-lg`) + `MODAL_PANEL` (`bg-panel border-line`): full screen on phones
(`max-sm:h-dvh max-sm:rounded-none max-sm:border-0`, edge-to-edge), a centred `rounded-panel` dialog from `sm` up.
The panel caps itself at `92dvh` and scrolls; pass only a width (`max-w-md`…) and, for a fixed header / footer,
`flex flex-col` with a `flex-1 overflow-y-auto` body. `MODAL_HEAD` / `MODAL_TITLE` / `MODAL_FOOT`: header = `IconTile`
+ title + close `MODAL_CLOSE`; footer buttons right-aligned, stretched on a phone. Buttons are `MODAL_BTN_*`.
Every overlay (modals, full-screen viewers, popups, numpad) uses this backdrop. Big detail views split into two columns
from `md` (iPad). Confirmations go through `confirmDialog()` (mount `<ConfirmHost />` once in the root layout), never
`window.confirm`. Phones can use a bottom sheet for pickers and filter panels.

**Links to other sites** always use `ExternalLink` (new tab, `rel="noopener noreferrer"`). Apps inside a native
WebView pass an `onClick` that opens the URL outside. Never a bare `<a target="_blank">` to another site.

**AI text** is rendered with `Markdown` (light markdown: paragraphs, headings as bold lines, lists, bold, code,
links), never raw. AI conversations use the chat parts below (§14b), never an app's own composer or bubbles.

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
  set up" + settings button) > `ChatList` + `ChatComposer`. Messages: `UserMessage` (right, accent tint; `failed`
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
| `@semi/ui` → `AppShell.tsx`, `MobileTabBar.tsx` | `AppShell` (floating Bento 2-panel frame, collapsible `w-52`/`w-14` menu, one level of sub-items), `useAppShell` (is the sidebar showing sub-items), `MobileTabBar`, `TAB_BAR_PAD` (§4) |
| `PageTitle.tsx`, `SubpageToolbar.tsx` | `PageTitle`, `PageTabsTitle` (underline display tabs), `SubpageToolbar` (`STICKY_TOOLBAR` + icon-only CTA + search + refresh) (§4a) |
| `KpiCard.tsx`, `Modal.tsx` | `KpiCard` (metric card in the brand's figure font, neutral icon, `featured` for the screen's main number, shimmer), `Modal` (shared portal dialog with `MODAL_HEAD` + `MODAL_FOOT`) (§13, §14) |
| `Icon.tsx` | `Icon`, `ICONS`, `IconName`, `IconTile`, `TILE_TONES`, `TONE_TEXT`, `TileTone` |
| `AppHeader.tsx` | `AppHeader` (stand-alone app top bar, §4b) |
| `PageActions.tsx` | `PageActions` (a tab's header buttons), `PageActionsSlot` + `PageActionsProvider` |
| `Skeleton.tsx` | `Skeleton`, `SkeletonCard`, `SkeletonGrid`, `SkeletonRows`, `PageSkeleton` (`shape` cards / list / detail), `Loading`, `BootLoader` (boot / session gate only) (§13b) |
| `Feedback.tsx`, `States.tsx` | `EmptyState` (`variant` first-use / no-results, `onClearFilters`), `ErrorState`, `NotFound`, `Forbidden` (§13, §13c) |
| `FileDrop.tsx` | `FileDrop`, `FileDropItem`, `FileRejection`, `matchesAccept`, `formatFileSize`, `classifyFiles`, `FileRejectReason` (§13b uploads: `FileDrop` + `Progress`) |
| `confirmDialog.tsx` | `confirmDialog()`, `ConfirmHost`, `ConfirmOptions` (§14) |
| `TaskHost.tsx` | `startTask()`, `TaskHost`, `TaskOptions`, `TaskHandle` (blocking task overlay, §13b) |
| `ThemeProvider.tsx` | `ThemeProvider`, `useTheme`, `ThemeToggle` (§2) |
| `Markdown.tsx` | `Markdown` (AI answers) |
| `Chat.tsx` | `AIChat`, `ChatPanel`, `ChatView`, `ChatList`, `ChatComposer`, `UserMessage`, `AssistantMessage`, `ChatAnswer`, `ChatError`, `ChatThinking`, `ChatIntro`, `ChatSuggestion(s)`, `ChatAvatar`, `ChatCopyButton`, `ChatModelPicker`, `CHAT_ROW`, `CHAT_CHIP`, `CHAT_PICK_CHIP`, `ChatItem` (§14b) |
| `ExternalLink.tsx` | `ExternalLink` |
| `Pills.tsx`, `Chip.tsx` | single choice / on-off chips (`Chip`, `CHIP_BASE`, `chipClass`, `chipIconClass`, `TAG`, `TONE_DOT`) |
| `SearchInput`, `CustomSelect`, `CustomCombobox`, `DatePicker`, `Pagination` | toolbar and form inputs |
| `NumberInput` (+ `NumPadPopup`, `useCoarsePointer`) | every number field (app numpad on touch screens) |
| `SidePanel`, `SidePanelToggle`, `RefreshButton` | tool-app left panel, icon-only reload action |
| Hooks (`Field.tsx`, `a11y.ts`, `floating.ts`) | `useField` (a custom control reads its `Field`: id, `aria-describedby`, invalid), `useDialog` (focus trap + scroll lock + Escape for a modal-like surface; built on `useFocusTrap` and `useScrollLock`), `useBackdropClose` (a backdrop that wraps its panel closes only on a click that starts and ends on it), `useAnchoredPosition` (fixed menu / tooltip next to its trigger, flips above, never clipped), `useCoarsePointer`, `useTheme` |
| `@semi/ui/styles` → `surfaces.ts` | `SHELL_*`, `CARD`, `CARD_HOVER`, `CARD_ACTIVE`, `HERO`, `TILE`, `SECTION_*`, `COUNT_PILL`, `EMPTY`, `ICON_BTN` / `ICON_BTN_DANGER`, `STATUS_PILL`, `STATUS_DOT`, `STICKY_TOOLBAR`, `MODAL_*`, `FIELD_LABEL`, `FIELD_INPUT`, `FIELD_TEXTAREA` |
| `buttons.ts` | `BTN_PRIMARY`, `BTN_SECONDARY`, `BTN_DANGER`, `BTN_ICON`, `MODAL_BTN_*` |
| `appChrome.ts` | `HEADER_ICON_*`, `headerPrimary`, `HEADER_PILL`, `VIEWPORT_*` |

Components are client components (`"use client"`), shipped as TypeScript source: the app adds
`transpilePackages: ["@semi/ui"]` to `next.config.*` and `@source` lines for `src` and `styles` to its CSS (README).

A component used by **two or more Semi apps** belongs here; open a change in the semi repo instead of copying it.

## Form fields

Wrap every control in `<Field label hint error required>`: it renders the label (`FIELD_LABEL`), links the hint / error
with `aria-describedby`, sets `aria-invalid` and announces the error (`role="alert"`). `Input`, `Textarea`,
`NumberInput`, `CustomSelect` (`variant="field"`) and `CustomCombobox` read the Field automatically:

```tsx
<Field label="Tên máy in" hint="Hiện trên thẻ." error={errors.name} required>
  <Input value={name} onChange={(e) => setName(e.target.value)} icon="printer" />
</Field>
```

Input surface: `FIELD_INPUT` (`bg-field border border-control-line hover:border-control-line-hover rounded-control px-3 h-field
text-ui … focus:border-focus`); invalid adds `border-danger-fg` (`danger-border` is too faint for an input's edge). Never `focus:outline-none` without a visible focus
border. Choices: `Checkbox` (with `indeterminate`), `Switch` (settings that apply at once), `RadioGroup` (2–5 exclusive
options; more → `CustomSelect`). A `Switch` or `Checkbox` without a visible `label` (on a card whose title names it, a
table row) gets `aria-labelledby` (the title's id) or `aria-label`; `label` wins, and in development an unnamed one logs
a warning. Both get `HIT_AREA`: a 24 × 24 px click area (44 × 44 px on touch screens) from a pseudo-element, so the
visible size (`size="sm" | "md"`) and the layout stay the same.

## 17. Primitives (`@semi/ui`)

| Need | Use |
|---|---|
| Any action | `Button` (`variant` primary / secondary / danger / ghost, `size` md / sm / modal, `icon`, `iconOnly` + `aria-label`, `loading`); `Spinner` only inside a button or field running its own action, never for a page) |
| Overflow actions of a row / card | `Menu` (icon-only "more" trigger; `danger` item last) |
| Hint for an icon-only control | `Tooltip` (never essential text: touch screens do not show it) |
| Feedback after an action | `toast({ title, tone, action })` + `<ToastHost />` in the layout (`label` when a page section is also called "Thông báo") |
| A job the user must wait for | `startTask({ label, onCancel, timer })` + `<TaskHost />` in the layout |
| Persistent message in a page | `Alert` (tone, title, action, `onDismiss`) |
| Secondary task beside the page | `Drawer` (right / left / bottom / top sheet) |
| Sections of one record | `Tabs` (underline; `segmented` inside a toolbar); 2–4 sibling pages → `PageTabsTitle` |
| Compared rows | `Table` + `THead` / `TBody` / `TR` / `TH` / `TD numeric`; cells stay on one line and the table scrolls sideways on phones (`TD wrap` for a long-text column); entity overviews stay Bento `Card`s |
| Progress / quota | `Progress` (determinate or indeterminate) |
| Choose or drop files, per-file upload progress | `FileDrop` (controlled `items`; `onAdd` accepted files, `onReject` (type, size, directory, duplicate, multiple), `onRemove`, `onRetry`; `accept`, `maxSize`; inside `Field`). Never a native `<input type="file">` |
| People | `Avatar` (photo or initials on a stable tone) |
| Nothing to show yet | `EmptyState` (icon, one line, action) |
| Related buttons as one control | `ButtonGroup` (‹ Hôm nay ›, Lưu + `Menu`) |
| Pressed state / icon option sets | `Toggle` (one, `aria-pressed`); `ToggleGroup` (`type` single = radio group, multiple = toolbar). Text filters stay `Pills` |
| Fixed parts around an input | `InputGroup` (`start` / `end`: prefix, unit, small button) |
| A number by dragging | `Slider` (one thumb, or `range` for min–max; `format` for units) |
| Pick a day / a range on the page | `Calendar` (`mode` single / range); a date field → `DatePicker` (uses Calendar) |
| Where the page sits | `Breadcrumb` (collapses the middle into "…" past `maxItems`) |
| Hide / show sections | `Collapsible` (one), `Accordion` (list; `type` single / multiple) |
| Small interactive panel under a trigger | `Popover` (non-modal dialog); a hover preview of a link → `HoverCard` |
| Actions at the pointer | `ContextMenu` (right-click, long-press, Menu key); the same actions must exist in a visible `Menu` |
| Jump / run anything from the keyboard | `CommandDialog` + `useHotkey` (⌘K), `Command` inline; matching ignores Vietnamese marks |
| Sort / filter / select / page rows | `DataTable` (`columns`, `search`, `selectable` + `bulkActions`, `pageSize`, `loading`) |
| Fixed-height scrolling list | `ScrollArea` (edge lines, optional thin scrollbar, keyboard focusable) |
| Divider / key cap | `Separator` (horizontal, vertical, with a label); `Kbd` (`keys={["⌘", "K"]}`) |
| Charts | `BarChart` (grouped / `stacked`), `LineChart` (`area`), `DonutChart` (≤ 5 parts), `Sparkline` (trend in a KPI tile). Series colours are the fixed `chart-1…8` tokens in order, a 9th series folds into “Khác”; one y axis only; legend for 2+ series, keyboard tooltip and table view built in |
| One-time code / PIN | `InputOTP` (one real input, paste and SMS autofill work) |
| Slides in a row | `Carousel` (`perView`, scroll-snap, no auto-play) |
| Areas people resize | `ResizablePanels` (`direction`, `defaultSizes`, `storageKey`) |
| Media at a fixed ratio | `AspectRatio` (`ratio`, default 16 / 9) |
| Website top navigation | `NavigationMenu` (links + panels of described links; a sheet below md) |
| Commands of a desktop-style tool | `Menubar` (Tệp · Sửa · Xem; items like `Menu`) |
| Code to read or copy | `CodeBlock` (`title`, copy button) |
| A code a phone scans (VietQR, link) | `QRCode` (`value`, `label`, `errorCorrection`, `caption`, `copyValue`, `print` for receipts). Modules are always black on white with a 4-module quiet zone, in both themes: a documented exception, never recolour |
| Long-form text (articles, Markdown) | `Prose` |
| List rows | `Item` (icon / media, title, description, meta, actions, `href`) in an `ItemGroup` |

The full inventory with props is generated into `components.json` (`npm run build:manifest`).

## 18. Accessibility & UI strings

- Contrast: every text / background pair ≥ 4.5:1 (3:1 for ≥ 24px) in **both** themes; `npm run test:ui` checks every
  Storybook page in light and dark, plus axe (WCAG 2.2 AA), control boundaries ≥ 3:1 and focus in forced colours.
- Keyboard: every control is reachable and shows `FOCUS_RING` (`focus-visible` only); dialogs (`Modal`, `Drawer`,
  `confirmDialog`, `NumPadPopup`) trap focus, close on Escape and return focus to the opener (`useDialog`); menus,
  tabs and comboboxes follow the WAI-ARIA keyboard patterns.
- Layers in a dialog: a select list, popover, menu, date picker or tooltip open inside a dialog gets Escape first
  (one Escape closes the layer, the next the dialog). A custom layer does the same by handling Escape in its own
  `onKeyDown` with `preventDefault()` (or `stopPropagation()`); the trap ignores a handled key. Layers portaled to
  `body` keep their own Tab handling; focus that leaves the dialog anywhere else is sent back.
- Triggers keep their own props: `Popover`, `HoverCard`, `Tooltip` and `Menu` add theirs to the trigger element
  without replacing its `ref` or handlers (the trigger's handler runs first; `preventDefault()` there skips ours).
- Boundaries and states (WCAG 1.4.11): an input you type in or tick (text field, select field, combobox, OTP slot,
  composer, checkbox, radio) draws its edge in `border-control-line` (≥ 3:1); `border-line` is for cards, tables and
  frames, which need no edge. The chosen segment of a segmented control (`Pills`, `Toggle`, pill `Tabs`, theme / style
  switcher) uses `SEGMENT_ON`: the tonal fill alone is too faint, its inset ring is what tells which one is on.
- Focus on an input you type in: `border-focus` plus a 1px `ring-focus` (2px in all), like `FOCUS_RING` elsewhere.
- Forced colours (Windows high contrast) drop box-shadow, so `base.css` draws a system-colour outline on
  `:focus-visible`; keep `base.css` imported, and never rely on a shadow alone to show focus.
- Names: icon-only controls carry `aria-label` (Button's type requires it); form controls get their label from `Field`.
- Target size (WCAG 2.5.8): every control is at least 24 × 24 px or keeps 24px from the next one. A control drawn
  smaller (a carousel dot, a slider thumb, a text button in a line, a 16px checkbox) takes `HIT_AREA`
  (`@semi/ui/styles`): a pseudo-element that grows the click area to 24px, 44px on touch screens, while the visible
  size and layout stay; the control needs `relative` and no `::before` of its own.
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
| `edge` | A field you type in or pick from (input, textarea, select, combobox) shows no edge, or an edge or fill under 3:1, against the surface around it; a wrapper hugging the field (an input group, a composer) counts as its edge; an open combobox (a command palette) is told apart by its list |
| `name` | A button, link, field or ARIA control has no name (text, `aria-label`, `aria-labelledby`, a label, `title`), or only a placeholder |
| `focus-ring` | Focusing a control from the keyboard changes nothing on it, its three wrappers or its siblings (outline, shadow, border, fill, colour) |
| `target-size` | A control is smaller than 24 × 24 px (its `::before` / `::after` hit area included) and a 24px circle on its centre touches another target or another small target's circle; links in a sentence are exempt |
| `img-alt` | An `<img>` has no `alt`, or a `role="img"` has no name |
| `lang` | `<html>` has no `lang` |
| `field-size` | At a viewport under 640px, an input, textarea or select you type in has text under 16px (iOS Safari zooms the page on focus and never zooms back); read-only and disabled fields are exempt |
| `zoom-lock` | The viewport meta has `user-scalable=no` or `maximum-scale` below 2 |

`data-a11y-skip="<reason>"` marks a specimen that breaks a rule on purpose (a contrast sample in a brand book); never
put it on an app screen to silence a hit.
- Strings: shared components never hard-code UI text; they read `useSemiLocale()` (Vietnamese default). Apps switch
  language with `<SemiLocaleProvider locale={en}>` or override single strings (`locale={{ close: "Thoát" }}`).

## 19. Product look & the generic AI look

Every AI-made app tends towards the same screen: sidebar, title, four equal KPI cards with a coloured icon each, a
table; a landing page with a hero and three feature cards ("Fast / Secure / Dedicated"). Semi screens avoid it in two
ways.

**The product's look.** Colour, fonts and voice come from the brand; the style sets shape, title weight and the font
of big numbers. Density and type scale belong to each **product**, because one brand has a dense dashboard and a
roomy store: `data-density` / `data-type-scale` on `<html>` (or any wrapper), mirrored as `"density"` /
`"typeScale"` in `semi-lint.json`, picked in `/semi-new-app` by the kind of product.

| Choice | Set by | Token | Read by |
|---|---|---|---|
| Density compact / regular / airy | product | `--spacing` (Tailwind's unit: every `p-*`, `gap-*`, `space-*`) | everything |
| Type scale even / contrast | product | `--text-figure` … `--text-display` | `PageTitle`, `KpiCard`, headings |
| Title weight | style | `font-title` (`--font-weight-title`) | `PageTitle`, `PageTabsTitle`, `KpiCard` |
| Font of big numbers | style | `font-figure` | `KpiCard` |

Sharp has bold titles and figures in the display font; Flat and Soft semibold in the sans. Apps use `font-title`
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
- **Emoji as icons (`emoji-icon`):** a brand whose voice allows emoji in copy disables the rule in `semi-lint.json`.

**The baseline only shrinks.** `semi-lint --update-baseline` lowers it to what is left and refuses new hits;
`--accept-new` records them only after a Semi upgrade (`/semi-sync` runs it) or with the user's OK. `semi-lint --ci`
(the app's `.github/workflows/semi.yml`, wired by `/semi-new-app` and `/semi-check`) also fails when the baseline, a
`skip` or a disabled rule grew against the base branch. The edit hook lints `.css` too and flags any edit of
`semi-lint.json` or the baseline.

- **Physical / literal colors (`no-literal-palette`):** Never use neutral / white / black colour classes on any prefix or variant (`bg-white`, `text-slate-900`, `border-b-gray-200`, `divide-zinc-100`, `ring-slate-300`, `from-white`, `dark:bg-slate-800`). Always use Semantic Tokens (`bg-panel`, `bg-field`, `text-contrast`, `text-body`, `text-muted`, `border-line`, `divide-divider`).
- **Fixed chromatic text (`no-fixed-tone-text`):** `text-emerald-400`, `text-rose-700 dark:text-rose-300`, `fill-amber-500` cannot pass contrast in both themes: use `text-accent-fg`, `text-*-fg` or `text-tone-<hue>`.
- **Brand scale as a state colour (`accent-state-token`):** `ring-primary-500/50`, `bg-primary-500/15`, `border-primary-500/30` are not themed and vanish for light brands on light surfaces (a yellow ring is ≈ 1.3:1 on white): use `ring-focus`, `border-focus`, `bg-accent-subtle` / `bg-accent-subtle-hover`, `border-accent-line`. `/semi-check` rewrites them.
- **Brand scale as a fill or border (`primary-fill`):** `bg-primary-500`, `hover:bg-primary-600`, `border-primary-500`. The brand colour sits on one step of the scale (yellow on `200`, navy on `900`), so a `primary-500` fill turns pale or off-brand with a brand kit. Main actions and "on" marks are `bg-accent hover:bg-accent-hover text-on-accent` (`BTN_PRIMARY`), selected borders `border-accent-line`, focused ones `border-focus`. `primary-*` is the scale for charts and illustrations: list those files under `skip`. The `/semi-check` codemod rewrites `bg-primary-400…600` to `bg-accent` when the same class list has `text-white` / `text-on-accent`, and reports the rest.
- **Solid pastel surfaces (`no-solid-pastel-surfaces`), arbitrary colours (`hex-colour-class`), literal colours in code (`literal-colour-value`), off-scale sizes (`arbitrary-text-size`).**
- The colour / size rules read class tokens from every string literal (className, `cn()`, constants, template parts, `@apply`), not lines, so any spelling of a colour is caught.
- **Illustrations and data colours** (a device drawing, a 3D scene palette, other companies' logos) are content, not UI chrome: name each file under `skip` in `semi-lint.json` with a reason, for `literal-colour-value`, `inline-svg-path` or `no-literal-palette` only: `"skip": { "literal-colour-value": { "lib/scenePalette.ts": "data colours: 3D scene" } }`. The `/semi-check` audit lists each one ("Minh hoạ / màu dữ liệu") and its codemod leaves them; never a whole folder, never the baseline.
- **Overriding Card component (`card-class-override`):** Never pass any `bg-*` or `shadow-*` (with or without a variant such as `hover:`) to `<Card />`; use `TONAL_CONTAINER` on a plain element for a tinted card.
- Gradients, glow blobs, coloured glow shadows (`shadow-[0_0_…]`), "glassmorphism" panels.
- Solid greys for surfaces (`bg-gray-800/900`), `border-gray-700`, hard-coded hex colour classes (`bg-[#...]`, `text-[#...]`).
- `font-bold` / `extrabold` / `black`; `text-[9px]` / `text-[10px]`; `text-xs` / `text-sm`; `uppercase` labels; ALL-CAPS button text.
- Raw or arbitrary radii (`rounded-lg`, `rounded-[10px]`) instead of the style tokens; `font-mono` for numbers (fine on `<code>`, `<pre>`, `CodeBlock`, `Terminal` and `textarea` / `contentEditable` code editors); coloured icon tiles in front of every card title; one decorative icon colour per card (`decorative-icon-tones`, §19).
- Emoji or unicode pictograms as icons; filled glyphs mixed with stroke icons; stroke 2+; new inline `<svg>` paths.
- Native `<select>`, `type="date"`, `type="number"`, `window.confirm` / `alert`.
- Tokens are named by role, like the large design systems (Material, Carbon, Primer: a type role, a layer), never by
  one component: `text-figure` (was `text-kpi`), `z-sheet` (was `z-keypad`). The old names stay as deprecated aliases
  until 1.0; the 0.30.0 migration rewrites them.
- `AppShell` in a page or in a component a page imports (`app-shell-in-page`); a shell gated behind a page skeleton (`shell-gate`); sidebar routing through `onSelect` + `router.push` instead of item `href` (`shell-nav-href`); `BootLoader` in a page, a `loading.tsx` or shell content (`boot-loader-place`).
- "Đang tải…" text or a page spinner instead of a skeleton (`loading-text`). A step label of a progress bar (`Progress label`, a call with a `fraction` / `value`), text in a `role="status"` / `role="progressbar"` element and a `TaskHost` label are fine.
- A Home button in an app header; subtitles under page titles.
- Coloured nav icons or count badges in the menu; chips or tags with different background colours.
- Narrow `max-w-5xl` page containers that waste horizontal space (`narrow-container`; a dialog or drawer with `MODAL_PANEL`, `Modal`, `Drawer` or `role="dialog"` keeps its max width).
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
