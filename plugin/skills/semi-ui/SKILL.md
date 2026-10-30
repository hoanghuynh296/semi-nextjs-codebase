---
name: semi-ui
description: Apply the Semi Design System (@semi/ui) to Next.js 16 + React 19 + Tailwind 4 components and pages. Activate automatically whenever creating, modifying, reviewing, or styling any web UI component, page, layout, modal, form, or CSS in a Semi ecosystem project.
---

# Semi Design System (`semi-ui`)

The Semi Design System rules live in **one single source of truth**:
- `node_modules/@semi/ui/docs/QUICK_REF.md` (cheatsheet — read first)
- `node_modules/@semi/ui/docs/DESIGN_SYSTEM.md` (complete specification)
- `node_modules/@semi/ui/docs/DECISIONS.md` (decision log)

If `@semi/ui` is not installed yet in the project, run `/semi-init` first.

## Workflow for Every UI Change

1. **Read the Quick Reference** (`node_modules/@semi/ui/docs/QUICK_REF.md`, plus the project's `docs/UI_EXTENSIONS.md` if present) before making your first UI edit.
2. **Import directly from `@semi/ui` and `@semi/ui/styles`** — never create or keep a local `components/ui.tsx` wrapper barrel:
   - **Layout & Page Structure (`@semi/ui`):** `AppShell`, `MobileTabBar`, `PageTitle`, `PageTabsTitle`, `SubpageToolbar`, `KpiCard`, `Modal`.
   - **Controls (`@semi/ui`):** `Icon`, `IconTile`, `AppHeader`, `PageActions`, `Chip`, `Pills`, `CustomSelect`, `CustomCombobox`, `NumberInput`, `NumPadPopup`, `DatePicker`, `SearchInput`, `Pagination`, `SidePanel`, `RefreshButton`, `Skeleton`, `SkeletonCard`, `SkeletonGrid`, `SkeletonRows`, `PageSkeleton`, `confirmDialog`, `ConfirmHost`, `ExternalLink`, `Markdown`.
   - **Styles (`@semi/ui/styles`):** `SHELL_*`, `CARD`, `CARD_HOVER`, `CARD_ACTIVE`, `HERO`, `TILE`, `SECTION_HEAD`, `SECTION_TITLE`, `COUNT_PILL`, `EMPTY`, `ICON_BTN`, `ICON_BTN_DANGER`, `STATUS_PILL`, `STATUS_DOT`, `STICKY_TOOLBAR`, `MODAL_BACKDROP`, `MODAL_PANEL`, `MODAL_HEAD`, `MODAL_TITLE`, `MODAL_FOOT`, `MODAL_CLOSE`, `FIELD_LABEL`, `FIELD_INPUT`, `FIELD_TEXTAREA`, `BTN_PRIMARY`, `BTN_SECONDARY`, `BTN_DANGER`, `BTN_ICON`, `MODAL_BTN_PRIMARY`, `MODAL_BTN_SECONDARY`, `MODAL_BTN_DANGER`, `HEADER_ICON_BASE`, `HEADER_ICON_IDLE`, `HEADER_ICON_ACTIVE`, `headerPrimary`, `HEADER_PILL`, `VIEWPORT_TOOLBAR`, `VIEWPORT_PILL`.
3. **If the user decides or changes a shared UI rule:**
   - Update `docs/DESIGN_SYSTEM.md`, `docs/QUICK_REF.md`, `docs/DECISIONS.md` (and `lint/semi-lint.mjs` when checkable) in the `semi-nextjs-codebase` repository (`https://github.com/hoanghuynh296/semi-nextjs-codebase`), release a new semver tag, and run `/semi-update` in consumer projects.
   - Never record shared UI rules only in agent memory, skills, or a single project's `AGENTS.md`.
   - Only app-specific patterns (e.g. a 3D viewport or hardware dashboard widget layout) go into that project's `docs/UI_EXTENSIONS.md`.
4. **Verify before finishing:**
   - Run `npx semi-lint` (or `npm run semi:lint`). Hard rules must have **0 violations**; ratchet rules must not exceed `semi-lint-baseline.json` (run `npx semi-lint --update-baseline` when you reduce ratchet hits).
   - Run `npx tsc --noEmit` and check responsive behaviour at 375px (phone), 768px/1024px (iPad), and 1440px (desktop).
