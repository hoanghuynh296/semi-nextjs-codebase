# Changelog

All notable changes to the **Semi Design System** (`@semi/ui` and `semi-design` plugin) are documented in this file.

## [0.2.1] - 2026-10-30

### Added
- **Icons (`@semi/ui`):** Added Lucide 24×24 stroke paths for `terminal` (`>_` prompt), `folder` (directory / Finder), `file` (document), `smartphone` (mobile device), and `branch` (git branch) into `ICONS`.

## [0.2.0] - 2026-10-30

### Added
- **Structural Layout & Page Components (`@semi/ui`):**
  - `AppShell` + `MobileTabBar` (`TAB_BAR_PAD`): 2-panel floating Bento frame on `bg-canvas` (`md:p-2 md:gap-2`), collapsible `w-52` ↔ `w-14` `rounded-2xl` sidebar with grouped `sections`, primary CTA slot, and mobile bottom navigation bar (plus "Menu" bottom sheet when an app has >5 routes).
  - `PageTitle` & `PageTabsTitle`: text-only `font-display` page heading (`22px–26px`) and underline group tabs (`h-[2.5px] bg-primary`).
  - `SubpageToolbar`: unified `STICKY_TOOLBAR` with `left` filters and `right` icon-only `BTN_PRIMARY BTN_ICON` + `SearchInput` + `RefreshButton`.
  - `KpiCard`: metric card with `18px–22px` `tabular-nums` value, flat coloured icon in label, and shimmer `loading` state.
  - `Modal`: shared portal dialog with `MODAL_BACKDROP`, `MODAL_PANEL`, `MODAL_HEAD`, `MODAL_CLOSE`, and `MODAL_FOOT`.
- **Form & Shell Style Constants (`@semi/ui/styles`):** `FIELD_LABEL`, `FIELD_INPUT`, `FIELD_TEXTAREA` (`bg-white/[0.05]` so inputs contrast inside `bg-field` modals), and `SHELL_OUTER`, `SHELL_ASIDE`, `SHELL_MAIN`, `SHELL_CONTAINER`.
- **Structural Linter Rules (`lint/semi-lint.mjs`):**
  - `legacy-shell-aside`: bans edge-to-edge `border-r` sidebars and `-translate-x-full` mobile hamburger drawers in favour of `AppShell` + `MobileTabBar`.
  - `legacy-ui-wrapper`: bans local `ui.tsx` wrapper barrels (`PageHeader`, `Select`, `Modal`, `Input`, `Textarea`, `Button`, `EmptyState`) that shadow `@semi/ui`.
  - `input-bg-field`: bans `bg-field` on inputs/textareas (invisible inside `bg-field` modals; enforces `FIELD_INPUT` / `FIELD_TEXTAREA`).
- **Monorepo & Structural Audit (`audit.mjs` & `init.mjs`):** Automatically discovers all frontend apps in a monorepo (`frontend/dashboard`, `frontend/store`, `web/`, `apps/*`) and audits structural alignment with 3D Noobs Studio.

## [0.1.0] - 2026-10-30

### Added
- **Design Tokens (`tokens/tokens.json` → `tokens/tokens.css`):** Dark surface scale (`canvas`, `app`, `panel`, `field`, `raised`, `line`, `line-hover`, `divider`), brand `primary-*` (`#00AE42`), semantic `emerald-*` / `amber-*` / `rose-*` / neutral `gray-*` palettes, and typography tokens (`--font-sans`, `--font-display`, `--font-mono`).
- **Base CSS (`styles/base.css`):** Shimmer skeleton keyframe, hidden scrollbar utility, focus-visible ring, and touch target resets.
- **Style Constants (`@semi/ui/styles`):**
  - `surfaces.ts`: `CARD`, `CARD_HOVER`, `CARD_ACTIVE`, `HERO`, `TILE`, `SECTION_*`, `COUNT_PILL`, `EMPTY`, `ICON_BTN*`, `STATUS_PILL`, `STATUS_DOT`, `STICKY_TOOLBAR`, `MODAL_*`.
  - `buttons.ts`: `BTN_PRIMARY`, `BTN_SECONDARY`, `BTN_DANGER`, `BTN_ICON`, `MODAL_BTN_*`.
  - `appChrome.ts`: `HEADER_ICON_*`, `headerPrimary`, `HEADER_PILL`, `VIEWPORT_*`.
- **Shared React Components (`@semi/ui`):** `Icon`, `IconTile`, `AppHeader`, `PageActions`, `Chip`, `Pills`, `CustomSelect`, `CustomCombobox`, `NumberInput`, `NumPadPopup`, `DatePicker`, `SearchInput`, `Pagination`, `SidePanel`, `RefreshButton`, `Skeleton` (`SkeletonCard`, `SkeletonGrid`, `SkeletonRows`, `PageSkeleton`), `confirmDialog` + `ConfirmHost`, `ExternalLink`, `Markdown`.
- **Linter (`lint/semi-lint.mjs`):** Zero-dependency CLI (`npx semi-lint`) with 15 hard rules, 7 ratchet rules, JSON output mode (`--json`), and per-project `semi-lint.json` configuration.
- **Agent Plugin (`plugin/`):** `semi-design` bundle for Antigravity and Claude Code including `rules/AGENTS.md`, `PostToolUse` auto-lint hook, and skills `semi-ui`, `/semi-init`, `/semi-audit`, and `/semi-update`.
