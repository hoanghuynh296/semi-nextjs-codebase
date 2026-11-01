---
name: semi-init
description: Create a NEW web app on the Semi Design System (@semi/ui) with zero manual terminal commands - scaffolds Next.js + Tailwind 4 + @semi/ui in the style the user picks (Flat, Soft, …) with the Semi starter (AppShell, providers, fonts, semi-lint, AGENTS.md) and verifies it builds. Only for an empty folder; an existing app adopts Semi with /semi-audit + /semi-fix. Triggered by /semi-init.
---

# Create a new Semi app (`/semi-init`)

The Semi commands, one job each:

| Situation | Command |
|---|---|
| New app (empty folder) | **`/semi-init`**: ready and clean, no audit or fix needed |
| New product of a brand | **`/semi-init --brand github:<owner>/<repo>`** (the brand kit made with `/semi-brand`) |
| Existing app, with or without `@semi/ui` | **`/semi-audit`** → **`/semi-fix`** (installing Semi is the first phase of the fix) |
| Move to a newer `@semi/ui` | **`/semi-update`** (also runs that release's migrations) |
| Change the style (Flat, Soft, …) later | **`/semi-style`** |

The user should **never** have to run `npm install` or config commands: you run the script and only ask decisions.

## Workflow

1. **Check the folder.** If it (or a subfolder) already has a `package.json` with `next` or `react`, stop: this is an
   existing app, nothing is changed. Tell the user to run `/semi-audit`, then `/semi-fix`. (`init.mjs` refuses such a
   folder too: it prints the apps it found and exits 10.)
2. **Ask** (`ask_question`). If the product belongs to a brand (the user names it, or gives a brand kit repo), pass
   `--brand <spec>` and ask only the app title, export mode and a style among the brand's allowed ones: colours, fonts
   and palettes come from the brand.
   - Next.js version: `(Recommended) latest`, or a version.
   - App title, and the export mode: Next.js server (default) or static export (`output: "export"`).
   - Style: one option per style in `tokens/styles.json` of this plugin (`skills/semi-audit/scripts/vendor/styles.json`),
     with its description; `(Recommended)` on the default (Flat) unless the app is clearly consumer-facing (Soft).
   - Palette of that style: its three `palettes` with descriptions, `(Recommended)` on the first (the default).
3. **Create:**
   ```bash
   node "<path-to-this-skill>/scripts/init.mjs" --cwd "<target-dir>" --app-name "<App Title>" --next-version "<latest|ver>" --style "<id>" [--palette "<id>"] [--brand "<github:owner/repo | file:../kit>"] [--static-export]
   ```
   It runs `create-next-app` (TypeScript, Tailwind 4, App Router), installs `@semi/ui` from the latest tag of
   `github:hoanghuynh296/semi-nextjs-codebase`, sets `transpilePackages`, wires `tokens.css` + `base.css` + `@source`
   into `app/globals.css`, writes `app/layout.tsx` (Geist + Montserrat Alternates, `ThemeScript`, `ThemeProvider`,
   `ToastHost`, `ConfirmHost`) and a starter page (`AppShell`, `PageTitle`, `SubpageToolbar`, `KpiCard`, `CARD`, …),
   `semi-lint.json` (with `"style"`), `data-style` on `<html>`, and `AGENTS.md`. With `--brand` it installs the kit
   first (its `"semi"` range picks the `@semi/ui` version), imports its `brand.css`, writes the brand's fonts and its
   rules block, and sets `"brand"` in `semi-lint.json`. Then it verifies `semi-lint` + `tsc` + `npm run build`.
4. **Report** in a few lines: where the app is, the `@semi/ui` version, the style, and that the checks passed.
