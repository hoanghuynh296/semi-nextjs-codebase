# Semi Design System — Quick Reference

Cheatsheet of `DESIGN_SYSTEM.md`, which is the **single source of truth for UI rules** across the Semi ecosystem: a new
or changed rule goes into `docs/DESIGN_SYSTEM.md`, `docs/QUICK_REF.md`, `docs/DECISIONS.md` (+ `lint/semi-lint.mjs` when
checkable) in the `semi-nextjs-codebase` repo, tagged with a new release. Never record UI rules in agent memory, skills
or per-project `AGENTS.md`.

Style: restrained dark & light dual-theme (`data-theme="dark|light"`) + bento cards, flat (no gradients, no glow), minimal text, collapsible neutral
left panel menu (`w-52` / `w-14`) floating on `bg-canvas` (`md:p-2 md:gap-2`), full-width right content panel (`md:rounded-2xl bg-app`),
`font-display` page titles (`PageTitle` / `PageTabsTitle`, text only, no subtitle, no text buttons on the title row),
sticky sub-page toolbar row (`SubpageToolbar`: filters left, icon-only primary CTA + `SearchInput` + `RefreshButton` right).
Phones (`< md`) hide the top logo header and use `MobileTabBar` at the bottom (never a hamburger slide-over drawer).

**Two-Tier Semantic Tokens (Dark & Light Mode):**
| Semantic Token | Tailwind Class | Dark Mode (`[data-theme="dark"]`) | Light Mode (`[data-theme="light"]`) | Usage |
|---|---|---|---|---|
| `--color-canvas` | `bg-canvas` | `#0c0d0e` | `#f1f5f9` (Slate-100) | Outermost viewport frame |
| `--color-app` | `bg-app` | `#121316` | `#ffffff` | Main workspace & content canvas |
| `--color-panel` | `bg-panel` | `#18191c` | `#ffffff` | Bento Cards, Sidebar, Modals, Menus |
| `--color-field` | `bg-field` | `#1e1f23` | `#f1f5f9` (Slate-100) | Form inputs (`FIELD_INPUT`), table headers |
| `--color-raised` | `bg-raised` | `#26282e` | `#e2e8f0` (Slate-200) | Hover surface, subtle elevation, skeleton shimmer |
| `--color-text-contrast` | `text-contrast` | `#ffffff` | `#0f172a` (Slate-900) | Headings, active state, high-contrast text |
| `--color-text-body` | `text-body` | `#d1d5db` (Gray-300) | `#334155` (Slate-700) | Primary UI labels, body text |
| `--color-text-muted` | `text-muted` | `#8b919a` | `#5b6779` | Captions, placeholders, inactive hints |
| `--color-line` | `border-line` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.08)` (Slate-200) | Borders on cards, panels, inputs, dividers |
| `--color-line-hover` | `border-line-hover` | `rgba(255,255,255,0.16)` | `rgba(0,0,0,0.16)` (Slate-300) | Hover border state |
| `--color-divider` | `border-divider` | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.05)` (Slate-100) | Subtle row & item separators |

*Accent & status (AA in both themes):* solid action `bg-accent hover:bg-accent-hover text-on-accent` · primary text/icon `text-accent-fg` · status text `text-danger-fg` / `text-success-fg` / `text-warning-fg` / `text-info-fg` · tonal text `text-tone-<hue>`. Never `text-*-400` or `text-*-700 dark:text-*-300` in shared UI.

*Theme:* `<html suppressHydrationWarning>` + `<ThemeScript />` in `<head>` (no flash) + `<ThemeProvider defaultTheme="dark">` (same options); `<ThemeSwitcher />` (Sáng · Tối · Hệ thống, settings / sidebar footer) or `<ThemeToggle />` (one-tap dark/light), or `const { theme, resolvedTheme, mounted, setTheme } = useTheme()`. `data-theme="system"` follows the OS.

**Colour:** primary `#00AE42` (`primary-*`, overridable per project in `@theme`) = actions, focus, "on". `emerald-*` = status/success only.
amber = busy/warning · rose = error/danger. Nav menu: grey 16px icons, no count badges, active = `bg-white/[0.10] text-contrast`.
Chips (`Chip`, `chipClass(active)`): `rounded-full h-[34px] px-3.5`, ghost when off, active uses semantic high-contrast background; colour only on a
leading dot or icon (`TONE_DOT`, `chipIconClass(tone)`). Card tiles keep their area tint. Flat: no gradients, no glow
blobs, no `shadow-[0_0_…]` (status dots and power buttons too). Active card = `CARD_ACTIVE` (primary border).

**Type:** page title (`PageTitle` / `PageTabsTitle`) `font-display text-heading sm:text-display font-semibold tracking-tight text-contrast` ·
KPI figure (`KpiCard`) `text-kpi sm:text-heading font-semibold tabular-nums text-contrast` · section `text-ui`–`text-title`
font-semibold text-contrast` · UI `text-label font-medium text-body` · label `text-label font-medium text-muted` ·
caption `text-caption`–`text-label` text-muted` · numbers `tabular-nums` (Geist; `font-mono` only for code) · Geist +
Montserrat Alternates (`font-display`) · weights medium/semibold · type scale only: `text-caption` 11 · `label` 12 · `ui` 13 · `ui-lg` 14 · `title` 15 · `title-lg` 16 · `kpi` 18 · `heading-sm` 20 · `heading` 22 · `heading-lg` 24 · `display` 26 (no `text-xs/sm`, no `text-[13px]`) ·
sentence case, no ALL CAPS.

**Status, layers, elevation:** callouts / badges `bg-{danger,success,warning,info}-bg border-*-border text-*-fg` (`Alert`) ·
dots / bars `bg-*-solid` · backdrop `bg-overlay` · floating layers `shadow-overlay` (canvas controls `shadow-float`) ·
layers `z-sticky` < `z-drawer` < `z-modal` < `z-dialog` < `z-keypad` < `z-popover` < `z-toast` < `z-tooltip` (no `z-[9999]`).

**A11y & strings:** icon-only controls need `aria-label` · forms use `Field` (label / hint / error wired) · dialogs are
`Modal` / `Drawer` / `confirmDialog` (focus trap, Escape, focus return) · keep `FOCUS_RING` on custom controls · UI text
in shared components comes from `useSemiLocale()` (`<SemiLocaleProvider locale={en}>`).

**Shape:** controls/tiles `rounded-lg` · cards `rounded-xl` · panels/hero/modal `rounded-2xl` · chips/pills/badges
`rounded-full` · tiny swatches `rounded`. No `rounded-md`.

**Use the shared blocks (`@semi/ui` and `@semi/ui/styles`) — never create a local `ui.tsx` wrapper barrel:**
- **Layout & Structure (`@semi/ui`):**
  - `ThemeProvider`, `useTheme`, `ThemeToggle`: Zero-runtime-overhead dual-theme management via `data-theme` attribute and CSS variables.
  - `AppShell` (+ `MobileTabBar`, `TAB_BAR_PAD`): 2-panel floating Bento frame on `bg-canvas`, collapsible `w-52`/`w-14` sidebar with grouped `sections`, and mobile bottom tab bar.
  - `PageTitle`, `PageTabsTitle`: text-only display heading or underline tab heading (`h-[2.5px] bg-primary`).
  - `SubpageToolbar`: sticky toolbar (`STICKY_TOOLBAR`) with `left` filters and `right` icon-only `BTN_PRIMARY BTN_ICON` + `SearchInput` + `RefreshButton`.
  - `KpiCard`: metric card with `18px–22px` `tabular-nums` value, coloured icon in label, and shimmer `loading` state.
  - `Modal`: portal dialog with `MODAL_BACKDROP`, `MODAL_PANEL`, `MODAL_HEAD`, `MODAL_CLOSE`, and `footer` (`MODAL_FOOT`).
- **Controls (`@semi/ui`):**
  - `Icon` (stroke 1.75, `w-4 h-4`), `IconTile` (`size="sm|md|lg"`). Follow semantic icon mapping in `docs/ICONS.md` (e.g. `trash` for delete, `close` for dialog dismiss, `refresh` for sync, `sliders` for parameters, `user` for profiles, `filter` for lists, `sun`/`moon` for theme). New icons go into `ICONS` in `@semi/ui` (never inline `<svg><path>`; no ✕ ✓ ✗ glyphs).
  - `Pills`, `Chip` (+ `tone`), `Badge` (`tone="purple|blue|emerald|amber|rose|sky|..."`), `SearchInput`, `CustomSelect` (toolbar default vs `variant="field"` in forms), `CustomCombobox`, `DatePicker`, `Pagination`, `NumberInput` (+ `NumPadPopup`). Never native `<select>`, `type="date"`, `type="number"`.
  - `AppHeader` (stand-alone tool/3D app top bar), `PageActions`, `SidePanel`, `RefreshButton`, `ExternalLink`, `Markdown`.
  - Loading: `Skeleton` / `SkeletonCard` / `SkeletonGrid` / `SkeletonRows` / `PageSkeleton`; no "Đang tải…" text or page spinners.
  - Confirmations: `confirmDialog({ title, message, confirmLabel, tone, icon })` + `<ConfirmHost />`, never `window.confirm`.
- **Style Constants (`@semi/ui/styles`):**
  - `surfaces.ts`: `SHELL_OUTER`, `SHELL_ASIDE`, `SHELL_MAIN`, `SHELL_CONTAINER`, `CARD`, `CARD_HOVER`, `CARD_ACTIVE`, `HERO`, `TILE`, `SECTION_*`, `COUNT_PILL`, `EMPTY`, `ICON_BTN*`, `STATUS_PILL`, `STATUS_DOT`, `TONAL_SURFACE`, `TONAL_CONTAINER`, `TONAL_HOVER`, `BADGE_BASE`, `STICKY_TOOLBAR`, `MODAL_*`, `FIELD_LABEL`, `FIELD_INPUT`, `FIELD_TEXTAREA`.
  - `buttons.ts`: `BTN_PRIMARY`, `BTN_SECONDARY`, `BTN_DANGER`, `BTN_ICON`, `MODAL_BTN_*`.
  - `appChrome.ts`: `HEADER_ICON_*`, `headerPrimary`, `HEADER_PILL`, `VIEWPORT_*`.

## Anti-patterns & Token Rules (enforced by `npx semi-lint`)
- **No literal palette colors (`no-literal-palette`):** Never use direct physical classes like `bg-white`, `text-slate-900`, `border-slate-200`, `divide-slate-100`, `bg-slate-50`, `bg-gray-800/900`. Always use Semantic Tokens (`bg-panel`, `bg-field`, `text-contrast`, `text-body`, `text-muted`, `border-line`, `divide-divider`).
- **No fixed chromatic text (`no-fixed-tone-text`):** `text-emerald-400`, `text-rose-700 dark:text-rose-300`, `fill-sky-500` → `text-accent-fg`, `text-*-fg`, `text-tone-<hue>`.
- **No arbitrary colours / sizes:** `bg-[#…]`, `text-[rgb(…)]` (`hex-colour-class`), `"#fff"` in style props or configs (`literal-colour-value`), `text-[13px]` (`arbitrary-text-size`).
- **No solid pastel surfaces (`no-solid-pastel-surfaces`):** Never use solid pastels (`bg-*-50`, `border-*-200`) for cards, rows, or containers; in dark mode they turn into glaring light rectangles. Use alpha transparency (`bg-amber-500/10 border-amber-500/20`) or standard `bg-panel`.
- **Universal Tonal Theme-Matching:** Chromatic accents across ANY component (cards, alert banners, callouts, table rows, buttons, badges, chips) adapt seamlessly to both dark & light themes using alpha transparency: static fill `bg-<color>-500/10`, hover fill `hover:bg-<color>-500/15`, active fill `active:bg-<color>-500/20`, border `border-<color>-500/20`, hover border `hover:border-<color>-500/30`, and text `text-tone-<color>` (or `TONAL_CONTAINER` / `TONAL_HOVER` / `<Badge tone="...">`).
- **No Card class override (`card-class-override`):** `<Card>` (`interactive`, `active`) owns its surface: no `bg-*` / `shadow-*` in its className.
- **Surfaces & Shadows:** Gradients, glow, `shadow-[0_0_…]`, `shadow-sm/md/lg` are banned. Dark/Flat Bento UI relies on borders (`border-line`) rather than drop shadows.
- **Typography:** `font-bold`, `text-[9|10px]`, `text-xs/sm`, uppercase labels, ALL CAPS buttons.
- **Radii:** `rounded-md`.
- **Navigation & Layout:** fixed `border-r` sidebars or `-translate-x-full` hamburger drawers (use `AppShell` + `MobileTabBar`) · local `ui.tsx` wrapper barrels (`PageHeader`, `Select`, `Input`, `Button`, `Modal`): use `Button`, `Field` + `Input`, `CustomSelect`, `Modal`, `EmptyState` from `@semi/ui`.
- **Icons & Controls:** emoji / ✕ ✓ glyphs, stroke 2+, inline `<path>` · native `<select>` / date / number inputs, `window.confirm` · "Đang tải…" text · Home button in app headers, page subtitles, text buttons on the page title row.

## Component inventory

<!-- generated:components:start (scripts/build-manifest.mjs) -->
**Components (64)** — full props / summaries in `node_modules/@semi/ui/components.json`:

- `AppHeader`: `AppHeader`
- `AppShell`: `AppShell`
- `Badge`: `Badge`
- `Button`: `Spinner`, `Button`
- `Card`: `Card`
- `Chip`: `Chip`
- `Choice`: `Checkbox`, `Switch`, `RadioGroup`
- `CustomCombobox`: `CustomCombobox`
- `CustomSelect`: `CustomSelect`
- `DatePicker`: `DatePicker`
- `Drawer`: `Drawer`
- `ExternalLink`: `ExternalLink`
- `Feedback`: `Alert`, `Progress`, `Avatar`, `EmptyState`
- `Field`: `Field`, `Input`, `Textarea`
- `Icon`: `Icon`, `IconTile`
- `KpiCard`: `KpiCard`
- `Markdown`: `Markdown`
- `MobileTabBar`: `MobileTabBar`
- `Modal`: `Modal`
- `NumPadPopup`: `NumPadPopup`
- `NumberInput`: `NumberInput`
- `Overlay`: `Tooltip`, `Menu`
- `PageActions`: `PageActionsProvider`, `PageActionsSlot`, `PageActions`
- `PageTitle`: `PageTitle`, `PageTabsTitle`
- `Pagination`: `Pagination`
- `Pills`: `Pills`
- `RefreshButton`: `RefreshButton`
- `SearchInput`: `SearchInput`
- `SidePanel`: `SidePanelToggle`, `SidePanel`
- `Skeleton`: `Skeleton`, `Loading`, `SkeletonCard`, `SkeletonGrid`, `SkeletonRows`, `PageSkeleton`
- `SubpageToolbar`: `SubpageToolbar`
- `Table`: `Table`, `THead`, `TBody`, `TR`, `TH`, `TD`
- `Tabs`: `Tabs`
- `ThemeProvider`: `ThemeProvider`, `ThemeToggle`, `ThemeSwitcher`
- `ThemeScript`: `ThemeScript`
- `Toast`: `ToastHost`
- `confirmDialog`: `ConfirmHost`
- `locale`: `SemiLocaleProvider`

**Hooks:** `useField`, `useCoarsePointer`, `useTheme`, `useScrollLock`, `useFocusTrap`, `useDialog`, `useAnchoredPosition`, `useSemiLocale` · **Functions:** `chipClass`, `chipIconClass`, `pageWindow`, `themeScript`, `toast`, `dismissToast`, `confirmDialog`, `cn`
<!-- generated:components:end -->
