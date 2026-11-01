---
name: semi-brand
description: Create or change a brand on the Semi Design System - a brand kit repo (brand.json → brand.css, fonts, logo, BRAND.md guideline, agent rules) that every product of that brand installs, so they all share its colours, fonts, logo, voice and allowed styles. Starts from a brief (product, audience, personality), asks the few independent choices (logo, primary, optional secondary, neutrals, styles, fonts, voice, colour use), derives the rest with contrast checks, previews it, and releases a tag.
---

# Brand kit (`/semi-brand`)

Semi core → **brand kit** (one repo per brand, e.g. `3dnoobs/brand`) → products. The person decides a few things once,
here; Semi derives the rest (scales, accent / on-accent shades of both themes, neutrals of every allowed style) and
checks WCAG AA. The user guide with the full step-by-step example is `node_modules/@semi/ui/docs/BRANDS.md` (in the
Semi repo: `docs/BRANDS.md`); point the user to it.

Run this skill **in the brand kit repo**, never in a product. Products use the kit with `/semi-new-app --brand`,
and `/semi-sync`.

## Create a brand (empty folder)

1. Check the folder: if it has `brand.json`, it is an existing kit → go to "Change a brand". If it has a product
   (`package.json` with `next` / `react`), stop: brands live in their own repo.
2. **Brief first, then choices** (`AskUserQuestion`, at most 4 per call). A designer decides from a brief, so ask it
   before any colour, and use the answers to recommend (say why) instead of asking blind. If the user pasted a
   brand.json (the docs site's Brand preview copies one with "Copy lệnh cho agent"), save it to a file, create with
   `--from <file>` and ask only what is missing.
   - **Brief:** what the product is, who uses it (age, context: phone in a hurry, desk all day), 3 personality words
     ("nhanh, vui vẻ, đáng tin"), and a one-line tagline if they have one. Stored as `product`, `audience`,
     `personality`, `tagline`.
   - Brand name and package name (`@<scope>/brand`).
   - **Logo** (recommended): ask for the files (SVG best; a dark-background version and a square mark if they have
     them), put them in `assets/`. For an SVG run `brand.mjs colors assets/logo.svg` and offer its colours as the
     primary / secondary. A PNG: read the colour by eye and ask the user to confirm the exact hex.
   - Primary colour (hex). Never invent one: it is the brand's own decision.
   - Secondary colour: none (Recommended unless the logo has a second colour) or a hex, and its role: highlight
     (Recommended), badge or illustration.
   - Neutrals: "tinted" (Recommended: the styles' greys lean towards the primary) or "preset" (each style's own
     neutrals as they are).
   - Style, from the brief (`docs/STYLES.md`): dashboards / tools → Flat; consumer apps → Soft; editorial / landing →
     Sharp. If the user is unsure, allow all three at first so they can switch styles in the preview, and narrow
     `allow` before releasing.
   - Fonts: sans and display, from Geist, Inter, Plus Jakarta Sans, Space Grotesk, Manrope, DM Sans, Nunito, Lexend,
     Montserrat, Montserrat Alternates, Be Vietnam Pro (or another Google font with Vietnamese). Recommend a pair from
     the personality words.
   - **Voice:** tone friendly / neutral / formal (recommend from the brief), how to address the user ("bạn",
     "anh/chị", "quý khách"), what the brand calls itself, emoji yes / no. Then draft, and let the user correct,
     2 do's, 2 don'ts and example texts for a button, an error and an empty state, in the brand's voice; write them
     into `brand.json` → `voice.do`, `voice.dont`, `voice.examples` (`{ "button": [...], "error": "…", "empty": "…" }`).
   - **Colour use:** how much accent: restrained (Recommended for tools), balanced, expressive (consumer, marketing).
   - Imagery (optional): one or two sentences on photos / illustration.
   - **Signature** (what makes the brand's screens its own beyond colour; one question with the inferred values as
     the Recommended option): the build already infers them from the brief (`BRAND.md` → "Chữ ký thương hiệu" says which
     were inferred), so say what it inferred and why, and offer to change: density compact / regular / airy (tools all
     day → compact; consumer, premium → airy), type scale even / contrast (contrast for bold, editorial, marketing),
     title weight light / regular / strong, big numbers in the sans or the display font, and the motif: the logo mark
     (needs an SVG mark), dots, lines, grid or none. Show them on the preview's "Chữ ký thương hiệu" section.
3. **Create:**
   ```bash
   node "<path-to-this-skill>/scripts/brand.mjs" create --cwd "<dir>" --name "<Name>" --package "@scope/brand" \
     --primary "#hex" [--secondary "#hex"] --neutral tinted --style flat --allow flat,soft --sans "Geist" --display "Montserrat Alternates"
   ```
   then the guideline with `set` (step 5 keys), and the voice lists / examples by editing `brand.json`, then
   `brand.mjs build`. It writes `package.json`, `brand.json`, `README.md`, `.gitignore` and the Pages workflow
   (`.github/workflows/brand-pages.yml`), installs `@semi/ui` and Next.js, and builds `dist/brand.css`,
   `dist/brand.json`, `BRAND.md`, `AGENTS.brand.md`.
4. **Preview locally:** start the kit's own preview site in the background and give the user the link:
   ```bash
   node "<path-to-this-skill>/scripts/brand.mjs" preview --cwd "<dir>"     # run_in_background; http://localhost:4600
   ```
   It is a brand book rendered with real `@semi/ui` components, in three tabs: **Thương hiệu** (cover, brief, logo
   with clear space and misuse examples, colours by role with the share of a screen, type, signature, voice, imagery),
   **Ứng dụng** (dashboard, phone app, landing page, email, light and dark, texts from the voice) and **UI kit**
   (scales, contrast table, downloads, every component page); theme and allowed styles switch in the top bar. Open it in the browser when you can, read the contrast table and the warnings, and
   tell the user in a few lines: always say when the button is not the exact brand colour in a theme (`fidelity`,
   ΔE > 0.08, with the reason the warning gives) and any "lưu ý" row, since those are what a designer would notice. Keep the server running while they adjust: `set` rebuilds and the page updates.
5. **Adjust** what the user asks ("darker primary", "use the preset neutrals"):
   ```bash
   node "<path-to-this-skill>/scripts/brand.mjs" set --cwd "<dir>" primary=#008f36 neutral=preset
   ```
   Keys: `primary`, `secondary` (`none` to remove), `name`, `neutral`, `allow`, `style`, `sans`, `display`;
   guideline: `tone`, `address`, `we`, `emoji`, `accent`, `secondaryRole`, `product`, `audience`,
   `personality` (comma list), `tagline`, `logo`, `logoDark`, `mark` (paths in the kit), `imagery`; signature:
   `density`, `scale`, `title`, `figures`, `motif` (`auto` goes back to what the brief implies). Lists (`voice.do`,
   `voice.dont`) and `voice.examples` are edited in `brand.json` directly, then `brand.mjs build`. It rebuilds and says the change level.
6. **Release** when the user approves: `npm run check`, `node brand.mjs bump --cwd "<dir>" 1.0.0`, commit, push to the
   brand's GitHub repo (ask the user to create it if needed), tag `v1.0.0`, push the tag. Then turn on GitHub Pages
   once (ask first: it publishes the preview):
   ```bash
   node "<path-to-this-skill>/scripts/brand.mjs" pages --cwd "<dir>"
   ```
   The `brand-pages.yml` workflow builds the static preview (`semi-brand site`) and publishes it at
   `https://<owner>.github.io/<repo>/` on every push to main; give the user that link once the run is green
   (`gh run watch`). A private repo needs a GitHub plan with private Pages; otherwise suggest a public brand repo or
   the local preview. Products install the kit with `/semi-new-app --brand github:<owner>/<repo>`.

## Change a brand (existing kit)

Same as steps 5–6: `set …` for the change, preview, then bump by the level it prints (major when colours / fonts that
people see change, minor for new options such as an allowed style, patch otherwise) and tag. Then tell the user to run
`/semi-sync` in each product (a major one asks first).

## `/semi-brand update` (new @semi/ui)

```bash
node "<path-to-this-skill>/scripts/brand.mjs" update --cwd "<kit-dir>"
```

Installs the newest `@semi/ui`, sets `"semi"` in `brand.json` to it, adds what an older kit lacks (preview site deps
and scripts, `.gitignore`, the Pages workflow), rebuilds, and prints the change level. Bump by that
level, commit, tag, push; then products get it with `/semi-sync`. It never changes the brand's choices.
