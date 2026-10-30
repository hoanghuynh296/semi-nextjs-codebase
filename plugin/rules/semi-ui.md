<!-- semi-design-system:start -->
# Semi Design System — UI Rules

All web UI in the Semi ecosystem MUST follow the **Semi Design System** (`@semi/ui`, repo `https://github.com/hoanghuynh296/semi-nextjs-codebase`).

1. **Single source of truth:** Read `node_modules/@semi/ui/docs/QUICK_REF.md` (and `node_modules/@semi/ui/docs/DESIGN_SYSTEM.md` for details) before editing any UI file. Do not invent local colour classes, font sizes, radii, or custom controls.
2. **Use `@semi/ui` and `@semi/ui/styles`:**
   - Components (`@semi/ui`): `Icon`, `IconTile`, `AppHeader`, `PageActions`, `Chip`, `Pills`, `CustomSelect`, `CustomCombobox`, `NumberInput`, `DatePicker`, `SearchInput`, `Pagination`, `SidePanel`, `RefreshButton`, `Skeleton` (`SkeletonGrid`, `SkeletonRows`, `PageSkeleton`), `confirmDialog` + `ConfirmHost`, `ExternalLink`, `Markdown`.
   - Styles (`@semi/ui/styles`): `CARD`, `CARD_HOVER`, `CARD_ACTIVE`, `HERO`, `TILE`, `SECTION_*`, `STICKY_TOOLBAR`, `MODAL_*`, `STATUS_DOT`, `STATUS_PILL`, `BTN_PRIMARY`, `BTN_SECONDARY`, `BTN_DANGER`, `BTN_ICON`, `MODAL_BTN_*`, `headerPrimary`, `VIEWPORT_*`.
3. **Hard constraints (enforced by `npx semi-lint`):**
   - Dark flat surfaces only (`bg-canvas`, `bg-app`, `bg-panel`, `bg-field`, `bg-raised`, `border-line`, `border-divider`). No gradients, no glow shadows (`shadow-[0_0_…]`), no `bg-gray-800/900`, no hex classes (`bg-[#...]`).
   - Typography: `font-medium` / `font-semibold` only (no `font-bold`); explicit px sizes `text-[11px]`…`text-[15px]` (no `text-xs/sm/base`, min `11px`); `tabular-nums` for numbers (`font-mono` only for code); sentence case (no `uppercase` labels or ALL CAPS buttons).
   - Radii: `rounded-lg` (controls/tiles), `rounded-xl` (cards), `rounded-2xl` (panels/modals), `rounded-full` (chips/pills). Never `rounded-md`.
   - Controls: never native `<select>`, `type="date"`, `type="number"`, or `window.confirm`/`alert`. Never inline `<svg><path>` or unicode glyph icons (✕ ✓ ✗ ⚠) — use `<Icon name="…" />` (stroke 1.75).
   - Loading: use `Skeleton` shapes, never `"Đang tải…"` text or full-page spinners.
4. **Never fork rules per project:** When the user changes a shared UI rule, update `docs/DESIGN_SYSTEM.md`, `docs/QUICK_REF.md`, `docs/DECISIONS.md`, and `lint/semi-lint.mjs` in the `semi-nextjs-codebase` repository and release a new tag — never record shared UI rules only in a consumer project's `AGENTS.md` or agent memory. App-specific patterns belong in the app's own `docs/UI_EXTENSIONS.md`.
5. **Verification:** Run `npx semi-lint` (or `npm run semi:lint`) before finishing any UI change.
<!-- semi-design-system:end -->
