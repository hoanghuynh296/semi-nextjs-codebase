# Semi Design System — Quick Reference

Cheatsheet of `DESIGN_SYSTEM.md`, which is the **single source of truth for UI rules** across the Semi ecosystem: a new
or changed rule goes into `docs/DESIGN_SYSTEM.md`, `docs/QUICK_REF.md`, `docs/DECISIONS.md` (+ `lint/semi-lint.mjs` when
checkable) in the `semi-nextjs-codebase` repo, tagged with a new release. Never record UI rules in agent memory, skills
or per-project `AGENTS.md`.

Style: restrained dark product theme + bento cards, flat (no gradients, no glow), minimal text, collapsible neutral
left panel menu (`w-52` / `w-14`), full-width right content panel, `font-display` page titles (text only, no
subtitle), sticky sub-page toolbar row (pill filter tabs left, icon-only primary CTA + filters/search/refresh right).

**Surfaces:** canvas `bg-canvas` #111111 · page `bg-app` #181818 · card/menu `bg-panel` #262626 · input/modal `bg-field` #2E2E2E ·
hover `bg-raised` #383838 · tonal `bg-white/[0.04|0.05|0.08|0.10]` · borders `border-line` #333333, hover `border-line-hover`
#474747, separators `border-divider` #2E2E2E. No hex colour classes.

**Colour:** primary `#00AE42` (`primary-*`, overridable per project in `@theme`) = actions, focus, "on". `emerald-*` = status/success only.
amber = busy/warning · rose = error/danger. Nav menu: grey 16px icons, no count badges, active = `bg-white/[0.10] text-white`.
Chips (`Chip`, `chipClass(active)`): `rounded-full h-[34px] px-3.5`, ghost when off, `bg-white/[0.10]` when selected; colour only on a
leading dot or icon (`TONE_DOT`, `chipIconClass(tone)`). Card tiles keep their area tint. Flat: no gradients, no glow
blobs, no `shadow-[0_0_…]` (status dots and power buttons too). Active card = `CARD_ACTIVE` (primary border).

**Stand-alone tool / 3D apps:** one layout from `@semi/ui/styles` (`appChrome.ts`) + `AppHeader` + `SidePanel`: title = the app
name only (no brand prefix), optional centre slot, one primary `headerPrimary`; collapsible 320 px left panel ("Tuỳ chọn khác" for
rare options); floating canvas controls (`VIEWPORT_TOOLBAR`, `VIEWPORT_PILL`).

**Type:** page title `font-display text-[22px] sm:text-[26px] font-semibold tracking-tight` · section `text-[13px]–[15px]
font-semibold text-white` · UI `text-[12px] font-medium text-gray-300` · label `text-[12px] font-medium text-gray-400` ·
caption `text-[11px]–[12px] text-gray-500` · numbers `tabular-nums` (Geist; `font-mono` only for code) · Geist +
Montserrat Alternates (`font-display`) · weights medium/semibold · px sizes only (no `text-xs/sm`) · min `text-[11px]` ·
sentence case, no ALL CAPS.

**Shape:** controls/tiles `rounded-lg` · cards `rounded-xl` · panels/hero/modal `rounded-2xl` · chips/pills/badges
`rounded-full` · tiny swatches `rounded`. No `rounded-md`.

**Use the shared blocks (`@semi/ui` and `@semi/ui/styles`):**
- `@semi/ui/styles` (`surfaces.ts`): `CARD`, `CARD_HOVER`, `CARD_ACTIVE`, `HERO`, `TILE`, `SECTION_*`, `COUNT_PILL`, `EMPTY`, `ICON_BTN*`,
  `STATUS_PILL`, `STATUS_DOT`, `STICKY_TOOLBAR`, `MODAL_BACKDROP` / `MODAL_PANEL` / `MODAL_HEAD` / `MODAL_TITLE` / `MODAL_FOOT` / `MODAL_CLOSE`.
- `@semi/ui/styles` (`buttons.ts`): `BTN_PRIMARY`, `BTN_SECONDARY`, `BTN_DANGER`, `BTN_ICON` (icon-only), `MODAL_BTN_*` (44px on phones).
- `@semi/ui/styles` (`appChrome.ts`): `HEADER_ICON_BASE`, `HEADER_ICON_IDLE`, `HEADER_ICON_ACTIVE`, `headerPrimary`, `HEADER_PILL`, `VIEWPORT_*`.
- `@semi/ui`: `Icon` (stroke 1.75, `w-4 h-4`), `IconTile` (`size="sm|md|lg"`). New shared icons go into `ICONS` in `@semi/ui`; no inline `<svg><path>`; no ✕ ✓ ✗ glyphs.
- `@semi/ui`: `Pills`, `Chip`, `SearchInput`, `CustomSelect`, `CustomCombobox`, `DatePicker`, `Pagination`, `NumberInput` (+ `NumPadPopup`). Never native `<select>`, `type="date"`, `type="number"`.
- `@semi/ui`: `AppHeader` (logo + app title left = back to `/`, actions right; **no Home button**, full width), `PageActions`, `SidePanel`, `RefreshButton`, `ExternalLink`, `Markdown`.
- Loading: `Skeleton` / `SkeletonGrid` / `SkeletonRows` / `PageSkeleton` shaped like the content; no "Đang tải…" text,
  no page spinners (spinner only inside the button running the action; long jobs = progress bar + %).
- Confirmations: `confirmDialog({ title, message, confirmLabel, tone, icon })` + `<ConfirmHost />`, never `window.confirm`.

**Patterns:** sub-page = title + `STICKY_TOOLBAR` row · card header = `IconTile md` + name + caption + icon actions ·
status = `STATUS_DOT` + `STATUS_PILL` · empty = `EMPTY` with icon · modal = full screen on phones, centred from `sm` ·
links to other sites = `ExternalLink` · card grids beside a sidebar size columns by `@container` (`@xl:grid-cols-…`), not viewport breakpoints.

**Status dot (flat):** online `bg-emerald-400` · active/printing `bg-primary-400 animate-pulse` · busy `bg-amber-400` ·
error `bg-rose-500` · offline `bg-gray-500`.

## Anti-patterns (lint: `npx semi-lint`)
Gradients, glow, `shadow-[0_0_…]` · `font-bold`, `text-[9|10px]`, `text-xs/sm`, uppercase labels, ALL CAPS buttons ·
`rounded-md` · `bg-gray-800/900`, `border-gray-700`, hex colour classes · emoji / ✕ ✓ glyphs, stroke 2+, inline `<path>` ·
native `<select>` / date / number inputs, `window.confirm` · "Đang tải…" text · Home button in app headers, page subtitles ·
horizontal scroll at 375px, text without `min-w-0` + `truncate` in flex rows · narrow `max-w-5xl` containers.
