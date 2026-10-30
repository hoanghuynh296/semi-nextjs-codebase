---
name: semi-init
description: Set up or adopt the Semi Design System (@semi/ui) in a web project with zero manual terminal commands. Automatically detects whether the workspace is a brand-new project (scaffolds Next.js + Tailwind 4 + @semi/ui + AppShell starter) or an existing codebase (audits, asks targeted multiple-choice questions, gets approval, and executes the 4-phase refactor). Triggered by /semi-init.
---

# Initialize or Adopt Semi Design System (`/semi-init`)

Use this skill when the user invokes `/semi-init` to set up the Semi Design System in a brand-new directory OR to migrate an existing web project to `@semi/ui`.
The user should **never** have to run manual `npm install` or config commands — you run the scripts and only ask the user when decisions are needed.

## Workflow

### Step 1: Detect project mode (New vs Existing)
Run `audit.mjs` to check whether the workspace already contains one or more frontend apps (`package.json`):
```bash
node "<path-to-plugin>/skills/semi-audit/scripts/audit.mjs" --cwd "<target-dir>"
```

---

### Case A — Brand-new / Empty Directory (`No package.json found`)
1. Ask the user (via `ask_question`) for:
   - **Next.js & Tailwind CSS version:**
     - `(Recommended) Latest (next@latest + tailwindcss@latest)` (default)
     - Or a specific version string chosen by the user.
   - **App title & export mode:** (standard Next.js server vs static export `output: "export"`).
2. Run `init.mjs`:
   ```bash
   node "<path-to-this-skill>/scripts/init.mjs" --cwd "<target-dir>" --app-name "<App Title>" --next-version "<latest|ver>" --tailwind-version "<latest|ver>" [--static-export]
   ```
   (Defaults for `--next-version` and `--tailwind-version` are `latest`.)
3. `init.mjs` automatically scaffolds Next.js + Tailwind, installs `@semi/ui` from the latest tag of `github:hoanghuynh296/semi-nextjs-codebase`, configures `transpilePackages: ["@semi/ui"]`, wires `@semi/ui/tokens.css` + `@semi/ui/base.css` + `@source` into `app/globals.css`, sets up Geist + Montserrat Alternates fonts and `<ConfirmHost />` in `app/layout.tsx`, creates a starter page using `AppShell`, `PageTitle`, `SubpageToolbar`, `KpiCard`, `CARD`, `Pills`, `Chip`, `CustomSelect`, writes `semi-lint.json` and `AGENTS.md`, and verifies `semi-lint` + `tsc` + `npm run build`.

---

### Case B — Existing Codebase (One or More Frontend Apps Found)
1. **Present the audit summary** and ask the user the multiple-choice questions listed in **Questions Requiring User Decision** (using `ask_question`):
   - **Target frontend app(s) (if monorepo):** Refactor all discovered frontend apps or a specific one?
   - **Next.js & Tailwind CSS version (always asked):** Default `(Recommended) Latest versions (next@latest + tailwindcss@latest)`, keep current, or custom version.
   - **Layout Shell (`AppShell`):** Replace legacy `<aside>` + mobile hamburger drawer with `@semi/ui`'s floating Bento `AppShell` + collapsible `w-52`/`w-14` sidebar + `MobileTabBar`?
   - **Page Headers, Toolbars & `ui.tsx` Wrappers:** Remove local `ui.tsx` wrappers and standardize every page on `PageTitle`/`PageTabsTitle` + `SubpageToolbar` (icon-only `+` CTA, `SearchInput`, `RefreshButton`) + `Modal` (`MODAL_FOOT`) + `FIELD_INPUT`?
   - **List Views (`<table>` vs Bento `CARD`s):** Convert entity overview grids to Bento `CARD`s (with `IconTile` / `STATUS_DOT`) and add `<Pagination>` to dense transactional tables?
2. **Propose the 4-Phase Refactor Plan and wait for user approval:**
   - **Phase 1 — Install `@semi/ui` & Upgrade Next.js/Tailwind:**
     ```bash
     node "<path-to-this-skill>/scripts/init.mjs" --cwd "<app-dir>" --apply --write-baseline --next-version "<latest|keep|ver>" --tailwind-version "<latest|keep|ver>"
     ```
   - **Phase 2 — Bento `AppShell` & `MobileTabBar`:** Refactor the main layout (`layout.tsx`) to use `AppShell` (floating `rounded-2xl` panels on `bg-canvas`, collapsible `w-52`/`w-14` sidebar with grouped `sections`, and `MobileTabBar` on phones).
   - **Phase 3 — Remove `ui.tsx` Wrappers & Standardize `PageTitle` + `SubpageToolbar` + `KpiCard` + `Modal` + `FIELD_INPUT`:** Replace local wrapper components (`PageHeader`, `Select`, `Input`, `Modal`, `Button`, `EmptyState`, custom `KPICard`) with direct imports from `@semi/ui` and `@semi/ui/styles`.
   - **Phase 4 — Bento Cards, `Pagination` & Zero `semi-lint` Violations:** Upgrade list views (Bento `CARD`s / `IconTile` / `<Pagination>`), replace `font-mono` on numbers/codes with `tabular-nums`, update `semi-lint-baseline.json`, and verify `npx semi-lint` + `npx tsc --noEmit` + `npm run build` are all green.
3. Execute Phases 1–4 after the user approves.
