---
name: semi-style
description: Show or switch the Semi style (Flat, Soft, Sharp) of apps that use @semi/ui - sets "style" in semi-lint.json and data-style on <html>, prints the next/font lines for the style's fonts, then compares screenshots before / after in both themes. A style changes neutral colours, fonts, radii, card border / shadow and control sizes; components, layout and the brand accent stay. Triggered by /semi-style.
---

# Switch the Semi style (`/semi-style`)

A Semi **style** is the look of the whole UI: neutral colours, fonts, radii (`rounded-chip` · `control` · `card` ·
`panel`), card border and shadow (`border-card`, `shadow-card`) and control sizes (`h-control`, `h-field`). Every style
has the same components, layout, accent and status colours, and both themes (light / dark). The styles are listed in
`node_modules/@semi/ui/tokens/styles.json` and described in
`node_modules/@semi/ui/docs/STYLES.md`.

An app picks one style and one of its three palettes (colour variants of the neutrals), once: `"style"` / `"palette"`
in `semi-lint.json` and `data-style` / `data-palette` on `<html>` in the root layout. It is not
a per-user setting like the theme.

Where the style is chosen first: `/semi-init` (new app) and `/semi-fix` foundation (existing app). This command is for
changing it later.

## Workflow

1. **Show** the current style and the choices:
   ```bash
   node "<path-to-this-skill>/scripts/style.mjs" --cwd "<workspace-or-app-dir>"
   ```
2. **Ask** (`AskUserQuestion`) which style, one option per style with its description; mark the current one. Then
   which palette of that style (three, the first is the default). Skip what the user already named; "only another
   colour" means a palette of the current style.
3. **Screenshots before:** 3–5 key pages in both themes (dev server + browser, when available).
4. **Switch:**
   ```bash
   node "<path-to-this-skill>/scripts/style.mjs" --cwd "<workspace-or-app-dir>" --to "<id>" [--palette "<id>"] [--only "<app-dir>"]
   # or only the colours of the current style:
   node "<path-to-this-skill>/scripts/style.mjs" --cwd "<workspace-or-app-dir>" --palette "<id>"
   ```
   If the installed `@semi/ui` has no styles yet, run `/semi-update` first. When the layout does not load the new
   style's fonts, the script prints the `next/font` lines: add them to the root layout's imports and `<html className>`
   (the old style's fonts can go, unless the app uses them elsewhere).
5. **Screenshots after**, compare. Expected: colours, fonts, radii, card borders and control heights change everywhere
   at once. Places that did not change use raw classes (`bg-white`, `rounded-lg`, `h-[34px]`, `shadow-sm`): they are lint hits (`no-literal-palette`, `radius-token` …), fixed
   by `/semi-audit` + `/semi-fix` (the token codemod maps them). Never add style-specific classes to the app.
6. **Report** in a few lines: old style → new style per app, and the files changed (`semi-lint.json`, the layout).
   Do not commit unless the user asks.
