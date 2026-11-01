---
name: semi-style
description: Show or switch the Semi style (Flat, Soft, …) of apps that use @semi/ui - sets "style" in semi-lint.json and data-style on <html> in the root layout, then compares screenshots before / after in both themes. A style changes only shape tokens (radii, card shadow); components, colours and layout stay. Triggered by /semi-style.
---

# Switch the Semi style (`/semi-style`)

A Semi **style** is the shape of the whole UI: radii (`rounded-chip` · `control` · `card` · `panel`) and the resting
card shadow (`shadow-card`). Every style has the same components, colours, type and layout rules, and both themes
(light / dark). The styles are listed in `node_modules/@semi/ui/tokens/styles.json` and described in
`node_modules/@semi/ui/docs/STYLES.md`.

An app picks one style, once: `"style"` in `semi-lint.json` and `data-style` on `<html>` in the root layout. It is not
a per-user setting like the theme.

Where the style is chosen first: `/semi-init` (new app) and `/semi-fix` foundation (existing app). This command is for
changing it later.

## Workflow

1. **Show** the current style and the choices:
   ```bash
   node "<path-to-this-skill>/scripts/style.mjs" --cwd "<workspace-or-app-dir>"
   ```
2. **Ask** (`AskUserQuestion`) which style, one option per style with its description; mark the current one. Skip
   when the user already named it.
3. **Screenshots before:** 3–5 key pages in both themes (dev server + browser, when available).
4. **Switch:**
   ```bash
   node "<path-to-this-skill>/scripts/style.mjs" --cwd "<workspace-or-app-dir>" --to "<id>" [--only "<app-dir>"]
   ```
   If the installed `@semi/ui` has no styles yet, run `/semi-update` first.
5. **Screenshots after**, compare. Expected: radii and card shadows change everywhere at once. Places that did not
   change use raw classes (`rounded-lg`, `rounded-[10px]`, `shadow-sm`): they are `radius-token` lint hits, fixed by
   `/semi-audit` + `/semi-fix` (the token codemod maps them). Never add style-specific classes to the app.
6. **Report** in a few lines: old style → new style per app, and the files changed (`semi-lint.json`, the layout).
   Do not commit unless the user asks.
