---
name: semi-init
description: Set up or adopt the Semi Design System (@semi/ui) in a web project with zero manual terminal commands. Automatically detects whether the workspace is a brand-new project (scaffolds Next.js + Tailwind 4 + @semi/ui + AppShell starter) or an existing codebase (audits, asks targeted multiple-choice questions, gets approval, and executes the 4-phase refactor). Triggered by /semi-init.
---

# Initialize or Adopt Semi Design System (`/semi-init`)

Use this skill when the user invokes `/semi-init` to set up the Semi Design System in a brand-new directory OR to migrate an existing web project to `@semi/ui`.
The user should **never** have to run manual `npm install` or config commands — you run the scripts and only ask the user when decisions are needed.

## Workflow

### Step 1: Detect project mode (New vs Existing)
```bash
node "<path-to-this-skill>/scripts/init.mjs" --cwd "<target-dir>"
```
No `package.json` → Case A. Otherwise it prints the apps it found (exit 10) and installs nothing yet → Case B. An app
that already has `@semi/ui` needs no `/semi-init`: say so and point to `/semi-audit` (check) or `/semi-update` (new
version).

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

### Case B — Existing app without `@semi/ui`

`/semi-init` only installs and wires Semi; it does not touch the app's own code. Refactoring the app is the next step:
`/semi-audit`, then `/semi-fix`.

1. **Ask** (`ask_question`): which app(s) in a monorepo, Next.js / Tailwind versions (`latest`, `keep` or a version),
   and the brand colour if the app has one (`primary-*` override in `globals.css`).
2. **Install:**
   ```bash
   node "<path-to-this-skill>/scripts/init.mjs" --cwd "<app-dir>" --apply --next-version "<latest|keep|ver>" --tailwind-version "<latest|keep|ver>"
   ```
   It installs `@semi/ui`, wires `tokens.css` / `base.css` / `@source` and `transpilePackages`, writes `semi-lint.json`
   and `AGENTS.md`, and records a `semi-lint` baseline of today's debt (so the edit hook blocks only new debt). Then
   edit the root layout yourself: `<html suppressHydrationWarning>`, `<ThemeScript />` in `<head>`, body wrapped in
   `<ThemeProvider>` with `<ConfirmHost />` and `<ToastHost />` (README §3). `tsc` and the build must pass; old lint
   hits are expected at this point.
3. **Report** in a few lines what was installed and the next commands: **`/semi-audit`**, then **`/semi-fix`**.

A new app (Case A) starts clean from the Semi starter and needs no audit or fix.
