---
name: semi-init
description: Create a NEW web app on the Semi Design System (@semi/ui) with zero manual terminal commands - scaffolds Next.js + Tailwind 4 + @semi/ui with the Semi starter (AppShell, providers, fonts, semi-lint, AGENTS.md) and verifies it builds. Only for an empty folder; an existing app adopts Semi with /semi-audit + /semi-fix. Triggered by /semi-init.
---

# Create a new Semi app (`/semi-init`)

The Semi commands, one job each:

| Situation | Command |
|---|---|
| New app (empty folder) | **`/semi-init`**: ready and clean, no audit or fix needed |
| Existing app, with or without `@semi/ui` | **`/semi-audit`** → **`/semi-fix`** (installing Semi is the first phase of the fix) |
| Move to a newer `@semi/ui` | **`/semi-update`** (also runs that release's migrations) |

The user should **never** have to run `npm install` or config commands: you run the script and only ask decisions.

## Workflow

1. **Check the folder.** If it (or a subfolder) already has a `package.json` with `next` or `react`, stop: this is an
   existing app, nothing is changed. Tell the user to run `/semi-audit`, then `/semi-fix`. (`init.mjs` refuses such a
   folder too: it prints the apps it found and exits 10.)
2. **Ask** (`ask_question`):
   - Next.js version: `(Recommended) latest`, or a version.
   - App title, and the export mode: Next.js server (default) or static export (`output: "export"`).
3. **Create:**
   ```bash
   node "<path-to-this-skill>/scripts/init.mjs" --cwd "<target-dir>" --app-name "<App Title>" --next-version "<latest|ver>" [--static-export]
   ```
   It runs `create-next-app` (TypeScript, Tailwind 4, App Router), installs `@semi/ui` from the latest tag of
   `github:hoanghuynh296/semi-nextjs-codebase`, sets `transpilePackages`, wires `tokens.css` + `base.css` + `@source`
   into `app/globals.css`, writes `app/layout.tsx` (Geist + Montserrat Alternates, `ThemeScript`, `ThemeProvider`,
   `ToastHost`, `ConfirmHost`) and a starter page (`AppShell`, `PageTitle`, `SubpageToolbar`, `KpiCard`, `CARD`, …),
   `semi-lint.json` and `AGENTS.md`, then verifies `semi-lint` + `tsc` + `npm run build`.
4. **Report** in a few lines: where the app is, the `@semi/ui` version, and that the checks passed.
