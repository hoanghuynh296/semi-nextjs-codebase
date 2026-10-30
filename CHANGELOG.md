# Changelog

All notable changes to the **Semi Design System** (`@semi/ui` and `semi-design` plugin) are documented in this file.

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
