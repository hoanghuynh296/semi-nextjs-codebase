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

`/semi-init` installs Semi and lays the foundation once; the module-by-module clean-up is `/semi-fix`, working from the
audit file. Done is measured (zero issues), never assumed.

1. **Preview (read-only for source files).**
   ```bash
   node "<path-to-plugin>/skills/semi-audit/scripts/audit.mjs" --cwd "<app-dir>"   # summary + semi-audit.md
   node "<path-to-this-skill>/scripts/init.mjs" --cwd "<app-dir>" --dry-run        # semi-codemod-report.md, changes nothing
   ```
2. **Ask the decisions** (`ask_question`, see **Questions Requiring User Decision** in the audit's `--json` output):
   target app(s) in a monorepo, Next.js / Tailwind versions, brand colour (`primary-*` override), and which
   structural items to adopt (`AppShell` + `MobileTabBar`, `PageTitle` + `SubpageToolbar`, Bento `Card` grids,
   `KpiCard`, `Pagination`, what to do with each duplicate local component). Record every "keep" answer in
   `semi-lint.json` as `"keep": { "<check>": "<reason>" }` so later audits do not ask again.
3. **Install (after approval):**
   ```bash
   node "<path-to-this-skill>/scripts/init.mjs" --cwd "<app-dir>" --apply --next-version "<latest|keep|ver>" --tailwind-version "<latest|keep|ver>"
   ```
   It installs `@semi/ui`, wires `tokens.css` / `base.css` / `@source` and `transpilePackages`, writes `semi-lint.json`
   and `AGENTS.md`, runs the token codemod and records a ratchet baseline. Then edit the root layout yourself:
   `<html suppressHydrationWarning>`, `<ThemeScript />` in `<head>`, body wrapped in `<ThemeProvider>` with
   `<ConfirmHost />` and `<ToastHost />` (README §3).
4. **Hand over to `/semi-fix`:** run `/semi-audit` again (it rewrites `semi-audit.md` with what is left after the
   install), then follow the `/semi-fix` workflow until the audit is clean: decisions, codemod, hand fixes per module,
   verify, shrink the baseline, both themes checked.
5. **Finish:** report token coverage before → after. The adoption is complete when the audit finds nothing and
   `semi-audit.md` is gone.
