---
name: semi-audit
description: Read-only UI and structural health check against the Semi Design System (@semi/ui). Scans one or more frontend apps in a workspace, reports visual token gaps, structural alignment with 3D Noobs Studio (AppShell, SubpageToolbar, KpiCard, ui.tsx wrappers, tables), and semi-lint violations without modifying any files. Triggered by /semi-audit.
---

# Semi Design System Health Check (`/semi-audit` — Read-Only)

Use this skill when the user invokes `/semi-audit` to inspect how closely a project follows the Semi Design System (3D Noobs Studio reference) **without changing any code or installing packages**.

> **Important:** `/semi-audit` is strictly **read-only**. Do not install dependencies or edit files during `/semi-audit`. At the end of the report, tell the user whether they should run `/semi-init` (for first-time adoption / full structural refactor) or `/semi-update` (to upgrade an existing `@semi/ui` installation and adopt newer components).

## Workflow

1. **Run the static & structural audit script** on the workspace root (automatically discovers all Next.js/React frontend packages in monorepos such as `frontend/dashboard`, `frontend/store`, `web/`, `apps/*`):
   ```bash
   node "<path-to-this-skill>/scripts/audit.mjs" --cwd "<workspace-or-app-dir>"
   ```
2. **Present a clear, concise Vietnamese report** covering for each discovered frontend app:
   - **Stack & `@semi/ui` status:** Next.js version, Tailwind CSS version (v3 vs v4), `@semi/ui` installed or not, third-party UI libraries.
   - **Structural alignment with 3D Noobs Studio:**
     - `AppShell` + collapsible `w-52`/`w-14` Bento sidebar + `MobileTabBar` (vs legacy `border-r` / hamburger drawer `<aside>`).
     - `PageTitle` / `PageTabsTitle` + `SubpageToolbar` (`STICKY_TOOLBAR` with filters left, icon-only `+` CTA + `SearchInput` + `RefreshButton` right).
     - `KpiCard` (`18px–22px` `tabular-nums`) vs custom small KPI cards.
     - Local `ui.tsx` wrapper barrels shadowing `@semi/ui` or using `bg-field` on `<input>`/`<textarea>`.
     - Raw multi-column HTML `<table>` views vs Bento `CARD` grids and `<Pagination>`.
   - **`semi-lint` violations:** Hard violations (must be 0) and Ratchet debt counts by rule and directory.
   - **Recommended next command:**
     - Suggest `/semi-init` if `@semi/ui` is not installed yet or the app needs full 4-phase structural adoption.
     - Suggest `/semi-update` if `@semi/ui` is already installed and needs to be upgraded to the latest release tag + structural rules.
