---
name: semi-audit
description: Analyze an existing web project (including multi-app monorepos) before adopting or refactoring to the Semi Design System (@semi/ui). Audits both visual tokens and structural layout (AppShell, SubpageToolbar, KpiCard, local ui.tsx wrappers, raw tables), asks the user targeted multiple-choice questions, and creates a 4-phase refactor plan. Triggered by /semi-audit or automatically by /semi-init on existing codebases.
---

# Audit Existing Project for Semi Design System (`/semi-audit`)

Use this skill when the user invokes `/semi-audit`, or as Step 1 of `/semi-init` when the target directory already contains one or more existing web codebases.

## Workflow

### Step 1: Run the deterministic audit script
Run `audit.mjs` on the workspace root (it automatically discovers all Next.js/React frontend packages in monorepos such as `frontend/dashboard`, `frontend/store`, `web/`, `apps/*`):
```bash
node "<path-to-this-skill>/scripts/audit.mjs" --cwd "<workspace-or-app-dir>"
```
Add `--json` if you want raw JSON output.

The script scans every discovered frontend app for:
- **Stack & dependencies:** Next.js version, React version, Tailwind CSS version (v3 vs v4), third-party UI libraries (`@mui/*`, `antd`, `@chakra-ui/*`, `@radix-ui/*`, `shadcn`, `styled-components`, `@emotion/*`, `lucide-react`).
- **Structural Alignment with 3D Noobs Studio (Semi v0.2.0):**
  - Whether the layout uses `@semi/ui`'s floating 2-panel Bento `AppShell` + collapsible `w-52`/`w-14` sidebar + `MobileTabBar` (or a legacy `border-r` / hamburger drawer `<aside>`).
  - How many pages use `SubpageToolbar` (`STICKY_TOOLBAR` with filters left and icon-only `BTN_PRIMARY BTN_ICON` + `SearchInput` + `RefreshButton` right) vs legacy `PageHeader` with text buttons.
  - Whether `KpiCard` (`18px–22px` `tabular-nums`) is used for KPI metrics.
  - Whether a local `ui.tsx` wrapper barrel exists (`legacy-ui-wrapper` / `input-bg-field` violations).
  - Which pages render raw HTML `<table>` without `<Pagination>` or Bento `CARD` grids.
- **Hard-coded colours & tokens:** Hex colours (`#...`), legacy grey surfaces (`bg-gray-800/900`), off-scale radii (`rounded-md`), and typography (`text-xs/sm`, `font-bold`) mapped to the nearest Semi token by RGB distance.

### Step 2: Present summary & ask targeted questions
Ask multiple-choice questions (using `ask_question` tool) for the items flagged under **Questions Requiring User Decision**:
1. **Target frontend app(s) (if monorepo):** Refactor all discovered frontend apps or a specific one?
2. **Next.js & Tailwind CSS version (always asked):** Default to `(Recommended) Latest versions (next@latest + tailwindcss@latest)`, or keep current / specify custom versions.
3. **Layout Shell (`AppShell`):** Replace legacy `<aside>` + mobile hamburger drawer with `@semi/ui`'s floating Bento `AppShell` + grouped sidebar sections + `MobileTabBar`?
4. **Page Headers, Toolbars & `ui.tsx` Wrappers:** Remove local `ui.tsx` wrappers and standardize every page on `PageTitle`/`PageTabsTitle` + `SubpageToolbar` (icon-only `+` CTA, `SearchInput`, `RefreshButton`) + `Modal` (`MODAL_FOOT`) + `FIELD_INPUT`?
5. **List Views (`<table>` vs Bento `CARD`s):** Convert entity overview grids to Bento `CARD`s (with `IconTile` / `STATUS_DOT`) and add `<Pagination>` to dense transactional tables?

### Step 3: Propose the 4-phase refactor plan and wait for approval
Present a concise 4-phase plan based on the user's answers:
- **Phase 1 — Install `@semi/ui` v0.2.0 & Upgrade Next.js/Tailwind:** Run `init.mjs --apply --write-baseline` on each selected frontend app to install `@semi/ui`, wire `@semi/ui/tokens.css` + `@semi/ui/base.css` + `@source` into `globals.css`, and configure `transpilePackages: ["@semi/ui"]`.
- **Phase 2 — Bento `AppShell` & `MobileTabBar`:** Refactor the main dashboard/app layout (`layout.tsx`) to use `AppShell` (floating `rounded-2xl` panels on `bg-canvas`, collapsible `w-52`/`w-14` sidebar with grouped sections, and `MobileTabBar` on phones).
- **Phase 3 — Remove `ui.tsx` Wrappers & Standardize `PageTitle` + `SubpageToolbar` + `Modal` + `FIELD_INPUT`:** Replace local wrapper components (`PageHeader`, `Select`, `Input`, `Modal`, `Button`, `EmptyState`, custom `KPICard`) with direct imports from `@semi/ui` (`PageTitle` / `PageTabsTitle`, `SubpageToolbar`, `KpiCard`, `Modal` with `MODAL_FOOT`, `CustomSelect`, `FIELD_INPUT`, `FIELD_TEXTAREA`).
- **Phase 4 — Bento Cards, `Pagination` & Zero `semi-lint` Violations:** Upgrade list views (Bento `CARD`s / `IconTile` / `<Pagination>`), replace `font-mono` on numbers/codes with `tabular-nums`, update `semi-lint-baseline.json`, and verify `npx semi-lint` + `npx tsc --noEmit` + `npm run build`.

Wait for user confirmation before executing Phases 1–4.
