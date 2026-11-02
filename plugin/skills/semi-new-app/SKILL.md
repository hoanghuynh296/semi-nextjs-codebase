---
name: semi-new-app
description: Create a NEW product (web app) of a brand on the Semi Design System with zero manual terminal commands - asks which brand kit first, then scaffolds Next.js + Tailwind 4 + @semi/ui with the brand's colours, fonts and rules, in a style the brand allows (Flat, Soft, …) with a first screen for the kind of product (AppShell for a tool, a site for a store or landing page), providers, fonts, default theme, semi-lint, AGENTS.md + CLAUDE.md, and verifies it builds. Only for an empty folder; an existing app adopts Semi with /semi-check. Triggered by /semi-new-app.
---

# Create a new product (`/semi-new-app`)

The Semi commands, one per place:

| Where you are | Command |
|---|---|
| Brand repo (`brand.json`): create or change the brand | **`/semi-brand`** |
| Empty folder: a new product | **`/semi-new-app`** (with `--brand <kit>` for a product of a brand) |
| Existing app: check it against the brand and Semi, then fix | **`/semi-check`** |
| Existing app: the brand kit or Semi has a new release | **`/semi-sync`** |

Building screens needs no command (the `semi-ui` skill runs on its own); a style switch is asked in words.

The user should **never** have to run `npm install` or config commands: you run the script and only ask decisions.

## Workflow

1. **Check the folder.** If it (or a subfolder) already has a `package.json` with `next` or `react`, stop: this is an
   existing app, nothing is changed. Tell the user to run `/semi-check`. (`init.mjs` refuses such a
   folder too: it prints the apps it found and exits 10.)
2. **Ask the brand first** (`AskUserQuestion`): "Sản phẩm này thuộc thương hiệu nào?" with the brand kits the user named
   or has (a `github:owner/repo` or `file:../kit`), "Chưa có: tạo brand trước với `/semi-brand`" and "Dùng màu mặc
   định của Semi". With a kit pass `--brand <spec>`: colours, fonts, logo, voice and neutrals come from it, and only
   its allowed styles are offered. Then ask the rest:
   - Next.js version: `(Recommended) latest`, or a version.
   - App title, and the export mode: Next.js server (default) or static export (`output: "export"`).
   - Style: only the brand's allowed styles (no question when it allows one); without a brand, one option per style in `tokens/styles.json` of this plugin (`skills/semi-check/scripts/vendor/styles.json`),
     with its description; `(Recommended)` on the default (Flat) unless the app is clearly consumer-facing (Soft).
   - **What kind of product it is** (one question, `--kind`; it sets the first screen, density, type scale and the
     default theme, which belong to the product, not the brand: one brand has a dense dashboard and a roomy store):
     "Công cụ dùng cả ngày (dashboard, quản lý)" → `--kind tool` (AppShell, compact, theme theo máy);
     "Ứng dụng thường (Recommended)" → `--kind app` (AppShell, regular, theme theo máy); "Web bán hàng / tiêu dùng" →
     `--kind store` (top bar + hero + the brand's sample items, airy, light); "Trang giới thiệu / marketing" →
     `--kind landing` (hero + proof figure, airy, contrast type scale, light).
   - **Default theme**, only if the user cares: the kind's pick is recommended; `--theme light|dark|system` overrides.
3. **Create:**
   ```bash
   node "<path-to-this-skill>/scripts/init.mjs" --cwd "<target-dir>" --app-name "<App Title>" --next-version "<latest|ver>" --style "<id>" [--brand "<github:owner/repo | file:../kit>"] --kind tool|app|store|landing [--theme light|dark|system] [--density compact|regular|airy] [--type-scale even|contrast] [--static-export]
   ```
   It runs `create-next-app` (TypeScript, Tailwind 4, App Router), installs `@semi/ui` from the latest tag of
   `github:hoanghuynh296/semi-nextjs-codebase`, sets `transpilePackages`, wires `tokens.css` + `base.css` + `@source`
   into `app/globals.css`, writes `app/layout.tsx` (the brand's or the style's fonts, `ThemeScript` / `ThemeProvider`
   with the default theme, `ToastHost`, `ConfirmHost`, metadata from the brief) and a starter page for the kind
   (tool / app: `AppShell` with the brand's logo, its main figure as `KpiCard featured` and its sample items; store /
   landing: a top bar, a hero with the tagline, product line and button text, the proof figure and the sample items),
   `semi-lint.json` (with `"style"`, and `"density"` / `"typeScale"` when not the default), `data-style` (and
   `data-density`, `data-type-scale`) on `<html>`, `AGENTS.md` (Semi rules) and `CLAUDE.md` (`@AGENTS.md`, so Claude
   Code reads them). With `--brand` it installs the kit
   first (its `"semi"` range picks the `@semi/ui` version), imports its `brand.css`, writes the brand's fonts and its
   rules block, and sets `"brand"` in `semi-lint.json`. Then it verifies `semi-lint` + `tsc` + `npm run build`.
4. **Report** in a few lines: where the app is, the `@semi/ui` version, the style, kind, theme, density and type scale, and that the checks passed.
