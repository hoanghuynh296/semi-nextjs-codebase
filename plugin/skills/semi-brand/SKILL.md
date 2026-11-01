---
name: semi-brand
description: Create or change a brand on the Semi Design System - a brand kit repo (brand.json → brand.css, fonts, BRAND.md, agent rules) that every product of that brand installs, so they all share its colours, fonts and allowed styles. Asks the few independent choices (primary, optional secondary, neutrals, styles, fonts), derives the rest with contrast checks, previews it, and releases a tag. "/semi-brand update" regenerates a kit for a newer @semi/ui. Triggered by /semi-brand.
---

# Brand kit (`/semi-brand`)

Semi core → **brand kit** (one repo per brand, e.g. `3dnoobs/brand`) → products. The person decides a few things once,
here; Semi derives the rest (scales, accent / on-accent shades of both themes, neutrals of every allowed style) and
checks WCAG AA. The user guide with the full step-by-step example is `node_modules/@semi/ui/docs/BRANDS.md` (in the
Semi repo: `docs/BRANDS.md`); point the user to it.

Run this skill **in the brand kit repo**, never in a product. Products use the kit with `/semi-init --brand`,
`/semi-update` and `/semi-style`.

## Create a brand (empty folder)

1. Check the folder: if it has `brand.json`, it is an existing kit → go to "Change a brand". If it has a product
   (`package.json` with `next` / `react`), stop: brands live in their own repo.
2. **Ask** (`AskUserQuestion`, at most 4 per call), only these:
   - Brand name and package name (`@<scope>/brand`).
   - Primary colour (hex, or read it from a logo the user sends). Never invent one: it is the brand's own decision.
   - Secondary colour: none (Recommended) or a hex; you may suggest an analogous / complementary one.
   - Neutrals: "tinted" (Recommended: the styles' greys lean towards the primary) or "preset" (the style palettes as
     they are; then ask which palette per allowed style).
   - Default style and allowed styles (Flat / Soft / Sharp, `docs/STYLES.md`): dashboards / tools → Flat; consumer
     apps → Soft; editorial / landing → Sharp.
   - Fonts: sans and display, from Geist, Inter, Plus Jakarta Sans, Space Grotesk, Manrope, DM Sans, Nunito, Lexend,
     Montserrat, Montserrat Alternates, Be Vietnam Pro (or another Google font).
3. **Create:**
   ```bash
   node "<path-to-this-skill>/scripts/brand.mjs" create --cwd "<dir>" --name "<Name>" --package "@scope/brand" \
     --primary "#hex" [--secondary "#hex"] --neutral tinted --style flat --allow flat,soft --sans "Geist" --display "Montserrat Alternates"
   ```
   It writes `package.json`, `brand.json`, `README.md`, installs `@semi/ui`, builds `dist/brand.css`,
   `dist/brand.json`, `BRAND.md`, `AGENTS.brand.md` and prints the Brand preview link.
4. **Preview:** open the printed link (the Storybook "Brand preview" page with this brand applied to every component;
   switch theme and styles there). Read the contrast table and the warnings in `BRAND.md`; tell the user in a few lines.
5. **Adjust** what the user asks ("darker primary", "use the preset neutrals"):
   ```bash
   node "<path-to-this-skill>/scripts/brand.mjs" set --cwd "<dir>" primary=#008f36 neutral=preset palette.soft=sage
   ```
   Keys: `primary`, `secondary` (`none` to remove), `name`, `neutral`, `allow`, `style`, `sans`, `display`,
   `palette.<style>`. It rebuilds and says the change level.
6. **Release** when the user approves: `npm run check`, `node brand.mjs bump --cwd "<dir>" 1.0.0`, commit, push to the
   brand's GitHub repo (ask the user to create it if needed), tag `v1.0.0`, push the tag. Products install it with
   `/semi-init --brand github:<owner>/<repo>`.

## Change a brand (existing kit)

Same as steps 5–6: `set …` for the change, preview, then bump by the level it prints (major when colours / fonts that
people see change, minor for new options such as an allowed style, patch otherwise) and tag. Then tell the user to run
`/semi-update` in each product (a major one asks first).

## `/semi-brand update` (new @semi/ui)

```bash
node "<path-to-this-skill>/scripts/brand.mjs" update --cwd "<kit-dir>"
```

Installs the newest `@semi/ui`, sets `"semi"` in `brand.json` to it, rebuilds, and prints the change level. Bump by that
level, commit, tag, push; then products get it with `/semi-update`. It never changes the brand's choices.
