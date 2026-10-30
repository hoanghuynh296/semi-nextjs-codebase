# Semi Design System — Quick Reference

Cheatsheet of `DESIGN_SYSTEM.md`, which is the **single source of truth for UI rules** across the Semi ecosystem: a new
or changed rule goes into `docs/DESIGN_SYSTEM.md`, `docs/QUICK_REF.md`, `docs/DECISIONS.md` (+ `lint/semi-lint.mjs` when
checkable) in the `semi-nextjs-codebase` repo, tagged with a new release. Never record UI rules in agent memory, skills
or per-project `AGENTS.md`.

Style: restrained dark product theme + bento cards, flat (no gradients, no glow), minimal text, collapsible neutral
left panel menu (`w-52` / `w-14`) floating on `bg-canvas` (`md:p-2 md:gap-2`), full-width right content panel (`md:rounded-2xl bg-app`),
`font-display` page titles (`PageTitle` / `PageTabsTitle`, text only, no subtitle, no text buttons on the title row),
sticky sub-page toolbar row (`SubpageToolbar`: filters left, icon-only primary CTA + `SearchInput` + `RefreshButton` right).
Phones (`< md`) hide the top logo header and use `MobileTabBar` at the bottom (never a hamburger slide-over drawer).

**Surfaces:** canvas `bg-canvas` #111111 · page `bg-app` #181818 · card/menu `bg-panel` #262626 · modal/popover `bg-field` #2E2E2E ·
hover `bg-raised` #383838 · tonal `bg-white/[0.04|0.05|0.08|0.10]` · borders `border-line` #333333, hover `border-line-hover`
#474747, separators `border-divider` #2E2E2E. Form inputs use `FIELD_INPUT` / `FIELD_TEXTAREA` (`bg-white/[0.05]`), never `bg-field`
(which disappears inside `bg-field` modals). No hex colour classes.

**Colour:** primary `#00AE42` (`primary-*`, overridable per project in `@theme`) = actions, focus, "on". `emerald-*` = status/success only.
amber = busy/warning · rose = error/danger. Nav menu: grey 16px icons, no count badges, active = `bg-white/[0.10] text-white`.
Chips (`Chip`, `chipClass(active)`): `rounded-full h-[34px] px-3.5`, ghost when off, `bg-white/[0.10]` when selected; colour only on a
leading dot or icon (`TONE_DOT`, `chipIconClass(tone)`). Card tiles keep their area tint. Flat: no gradients, no glow
blobs, no `shadow-[0_0_…]` (status dots and power buttons too). Active card = `CARD_ACTIVE` (primary border).

**Type:** page title (`PageTitle` / `PageTabsTitle`) `font-display text-[22px] sm:text-[26px] font-semibold tracking-tight` ·
KPI figure (`KpiCard`) `text-[18px] sm:text-[22px] font-semibold tabular-nums` · section `text-[13px]–[15px]
font-semibold text-white` · UI `text-[12px] font-medium text-gray-300` · label `text-[12px] font-medium text-gray-400` ·
caption `text-[11px]–[12px] text-gray-500` · numbers `tabular-nums` (Geist; `font-mono` only for code) · Geist +
Montserrat Alternates (`font-display`) · weights medium/semibold · px sizes only (no `text-xs/sm`) · min `text-[11px]` ·
sentence case, no ALL CAPS.

**Shape:** controls/tiles `rounded-lg` · cards `rounded-xl` · panels/hero/modal `rounded-2xl` · chips/pills/badges
`rounded-full` · tiny swatches `rounded`. No `rounded-md`.

**Use the shared blocks (`@semi/ui` and `@semi/ui/styles`) — never create a local `ui.tsx` wrapper barrel:**
- **Layout & Structure (`@semi/ui`):**
  - `AppShell` (+ `MobileTabBar`, `TAB_BAR_PAD`): 2-panel floating Bento frame on `bg-canvas`, collapsible `w-52`/`w-14` sidebar with grouped `sections`, and mobile bottom tab bar.
  - `PageTitle`, `PageTabsTitle`: text-only display heading or underline tab heading (`h-[2.5px] bg-primary`).
  - `SubpageToolbar`: sticky toolbar (`STICKY_TOOLBAR`) with `left` filters and `right` icon-only `BTN_PRIMARY BTN_ICON` + `SearchInput` + `RefreshButton`.
  - `KpiCard`: metric card with `18px–22px` `tabular-nums` value, coloured icon in label, and shimmer `loading` state.
  - `Modal`: portal dialog with `MODAL_BACKDROP`, `MODAL_PANEL`, `MODAL_HEAD`, `MODAL_CLOSE`, and `footer` (`MODAL_FOOT`).
- **Controls (`@semi/ui`):**
  - `Icon` (stroke 1.75, `w-4 h-4`), `IconTile` (`size="sm|md|lg"`). Follow semantic icon mapping in `docs/ICONS.md` (e.g. `trash` for delete, `close` for dialog dismiss, `refresh` for sync, `sliders` for parameters, `user` for profiles, `filter` for lists). New icons go into `ICONS` in `@semi/ui` (never inline `<svg><path>`; no ✕ ✓ ✗ glyphs).
  - `Pills`, `Chip`, `SearchInput`, `CustomSelect` (toolbar default vs `variant="field"` in forms), `CustomCombobox`, `DatePicker`, `Pagination`, `NumberInput` (+ `NumPadPopup`). Never native `<select>`, `type="date"`, `type="number"`.
  - `AppHeader` (stand-alone tool/3D app top bar), `PageActions`, `SidePanel`, `RefreshButton`, `ExternalLink`, `Markdown`.
  - Loading: `Skeleton` / `SkeletonCard` / `SkeletonGrid` / `SkeletonRows` / `PageSkeleton`; no "Đang tải…" text or page spinners.
  - Confirmations: `confirmDialog({ title, message, confirmLabel, tone, icon })` + `<ConfirmHost />`, never `window.confirm`.
- **Style Constants (`@semi/ui/styles`):**
  - `surfaces.ts`: `SHELL_OUTER`, `SHELL_ASIDE`, `SHELL_MAIN`, `SHELL_CONTAINER`, `CARD`, `CARD_HOVER`, `CARD_ACTIVE`, `HERO`, `TILE`, `SECTION_*`, `COUNT_PILL`, `EMPTY`, `ICON_BTN*`, `STATUS_PILL`, `STATUS_DOT`, `STICKY_TOOLBAR`, `MODAL_*`, `FIELD_LABEL`, `FIELD_INPUT`, `FIELD_TEXTAREA`.
  - `buttons.ts`: `BTN_PRIMARY`, `BTN_SECONDARY`, `BTN_DANGER`, `BTN_ICON`, `MODAL_BTN_*`.
  - `appChrome.ts`: `HEADER_ICON_*`, `headerPrimary`, `HEADER_PILL`, `VIEWPORT_*`.

## Anti-patterns (enforced by `npx semi-lint`)
Gradients, glow, `shadow-[0_0_…]` · `font-bold`, `text-[9|10px]`, `text-xs/sm`, uppercase labels, ALL CAPS buttons ·
`rounded-md` · `bg-gray-800/900`, `border-gray-700`, hex colour classes · `bg-field` on `<input>`/`<textarea>` (use `FIELD_INPUT`) ·
fixed `border-r` sidebars or `-translate-x-full` hamburger drawers (use `AppShell` + `MobileTabBar`) · local `ui.tsx` wrapper barrels
(`PageHeader`, `Select`, `Input`, `Button`, `Modal`) · emoji / ✕ ✓ glyphs, stroke 2+, inline `<path>` · native `<select>` / date /
number inputs, `window.confirm` · "Đang tải…" text · Home button in app headers, page subtitles, text buttons on the page title row.
