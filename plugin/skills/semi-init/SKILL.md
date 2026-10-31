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

The goal is a migration that misses nothing: every file is inventoried, every change is reviewable, and "done" is measured
(zero findings), never assumed. A ratchet baseline is only a temporary safety net between PRs.

1. **Inventory (read-only).**
   ```bash
   node "<path-to-plugin>/skills/semi-audit/scripts/audit.mjs" --cwd "<app-dir>" --inventory "<app-dir>/semi-migration.json"
   node "<path-to-this-skill>/scripts/init.mjs" --cwd "<app-dir>" --dry-run   # writes semi-codemod-report.md, changes nothing
   ```
   `semi-migration.json` lists every file with colour / size debt per rule, grouped by module, plus the token coverage %.
   `semi-codemod-report.md` shows each automatic replacement (`bg-white` → `bg-panel`, `bg-white dark:bg-slate-900` →
   `bg-panel`) and every token that has **no safe mapping** (needs a human decision).
2. **Present the audit summary + codemod preview** and ask the multiple-choice questions in **Questions Requiring User
   Decision** (`ask_question`): target app(s) in a monorepo, Next.js / Tailwind versions, brand colour (`primary-*`
   override), what to do with each duplicate local component, and which **Pattern** items to adopt (below).
3. **Propose the plan as two tracks, one PR per module** (modules = the `modules` keys of `semi-migration.json`, biggest
   first), and wait for approval:
   - **Track A — Foundation (mandatory for every Semi app):**
     - **A1 Install:** `init.mjs --apply` installs `@semi/ui`, wires `tokens.css` / `base.css` / `@source` and
       `transpilePackages`, writes `semi-lint.json`, runs the codemod (same as the dry-run report) and records a
       baseline. Then edit the root layout yourself: `<html suppressHydrationWarning>`, `<ThemeScript />` in `<head>`,
       body wrapped in `<ThemeProvider>` with `<ConfirmHost />` and `<ToastHost />` (see README §3).
       ```bash
       node "<path-to-this-skill>/scripts/init.mjs" --cwd "<app-dir>" --apply --next-version "<latest|keep|ver>" --tailwind-version "<latest|keep|ver>"
       ```
     - **A2 Per module:** resolve every unresolved token from the report by hand (pick a token, never re-add a
       physical colour), replace native controls / local wrappers with `@semi/ui` (`Button`, `Field` + `Input`,
       `CustomSelect`, `DatePicker`, `NumberInput`, `Checkbox`, `Switch`, `Modal`, `Drawer`, `Tabs`, `Menu`, `toast`,
       `Alert`, `Table`, `EmptyState`), and type sizes to the scale (`text-caption` … `text-display`).
   - **Track B — Patterns (opt-in, per user answers):** `AppShell` + `MobileTabBar`, `PageTitle` / `PageTabsTitle` +
     `SubpageToolbar`, Bento `Card` grids instead of entity tables, `KpiCard`, `Pagination`.
4. **Definition of Done for every module PR** (check all before moving on):
   - `npx semi-lint` reports **0 findings for the module's files** — re-run `npx semi-lint --update-baseline` so the
     baseline shrinks; never raise it and never add a `skip` for a whole folder.
   - `npx tsc --noEmit` and the production build pass.
   - Screens of the module checked in **both themes** (`data-theme="light"` and `"dark"`): no white boxes in dark, no
     unreadable text in light, focus ring visible when tabbing.
   - Inventory re-run: the module's `findings` is 0 and the coverage % went up.
5. **Finish:** final `audit.mjs --inventory` shows **0 findings in every module** and `semi-lint-baseline.json` has no
   colour / size entries left. Report coverage before → after to the user. Only then is the migration complete.
