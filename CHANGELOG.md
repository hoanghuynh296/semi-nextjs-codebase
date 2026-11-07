# Changelog

All notable changes to the **Semi Design System** (`@semi/ui` and `semi-design` plugin) are documented in this file.

## [Unreleased]

## [0.21.2] - 2026-11-07

### Added
- **Sidebar menu item icons in desktop mode (`AppShell`)**:
  - Sidebar navigation items now render their configured `icon` alongside the label in desktop expanded mode (`lg:w-52`), with clean `gap-2.5` alignment and consistent theme coloring.
  - In collapsed rail mode (`w-14` / `md`), the icon is rendered centered in the tab button (with fallback to short label initials if an item does not specify an icon).
  - Shimmer loading state in `AppShell` now includes the icon placeholder shape matching the rendered items.

## [0.21.1] - 2026-11-05

### Added
- **Semi Calibrated Brand Color Styling & Monochrome Override (`Icon`, `IconTile`)**:
  - Added `BRAND_PATHS` and `BRAND_TONES` in `src/Icon.tsx` for all 21 Vietnamese brand/platform icons, rendering signature multi-path / dual-color stroke paths with Semi calibrated tone tokens (`text-tone-orange`, `text-tone-pink`, `text-tone-sky`, `text-tone-amber`, `text-tone-indigo`, `text-tone-cyan`, `text-tone-teal`, `text-tone-emerald`, `text-tone-blue`, `text-tone-rose`, and `text-contrast`).
  - Seamlessly respects dark and light themes without garish neon hex colors or glow shadows, fully meeting WCAG AA contrast standards.
  - Automatic monochrome override: passing explicit `text-*` classes (e.g. `<Icon name="shopee" className="text-muted" />`) renders single-path monochrome SVG.
  - Automatic tone resolution in `<IconTile name="shopee" />` without needing manual `tone="orange"` prop.
  - Expanded `TILE_TONES`, `TONE_TEXT`, and `TONE_DOT` across all 12 Semi tone families.
  - Updated Foundations Storybook showcase to render brand-calibrated tones in the icon catalogue grid and inspector.

## [0.21.0] - 2026-11-05

### Added
- **Vietnam E-Commerce Platforms & Major Brands Icon Pack (`@semi/ui`)**: Added 21 new Lucide-standard 24×24 stroke icons expanding the system to 195 icons total:
  - **Sàn Thương mại điện tử (E-Commerce Marketplaces):** `shopee` (Shopee / Shopee Mall / ShopeePay), `lazada` (Lazada / LazMall), `tiki` (Tiki / TikiNOW / Tiki Trading), `sendo` (Sendo / SenMall / Sendo Farm), `tiktok` (TikTok Shop / TikTok), `chotot` (Chợ Tốt / Sàn rao vặt TMĐT).
  - **Ví điện tử & Cổng thanh toán (Fintech & Payments):** `momo` (Ví điện tử MoMo), `zalopay` (Ví điện tử ZaloPay), `vnpay` (Cổng thanh toán & VNPAY-QR quốc dân), `viettelMoney` (Viettel Money / ViettelPay).
  - **Giao vận & Logistics (Delivery & Couriers):** `ghtk` (Giao Hàng Tiết Kiệm), `ghn` (Giao Hàng Nhanh - GHN Express), `viettelPost` (Bưu chính Viettel Post), `vnpost` (Bưu điện Việt Nam / Vietnam Post), `grab` (Grab / GrabExpress / GrabFood / GrabMart), `be` (Be Group / beDelivery / beFood).
  - **Tập đoàn & Thương hiệu lớn (Major Brands & Tech):** `zalo` (Ứng dụng Zalo / Zalo OA), `fpt` (Tập đoàn công nghệ FPT), `viettel` (Tập đoàn Viễn thông Viettel), `vinfast` (VinFast xe điện & Tập đoàn Vingroup), `tgdd` (Chuỗi bán lẻ Thế Giới Di Động / MWG / Điện Máy Xanh).
- **Brand Domain & Registry (`brand`):**
  - Added `"brand"` domain to `IconDomain` and `"brand"` category to `IconMeta`.
  - Registered full semantic metadata, usage guidelines, and search keywords for all 21 icons in `src/iconCatalog.ts`.
  - Added `"Brands & TMĐT VN"` filter tab in `app/foundations/page.tsx` for easy visual discovery.
- **Aliases & `semi-lint` Enforcement:**
  - Added 40+ canonical aliases to `ICON_ALIASES` (`shopee_mall`, `momo_pay`, `vnpay_qr`, `vtpost`, `tikivn`, `lazmall`, `giao_hang_tiet_kiem`, `thegioididong`, `dienmayxanh`, etc.).
  - Added `icon-alias` HARD check in `semi-lint` preventing direct use of platform aliases.
  - Added unit test in `lint/test/semi-lint.test.mjs`.

## [0.20.0] - 2026-11-02

Ecosystem proposals from the 3D Noobs Studio adoption (#10, #15–#19).

### Added
- **`TaskHost` + `startTask()`** (#19): one blocking overlay for a job the user must wait for (upload, import, firmware update, payment step): label, current step, progress (0–100 or indeterminate), elapsed time, optional Cancel / Escape (`onCancel`). `task.update()`, `task.done()`, `task.fail(title)` (closes and shows a danger toast). One task at a time: a new one replaces the old, whose handle then does nothing. An `alertdialog` with `aria-busy`, focus trapped. Mount `<TaskHost />` beside `<ToastHost />` / `<ConfirmHost />`; `/semi-new-app` and the `/semi-check` layout snippet now do. Doc: `examples/task-host/`.
- **`aria-label` / `aria-labelledby` on `Switch` and `Checkbox`** (#17) for controls whose label is elsewhere (a card title, a table row); `label` wins; in development a control without any name logs a warning. **On touch screens both get a 44 × 44 px hit area** (`any-pointer-coarse:` pseudo-element), the visible size and layout unchanged. `DataTable` row boxes use `aria-label`.
- `Progress` takes `aria-label` when the bar has no string `label`.
- **Icons** (#18): `redo`, `eraser`, `viewReset` (reset the camera / view; not "fit to selection", that is `focus`), `flipHorizontal` (mirror / swap sides), with catalog entries and aliases (`repeat_action`, `erase`, `clear_paint`, `view_reset`, `iso`, `home_view`, `flip`, `mirror`, `swap_side`, `flip_side`, `flipSide`), which `icon-alias` flags.
- **`primary-fill` lint rule** (ratchet, #15): solid `bg-primary-<n>` / `border-primary-<n>` in any variant. The brand colour sits on one step of the scale, so `bg-primary-500` turns pale or off-brand with a brand kit: fills use `bg-accent hover:bg-accent-hover text-on-accent`, borders `border-accent-line` / `border-focus`; `primary-*` stays for charts and illustrations (`skip` those files). The codemod rewrites `bg-primary-400…600` → `bg-accent` (hover → `bg-accent-hover`, `text-white` → `text-on-accent`) only when the class list has `text-white` / `text-on-accent`, and reports the rest.
- **`skip` with a reason** (#16): `"skip": { "literal-colour-value": { "lib/scenePalette.ts": "data colours: 3D scene" } }` for `literal-colour-value`, `inline-svg-path` and `no-literal-palette` (illustrations, data palettes, partner logos). A reason is required (semi-lint exits 2 otherwise); the array form still works. The `/semi-check` audit lists each file ("Minh hoạ / màu dữ liệu") and the codemod leaves files skipped for `no-literal-palette`.

### Changed
- **Dark surfaces separate more** (#10): `panel` `#202226`, `field` `#272a2f`, `raised` `#31343a`, `text-muted` `#9ba1aa`, `line` white 12%, `line-hover` white 20% (app → panel 1.17:1, was 1.06; `text-muted` 4.8:1 on raised). Soft and Sharp get the same panel / field / raised lightness on their own hues (so a brand fill keeps 3:1 against every page). Light theme unchanged. Brand kits get it with `/semi-brand update`.
- The docs no longer teach `bg-primary-500 text-white` (power toggle, running dot, progress bar): `bg-accent` + `text-on-accent`.

### Fixed
- Lint / audit false positives (#16): `loading-text` skips progress step labels (`label`, a `fraction` / `value` option) and text inside `role="status"` / `role="progressbar"`; `narrow-container` skips dialogs and drawers (`MODAL_PANEL`, `Modal`, `Drawer`, `role="dialog"`); `font-mono` is allowed on and inside `<code>`, `<pre>`, `CodeBlock`, `Terminal` and `textarea` / `contentEditable` editors. The audit's `duplicates` check skips a file that imports the `@semi/ui` component it is named like (and no longer skips one that only imports something else); `subpage-toolbar` only asks list / grid pages, not tool pages with `AppHeader` and a canvas.

### Migration
- Nothing to run. `primary-fill` is a new ratchet rule at 0 per file: run `/semi-check` (its codemod fixes the fills under white text), fix the rest by hand, or record the debt with `npx semi-lint --update-baseline`; chart / illustration files go under `skip`.
- Add `<TaskHost />` to the root layout to use `startTask()`. Brand kits: `/semi-brand update` for the new dark surfaces.

## [0.19.1] - 2026-11-02

`/semi-check` fixes from the first adoption of a large dark app.

### Fixed
- **The token codemod could delete source code** (#11). It deduplicated and re-joined every string it rewrote, so a "string" the tokenizer misread (code between two quotes in a big file) lost its repeated words, and real strings broke: `viewBox="0 0 24 24"` → `"0 24"`, SVG paths, `transition` values, UI text. Now a string changes only when every token is a Tailwind class, token for token (spacing, line breaks and order stay, nothing is deduplicated); `viewBox` / `d` / `points` / `style` values and tagged templates (`glsl`, `css`, `sql`, `/* glsl */`) are never touched. Before writing, a file is parsed with the app's own `typescript`; a result that no longer parses is not written. Skipped strings and refused files are listed. `tokens --dry-run` prints the counts and writes nothing.
- **A dark app was detected as light** (#12): `foundation` printed `defaultTheme="light"` and the codemod mapped greys for a light app. One detector (`detectTheme`) now reads what the page paints: `defaultTheme` / `data-theme` / `class="dark"` in the root layout, the `html` / `body` background and surface variables in the CSS (dark-mode blocks ignored), and only then the class count. When the signals disagree or are missing it says so and stops; `/semi-check` asks the user and passes `--theme dark|light` (both phases). In a dark app, solid `bg-white` / `bg-black` / `text-black` are reported for a person instead of turning into `bg-panel` / `bg-canvas`.
- **`foundation` reported undone steps as done** (#13). A failed install puts `package.json` back (with `@semi/ui` listed but not installed, the next run skipped the install and never created the lint baseline), prints what to do and stops with exit 1. `transpilePackages` is added to configs exported as a function (`const base: NextConfig = {…}` or its `return {…}`), a named variable or `defineConfig({…})`; a shape it cannot edit is in the final **Làm tay** list instead of a "done" line. `<html>` is found outside comments and strings (`data-style` went into a comment that mentioned `<html>`). `--verify` creates the baseline when it is missing.
- **The audit counted copies and other repositories** (#14): folders git ignores and nested repositories (their own `.git`) are left out with one "Bỏ qua …" line each; `--include <dir>` checks one on purpose.
- `semi-lint`: class rules no longer fire inside SVG / style values or tagged templates (`rounded` in a GLSL shader, part of #16).

### Migration
- Nothing to run. Apps that already ran the 0.19.0 codemod: check its diff for shortened `viewBox` / `d` / `transition` strings and collapsed lines (`git diff --stat` shows files that lost many lines).

## [0.19.0] - 2026-11-02

### Added
- **`brief.sample` in `brand.json`:** the product's main list, 2–5 real items, its main figure and a proof figure. The brand book's sample screens, the agent rules (`AGENTS.brand.md` "Sample content", `semi_brand brief`) and every new app's first screen use it instead of generic shop data; the build warns when a brief has no sample. `/semi-brand` drafts it from the brief.
- **`/semi-new-app --kind tool|app|store|landing`** (the "what kind of product" question): it now sets the first screen too, not only density. Tool / app: `AppShell` with the brand's logo, the main figure (`KpiCard featured`) and the sample items. Store / landing: a top bar, a hero with the tagline, the proof figure and the sample items. **`--theme light|dark|system`**: the default theme is the product's (tool / app follow the system, store / landing start light); it was always dark. Metadata comes from the brief.
- **`CLAUDE.md` with `@AGENTS.md`** in every app `/semi-new-app`, `/semi-check` (foundation) and `/semi-sync` touch: Claude Code reads `CLAUDE.md`, so the Semi and brand rules in `AGENTS.md` did not reach it. `/semi-check` reports a missing link (`agent-rules`, phase 1).
- **The brand book is checked in the browser:** `npm run build:brand-book` builds the sample kit `tests/fixtures/brand.json` from this checkout and `npm run test:ui` checks it (contrast AA in every allowed style and both themes, axe, nothing spilling at 320 / 375 / 768 / 1280px, the sample in the screens). CI runs it.
- `/semi-brand` looks at the brand book (375 and 1280px, both themes) before handing it over.

### Changed
- **The brand book is one dashboard:** the *Thương hiệu* and *Ứng dụng* pages moved from their own top-bar frame into the Semi docs shell the UI kit and component pages use (menu on the left, tab bar on phones with Thương hiệu, Ứng dụng, Kit, UI). Same URLs and content; theme and style switch at the foot of the menu. Kits get it with `/semi-brand update`.
- **The Semi rules block in an app's `AGENTS.md` is 4 KB instead of 15 KB:** the hard rules and how to ask the MCP tools; component lists and constants are left to `semi_search` / `semi_docs`, which answer from the installed version. `/semi-sync` refreshes it.
- Callouts and status surfaces in the docs and rules use the themed tokens (`bg-warning-bg border-warning-border text-warning-fg`), not `bg-amber-500/10` with a `text-amber-600 dark:text-amber-400` pair.
- The colour warning prints the real ratio ("màu gốc chỉ 2.94:1 với nền trang, cần 3:1") instead of "gần như trùng với nền trang".

### Fixed
- Brand book, Ứng dụng › Dashboard at 320px: the order rows no longer spill out of the card (code hidden, amount on one line, badge inside); KPI cards keep their own height.
- Brand book, Ứng dụng › landing page: the proof is a real figure on the brand tint, without the internal "Ví dụ: …" caption.
- Brand book, colours: the grid has as many columns as swatches; "Đổi màu" shows a recoloured name when the brand has no logo yet.
- `DonutChart`: arc coordinates are rounded, so the server and the browser render the same path (React reported a hydration mismatch on every page with a donut).
- `plugin/hooks.json` is kept identical to `plugin/hooks/hooks.json` by `npm run sync:vendor`.

### Removed
- The command aliases `/semi-init`, `/semi-audit`, `/semi-fix` and `/semi-update` (renamed in 0.16.0): use `/semi-new-app`, `/semi-check` and `/semi-sync`.

### Migration
- Nothing to run in apps. `/semi-sync` writes the shorter rules block and `CLAUDE.md`. Brand kits: `/semi-brand update`, then add `brief.sample` to `brand.json` (the build reminds you).

## [0.18.0] - 2026-11-02

First tagged release of the 0.17.0 work (0.17.0 was never tagged; the version files said 0.17.0 under the v0.18.0 tag, so the plugin kept showing 0.17.0).

### Added
- **Product density and type scale** (a product's choice, not the brand's: one brand has a dense dashboard and a roomy store): `data-density="compact|airy"` and `data-type-scale="contrast"` on `<html>` (or any wrapper), mirrored as `"density"` / `"typeScale"` in `semi-lint.json`. Density scales Tailwind's spacing unit, so every padding and gap follows; the contrast scale enlarges KPI figures and headings. `/semi-new-app` asks the kind of product and sets them (`--density`, `--type-scale`); `style.mjs` changes them later. The brand book's Ứng dụng tab shows each sample screen with its usual pick.
- **Style tokens read by every component:** `--spacing` (Tailwind's spacing unit, so the product's density scales every padding and gap), `font-title` (title and figure weight) and `font-figure` (the font of big numbers). Sharp now has bold titles and figures in its display font; Flat and Soft look as before.
- **`KpiCard featured`:** the screen's main number, larger and two columns wide.
- **Composition rules against the generic AI screen** (`DESIGN_SYSTEM.md` §19, QUICK_REF, the plugin rules, `semi-ui` and AGENTS.brand.md): one main block per screen, neutral icons, proof instead of three feature cards, icons only where they help, sample text from the brief, varied rhythm. `/semi-check` reviews key screens against them (phase 4b).
- **`decorative-icon-tones` lint rule** (ratchet): three or more `iconTone` colours in one file.

### Changed
- **`KpiCard` icons are neutral by default** (`iconTone` was `sky`): give a colour only when it means a status. The figure uses `font-figure font-title`. Pass `iconTone` explicitly to keep a coloured icon.
- `PageTitle` / `PageTabsTitle` use `font-title` (semibold unless the style says otherwise).
- The `dashboard` block, the KPI and sparkline examples and the brand book's sample screens lead with one featured number, without decorative icon colours; the brand book's landing page shows a big figure and a customer quote instead of three feature cards.
- **The `/semi-new-app` starter is the brand's first screen**, not a 3D-printer dashboard: a hero with the brand's tagline, product line and button text from the brand kit, and an empty state in its voice.
- `brand-override` also blocks `--brand-*`, `--spacing`, `--density-spacing`, `--font-figure` and `--font-weight-title` in an app with a brand kit.
- `brand.json` `density`, `typography` and `motif` (from a pre-release draft) are ignored with a warning.
- `ScrollArea` is focusable from the server HTML on (it measured only after hydration, so an early keyboard user or a11y check met a scrolling region without a tab stop).
- `DESIGN_SYSTEM.md` §2b now describes brand kits (it still told products to override `primary-*` in their CSS).

### Migration
- Nothing to run. Apps keep regular density and the even type scale until they set `data-density` / `data-type-scale`. Apps that relied on the old sky default of `KpiCard`'s icon pass `iconTone="sky"`.

## [0.16.0] - 2026-11-01

### Changed
- **The brand kit preview is a brand book**, not a copy of the docs site. Three tabs: *Thương hiệu* (cover with logo, name, tagline and personality on the brand colour; who the brand is for; logo on both backgrounds with clear space, the mark at 16–48px and what not to do: stretch, recolour, rotate, add effects, busy backgrounds; colours by role and the share of a screen each takes; type specimens; voice with do / don't and its texts on real components in light and dark; imagery), *Ứng dụng* (dashboard, phone app, landing page and email, light and dark, texts from the voice; the landing hero follows the accent use) and *UI kit* (scales, button and text shades with their distance from the brand colour, type scale, contrast table, downloads of `brand.css`, `brand.json` and the logos, and every component page in the Semi docs shell). The brand book pages have a top bar instead of the component sidebar.
- Without a logo version for dark backgrounds, the preview's top bar and sample screens show the mark (if any) next to the name on dark instead of a logo that may not read.

- **Four commands, one per place:** `/semi-brand` (brand repo), `/semi-new-app` (empty folder; was `/semi-init`, now asks the brand first and offers only its allowed styles), `/semi-check` (existing app: checks against the brand and Semi, writes `semi-check.md`, asks, then fixes phase by phase; merges `/semi-audit` and `/semi-fix`), `/semi-sync` (new brand kit or Semi release; was `/semi-update`). The old names stay one release as aliases that point to the new ones. The report file is `semi-check.md` (was `semi-audit.md`). README, plugin descriptions and docs now present Semi as a brand builder.
- **`/semi-style` is removed as a command.** Style is a brand decision (`/semi-brand` sets the allowed styles), an app picks one at `/semi-init`, and a later switch is asked in words: the `semi-ui` skill carries the steps and the script moved to `skills/semi-init/scripts/style.mjs`. No app changes.
- **`semi-ui` runs on its own** whenever the agent builds UI in a Semi app (its description says so); docs and the plugin no longer list `/semi-ui` as a command to type. It now asks `semi_brand` before writing UI text or placing colour.

### Added
- `brief.tagline` in `brand.json` (one line, ≤ 90 characters; `set tagline=…`): on the cover, the landing page and in BRAND.md.
- `color.mix` in `dist/brand.json`: the rough share of a screen for neutrals, surfaces, the primary and the secondary colour, from the accent use (restrained 80 / 15 / 5 %, balanced 70 / 20 / 10, expressive 55 / 25 / 20). BRAND.md and AGENTS.brand.md state it.

## [0.15.0] - 2026-11-01

### Added
- **Accent state tokens:** `ring-focus` / `border-focus` (focus ring, focused field), `bg-accent-subtle` / `bg-accent-subtle-hover` (selected, active), `border-accent-line` (selected border). They follow `accent-fg`, so they reach 3:1 in both themes for every brand. Every component and class constant uses them (`FOCUS_RING`, `FIELD_INPUT`, `CARD_ACTIVE`, Pagination, Combobox, Calendar, Chat, AppShell …).
- **`accent-state-token` lint rule** (ratchet): `ring-primary-500/50`, `bg-primary-500/15`, `border-primary-500/30` and other brand-scale state colours. `/semi-fix` rewrites them.
- **Brand kits:** `bg-secondary-solid` + `text-on-secondary` for a secondary colour; `brandStep` and `fidelity` (button shade and its ΔE from the brand colour, per theme) in `dist/brand.json`; the report checks the hover of the button and the focus ring (3:1), and lists "nút tách khỏi nền" as a soft finding.
- **Brand guideline, not only colours:** `brand.json` takes an optional `brief` (product, audience, personality), `logo` (full / dark / mark files, clear space, min width), `voice` (tone friendly · neutral · formal, how to address the user, emoji, do / don't, example texts), `color` (how much accent, secondary colour role) and `imagery`. The build validates them, copies logos to `dist/logo/`, and writes a full `BRAND.md` (brief, logo, colour use, voice with Semi's shared microcopy rules, imagery) and an `AGENTS.brand.md` of decisions (one primary per area, accent use, secondary role, logo import, voice and example texts), not only prohibitions. Missing voice is a warning.
- **Kit preview:** a sample product screen in light and dark side by side (texts from the voice), the logo on both backgrounds with its clear space, the voice and colour-use sections.
- **`semi_brand` MCP tool / `semi brand [voice|color|logo|brief|tokens]`:** agents in a product ask the installed brand kit how to write, use colour and place the logo.
- **`/semi-brand`:** starts from a brief and recommends from it; asks for the logo, voice and colour use; `brand.mjs colors <logo.svg>` lists a logo's colours; `create --from <brand.json>`; new `set` keys (`tone`, `address`, `we`, `emoji`, `accent`, `secondaryRole`, `product`, `audience`, `personality`, `logo`, `logoDark`, `mark`, `imagery`). A new logo is a major kit change, voice / colour use / brief a minor one.
- Docs site *Brand preview*: the button's distance from the brand colour per theme, a "Cần" column and soft findings in the contrast table; "Copy lệnh cho agent" (a `/semi-brand` prompt with the brand.json) replaces the command that had a `<plugin>` placeholder.

### Changed
- **Brand scales sit on a fixed lightness ladder** (`LADDER` in `brand/generate.mjs`) with the brand colour unchanged on its nearest shade (`brandStep`), instead of `500 = the brand colour`. Very dark and very light brands no longer get identical shades or invisible hovers. `--color-primary` / `--color-secondary` are still the exact brand colours.
- **The button keeps the brand colour where it can:** per theme, the AA shade (white or dark text) closest to the brand colour; lifted only when it would blend into the page. E.g. `#FF6B00` light theme: `#df5d00` with dark text (was `#a14100` with white); `#1E3A8A` dark theme: `#5670aa` (was `#7d93c3`). Coloured text (`accent-fg`) is the closest shade that reads on every surface and on `bg-accent-subtle`.
- The focus ring is now solid `accent-fg` (was `primary-500` at 50%): more visible in Semi's own green too.

### Migration
- `0.15.0-accent-state-tokens` rewrites brand-scale state classes in apps (`ring-primary-500/50` → `ring-focus`, `bg-primary-500/15` → `bg-accent-subtle`, `border-primary-500/30` → `border-accent-line`, `focus:border-primary-*` → `border-focus`). Solid fills (`bg-primary-500`) are left alone: if one carries text, use `bg-accent` + `text-on-accent`.
- Brand kits: run `/semi-brand update`. Most brands' shades and buttons change, so it reports a **major** change; products then get it through `/semi-update` (asked first).

## [0.14.0] - 2026-11-01

### Removed (breaking)
- **Palettes are gone.** Each style used to have three colour variants of its neutrals (`data-palette`, `"palette"` in `semi-lint.json`, `palettes` in `tokens/styles.json`, `--palette` in `/semi-init`, `/semi-fix`, `/semi-style`, `palette.<style>` in `/semi-brand`). No app or brand kit used them, and the design system pages no longer offered them. Now each style has its own neutrals (`semantic` in `tokens/styles/<id>.json`): Flat the shared neutrals, Soft the former default Sand, Sharp the former default Ink. Looks by default do not change.
- **Migration** `0.14.0-remove-palette` (run by `/semi-update`): removes `"palette"` from `semi-lint.json` and `data-palette` from `<html>`. `/semi-audit` reports a leftover palette until `/semi-fix` cleans it up.
- **Apps on a non-default palette change look.** The migration cannot keep their colours. Before updating one, ask the user whether to keep the look: the palette's values are in git history (`git show v0.13.3:tokens/styles/soft.json`, `…/sharp.json`, `…/flat.json`). Brand kits: remove `"palettes"` from `brand.json` (a warning until then); `"neutral": "preset"` keeps the style's own neutrals.
- The docs site has no palette picker (since 0.13.3) and its style tests cover the three styles.

## [0.13.3] - 2026-11-01

### Changed
- **Docs site: no palette picker.** The footer offers the styles (Flat, Soft, Sharp) only; the palette options (Graphite, Slate, Olive…) are gone from the design system pages. Apps can still set `data-palette` as before (`docs/STYLES.md`).
- **The Foundations page is generated from `tokens/`.** `scripts/foundations.mjs` writes `site/foundations.generated.ts` (surfaces and text per theme, the type scale, each style's radius, control height, card border and fonts) during `build:manifest`. The page no longer repeats hand-typed hex values, so it cannot drift from the tokens.

## [0.13.2] - 2026-11-01

### Changed
- **Tinted brands: surfaces are nearly neutral.** `brand/generate.mjs` tinted canvas, app, panel, field and raised with the primary's hue at chroma 0.010 (Flat), which read as a colour cast over large areas. Surfaces now take 0.003 (Flat), 0.004 (Soft) and 0.002 (Sharp), near Tailwind slate-50 (≈ 0.003) and Radix slate-1 (≈ 0.002). Text and borders keep their tint. A brand with `"neutral": "tinted"` gets new neutrals after `/semi-brand update` in the brand repo, then `/semi-update` in each product.

## [0.13.1] - 2026-11-01

### Changed
- **Side menu items have no icon** (`AppShell`): the item shows its label alone. In the narrow rail (collapsed, or below `lg`) the item shows its `shortLabel`, or the initials of its label, in place of the icon; the full label is the tooltip. Group headers keep their icon, and the phone tab bar and "Menu" sheet keep theirs.

### Fixed
- **The side menu no longer resets when a page is opened.** Every page mounted its own shell, so the menu remounted on each navigation and its scroll position went back to the top. The docs shell (`SiteShell`) now lives in the root layout and stays mounted across pages.

## [0.13.0] - 2026-11-01

### Added
- **`semi` CLI for agents** (`npx semi …`, no dependencies, answers from the installed package): `search` (a need in Vietnamese or English → ranked docs with why), `docs`, `example`, `props`, `list`, `blocks`, `add <block>` (writes a page into the app, never overwrites without `--force`); `--json` everywhere. Guide: `docs/AGENT_TOOLS.md`.
- **MCP server** (`semi mcp`): tools `semi_search`, `semi_docs`, `semi_example`, `semi_props`, `semi_list`, `semi_block`. The `semi-design` plugin registers it as `semi` and starts the project's own `@semi/ui` (monorepos included); without it the server explains how to add Semi.
- **Blocks** (new docs group): `dashboard`, `list-page`, `settings-page` and `agent-run` (now titled *Agent workspace*, moved from AI).
- **`/semi-ui` skill:** build a page or component from Semi docs and blocks (search → docs → example → compose → semi-lint).
- `llms.txt`, the consumer rules block and the README point agents to the CLI / MCP first.

### Fixed
- `components.json` summaries no longer end with the comment's closing `*/`.

## [0.12.0] - 2026-11-01

### Added
- **AI agent parts, each with a doc page:** `Reasoning` (open while it streams, folds to “Đã suy luận trong N giây”), `ToolCall` (status badge, input / output as JSON, error), `Sources` + `Citation` (numbered links that match), `TaskList` (plan with step marks and progress, running step `aria-current`), `ActionConfirmation` (human-in-the-loop approve / reject; the outcome stays in the log), `Terminal` (streamed command output that follows the end, exit code, copy; ANSI codes stripped), `FileTree` (keyboard tree with added / modified / deleted marks), `ContextMeter` (context window ring, amber from 80%, red from 95%). Types `ToolCallStatus`, `Source`, `TaskStep`, `TaskStatus`, `FileNode`.
- **Agent run** doc page: one full agent turn composed from the parts, to copy.
- `examples/list.json` lists each doc's `components`.
- Locale strings for the agent parts (`reasoning`, `reasoned`, `toolStatus`, `toolInput`, `toolOutput`, `sources`, `source`, `taskStatus`, `taskProgress`, `approve`, `reject`, `approved`, `rejected`, `exitCode`, `fileChange`, `contextUsage`, `contextDetail`).

### Fixed
- Charts redraw after switching back from the table view (the size observer followed the old element).
- Docs: a pattern page with no component of its own shows no empty import line.

## [0.11.0] - 2026-11-01

### Added
- **Charts in SVG, no library:** `BarChart` (grouped or `stacked`), `LineChart` (optional `area`), `DonutChart`, `Sparkline`. Series use the new `chart-1…8` colour tokens (fixed order, colour-blind checked in light and dark); legend for 2+ series, hover and keyboard tooltip (←/→, Home, End), and a table view on every chart. Types `ChartSeries`, `DonutSlice`.
- **More components, each with a doc page and examples:** `InputOTP` (one real input: paste and SMS autofill work), `Carousel` (scroll-snap, buttons, dots, arrow keys, no auto-play), `ResizablePanels` (keyboard handles, sizes can be remembered), `AspectRatio`, `NavigationMenu` (website header with link panels; a sheet on phones), `Menubar` (Tệp · Sửa · Xem, ARIA menubar), `CodeBlock` (copy button, file name), `Prose` (long-form text styles), `Item` + `ItemGroup` (list rows).
- Docs pages for Chart, Input OTP, Carousel, Resizable panels, Aspect ratio, Navigation menu, Menubar, Typography, Code block and Item.
- Locale strings `tableView`, `chartView`, `slide`, `prevSlide`, `nextSlide`, `goToSlide`, `resize`, `oneTimeCode`.

### Changed
- The docs site's `CodeBlock` (`@semi/ui/site`) is now the public `CodeBlock`.

## [0.10.0] - 2026-11-01

### Added
- **18 new pieces, no external libraries, each with a doc page and examples:** `Separator`, `Kbd`, `Breadcrumb` (collapses past `maxItems`), `ButtonGroup`, `InputGroup` (prefix / unit / button), `Toggle` + `ToggleGroup` (single = radio group, multiple = toolbar), `Collapsible`, `Accordion` (single / multiple, arrow keys), `Popover` (non-modal dialog), `HoverCard`, `ContextMenu` (right-click, long-press, Menu key / Shift+F10), `Command` + `CommandDialog` + `useHotkey` (⌘K palette; matching ignores Vietnamese marks: `normalizeSearch`, `filterCommands`), `Slider` (one thumb or `range`), `Calendar` (single / range, full grid keyboard), `ScrollArea` (edge lines, thin scrollbar, keyboard focusable), `DataTable` (sort with aria-sort, search, select + bulk actions, paging, loading and empty states).
- `Drawer side="top"` (a sheet from the top); `MenuItem.shortcut`.
- Locale strings for the new parts (`weekdaysShort`, `monthYear`, `command*`, `selectAll`, `selectRow`, `selectedCount`, `sortBy`, `showHidden`, `value`).

### Changed
- `DatePicker` uses `Calendar`: arrow / PageUp / PageDown keys in the grid, focus returns to the button, month and weekday names from the locale (no hard-coded Vietnamese).
- `Menu` and `ContextMenu` share one panel (same keyboard and look).
- The docs site mounts `ToastHost` and `ConfirmHost` once in its layout, like an app; examples no longer render their own hosts.

### Fixed
- Docs: `Pills` and `SearchInput` accessibility notes now describe what they really do.

## [0.9.0] - 2026-11-01

### Added
- **Component docs, agent first:** every component has a doc in `examples/<id>/` (`meta.json`: description, when to use, what to use instead, accessibility; one file per example, imports from `@semi/ui` only). `npm run build:manifest` generates the API tables from the TypeScript types (types, defaults, required props, TSDoc), `docs/components/<id>.md` for agents (shipped in the package and served at `/docs/components/<id>.md`), `docs/components/README.md` and the registry the docs site renders. `components.json` links each component to its page (`doc`); `llms.txt` lists every page. `check:manifest` fails when a component has no doc or an example imports a missing export; `typecheck` covers every example. Guide: `docs/COMPONENT_DOCS.md`.
- **New docs site** (replaces the Storybook pages, same URL, Semi's own look): introduction, component index with a live example of each, one page per component (Preview / Code per example, import line, API, accessibility, "Copy page" markdown), foundations, brand preview. The docs UI ships as `@semi/ui/site` (`DocsShell`, `ComponentPage`, `ComponentIndex`, `ExampleBlock`, `CodeBlock`).
- **Brand kit previews show every component:** the kit's preview site renders the same docs pages in the brand's colours (overview + all component pages).
- `semi-lint.json` `"ignore"`: path prefixes not scanned (generated files).

### Fixed
- `sr-only` text no longer stretches the document (a required `Field` in a long page let the whole page scroll past the shell).
- `DatePicker` and `ChatModelPicker` buttons: the accessible name now contains the visible value (WCAG 2.5.3).
- `external-link` lint: `<ExternalLink href="https://…">` (the fix itself) is no longer flagged.
- Brand preview: the menu marks the page you are on (it was stuck on the first section).

## [0.8.1] - 2026-11-01

### Fixed
- `/semi-brand update` and `/semi-update` install `@semi/ui` by name (`npm install @semi/ui@<tag>`): a bare `npm install` kept the commit `package-lock.json` already had for the git dependency, so a kit or app stayed on the old release while `package.json` named the new tag. Both now stop with a message when the installed version is not the one asked for.

## [0.8.0] - 2026-11-01

### Added
- **Brand kits get their own preview site:** `semi-brand preview` serves it locally (http://localhost:4600, live while the brand is adjusted) and `semi-brand site` exports it statically (`SEMI_BRAND_BASE_PATH` for GitHub Pages). It renders the brand with real `@semi/ui` components (colours, type, controls, cards, tables, contrast report; theme and allowed styles switchable); the template ships in `@semi/ui` (`brand/preview`), so `/semi-brand update` brings newer previews. `/semi-brand create` (and `update` for older kits) adds Next.js to the kit, `.preview/` to `.gitignore` and `.github/workflows/brand-pages.yml`, which builds and publishes the preview on GitHub Pages at every push; `brand.mjs pages` turns Pages on. `semi-brand storybook` keeps the Semi Storybook link (the old `preview`).

## [0.7.0] - 2026-11-01

### Added
- **Brand kits:** Semi is now a multi-brand kit: Semi core → a brand kit per brand (its own repo) → products. `brand.json` holds the few choices (primary, optional secondary, neutrals tinted from the primary or a style preset, allowed styles, fonts); `@semi/ui/brand` (`generateBrand`, OKLCH, no dependencies) derives the 50–900 scales, the accent / on-accent / accent-fg shades of both themes and the neutrals of every allowed style, choosing the first shades that reach WCAG AA. `semi-brand build | check | preview` (new bin) writes `dist/brand.css`, `dist/brand.json`, `BRAND.md` and `AGENTS.brand.md`.
- **`/semi-brand`:** creates a kit (`create`), changes its choices (`set`, with the change level), `/semi-brand update` regenerates it for a newer `@semi/ui`, `bump` versions it. Products: `/semi-init --brand <spec>`, `/semi-fix foundation --brand`, `/semi-audit` checks the kit is installed and wired (`brand`), its styles and fonts; `/semi-update` updates the kit first (asks before a major one, `--accept-major`) and keeps `@semi/ui` inside the kit's `"semi"` range; `/semi-style` offers only the brand's styles. `semi-lint` `brand-override` (hard, apps with a brand) blocks local `--color-primary-*`, `--semi-*` and font tokens in CSS.
- **Storybook "Brand preview":** pick the choices and see the brand on every page (also from the `#brand=` link `semi-brand preview` prints), with the contrast report, `brand.json` and the create command to copy. Playwright covers it in both themes.
- **`docs/BRANDS.md`:** the step-by-step guide (3D Noobs → its Manager app) and which command to use when.
- **Palettes:** every style has three colour variants of its neutrals (both themes), set with `data-palette` next to `data-style` and `"palette"` in `semi-lint.json` (the first is the default, written as no palette): Flat = Graphite · Slate · Olive, Soft = Sand · Blush · Sage, Sharp = Ink · Paper · Mono. **Sharp's default is now Ink** (off-black / off-white, softer lines); the old pure black and white is the Mono palette. `/semi-init` / `/semi-fix foundation` / `/semi-style` take `--palette`; `/semi-style --palette <id>` recolours the current style; `/semi-audit` checks the palette against the layout. Storybook has a palette switch; Playwright runs contrast for every style × palette × theme.
- **Styles go beyond shape:** a style now also sets the neutral colours of both themes (`semantic` in `tokens/styles/<id>.json`), the fonts (`font-sans`, `font-display`, plus the `fonts` an app loads with `next/font`), the card border (`border-card`, used by `CARD` / `HERO` / `SHELL_ASIDE`) and control sizes (`h-control` 34px, `h-field` 36px in Flat). Flat is unchanged; **Soft** = warm neutrals, Plus Jakarta Sans, borderless lifted cards, 40 / 44px controls; **Sharp** = pure black / white, Space Grotesk, 2px borders, 36 / 40px controls. `/semi-init` writes the style's fonts; `/semi-audit` reports fonts the layout does not load (`style-fonts`); `/semi-fix` and `/semi-style` print the `next/font` lines. The codemod maps `h-[34px]` / `w-[34px]` → `h-control` / `w-control`. Playwright runs contrast and phone layout for every style in both themes; the Storybook loads every style's fonts.
- **Sharp style:** square corners (chip 2px, everything else 0) and a hard 4px offset shadow under cards (theme's strong line colour), for bold editorial screens.
- **Styles:** the shape of the UI is now a style an app picks once (`<html data-style>` + `"style"` in `semi-lint.json`): **Flat** (default, unchanged look) and **Soft** (radii 6 · 12 · 20 · 24px, soft resting card shadow). Style tokens `rounded-chip` · `rounded-control` · `rounded-card` · `rounded-panel` and `shadow-card` (in `CARD`, `HERO`, `SHELL_ASIDE`); sources `tokens/styles/<id>.json`, generated list `tokens/styles.json` (`@semi/ui/styles.json`, also in `components.json`), guide `docs/STYLES.md`. Storybook has a Flat / Soft switch; Playwright checks Soft before paint and its contrast in both themes.
- **`/semi-style`:** shows or switches an app's style. `/semi-init --style`, `/semi-fix foundation --style` (asked with the other decisions); `/semi-audit` reports a missing or unapplied style in phase 1; `/semi-update` warns when the app's style left the release.
- **`radius-token` (ratchet):** `rounded`, `rounded-sm/md/lg/xl/2xl`, `rounded-[Npx]` do not follow the style; the token codemod maps them (`lg` → `control`, `xl` → `card`, `2xl` → `panel`, `sm` / `md` / bare → `chip`) and `shadow-sm/md` → `shadow-card` (it used to drop them).
- **Docs ↔ code checks (`check:manifest`):** fails when a usage snippet in `app/usage.ts` imports a name `@semi/ui` does not export, when a Storybook section and its usage entry do not match, or when a component / hook is not named in `docs/DESIGN_SYSTEM.md`.
- **Maintainer guide:** "Change checklist" in `AGENTS.md` (what to update with each kind of change); `CLAUDE.md` loads it for Claude Code.
- **`/semi-fix`:** fixes what `/semi-audit` found, phase by phase from `semi-audit.md`: **foundation** (`fix.mjs foundation`: installs `@semi/ui` keeping Next / Tailwind, `transpilePackages`, Semi CSS, `semi-lint.json` + baseline, `AGENTS.md`; prints the layout providers with a `defaultTheme` matching the app's current theme; screenshots before / after), **tokens** (`fix.mjs tokens [--only dir]`), **hand fixes**, **structure** (asked up front: fix, or keep in `semi-lint.json` `"keep"`). `--verify` re-audits, runs the app's own `semi-lint` / `tsc` and deletes `semi-audit.md` once clean.
- **Release migrations:** `migrations/<version>-<id>.mjs` (shipped in the package, contract in `migrations/README.md`, helpers `renameExport` / `renameProp`); `/semi-update` runs the ones between the app's old and new version.
- **`audit.mjs --ci`:** summary only, exit 1 while issues are left (a periodic check in an app's CI).

### Changed
- **Every component and class constant** uses the style tokens instead of `rounded-lg/xl/2xl` (pixel-identical in Flat, checked on every Storybook page, both themes, desktop and phone).
- **Migration:** the `rounded-md` HARD rule is now part of `radius-token` (ratchet). App code keeps working; run `/semi-audit` → `/semi-fix` (token phase) so its own radii follow the style.
- **Commands, one job each:** `/semi-init` only creates a new app (an existing folder is refused, nothing changed); an existing app, with or without `@semi/ui`, adopts Semi with `/semi-audit` → `/semi-fix`; `/semi-update` installs the latest tag, prints the CHANGELOG of the skipped releases, runs their migrations and `tsc` (no audit, no refactor).
- **`/semi-audit`:** short Vietnamese summary (one table with each app's phase, the next command, issues grouped at the bottom) and every issue with `file:line` in `semi-audit.md`, by phase (foundation → tokens → hand fixes → structure). It changes no source file, reads the app's `semi-lint.json` (`scan`, `skip`, `disable`, new `keep`) and deletes an old report when nothing is found.
- **Fewer false issues:** `AppHeader` counts as a Semi frame; only list pages (rendering a `.map`) need a `SubpageToolbar`; a local component counts as a duplicate only when it defines its own component without building on `@semi/ui`.
- **Plugin scripts** run the app's own `semi-lint` / `tsc` (`node_modules/.bin`), never a same-named package fetched by `npx`. Setup steps live in `semi-init/scripts/setup.mjs`, shared by init, fix and update; `wireNextConfig` also handles `export default {…}` and `module.exports = {…}`.
- **`semi-lint` `scan()`** also returns every ratchet hit (`hits`), so the audit lists each line.

### Fixed
- `/semi-init` replaces create-next-app's sample `globals.css` (body Arial, `--font-sans`, `--background`), which overrode Semi's fonts and surfaces in every new app.
- `DESIGN_SYSTEM.md` now describes `Spinner`, `useField`, `useDialog` / `useFocusTrap` / `useScrollLock` and `useAnchoredPosition`.
- CI runs on Node 24 (the manifest script imports `app/usage.ts` with Node's type stripping).

## [0.6.0] - 2026-10-31

### Added
- **AI chat (`Chat.tsx`, extracted from 3D Noobs Studio and rebuilt on tokens):** `AIChat` (ready-made), `ChatPanel` (side panel, `workspace` / `screen` placement, resizable, iOS keyboard inset), `ChatView`, `ChatList` (stick-to-bottom while at the bottom, "jump to latest", one announcement per finished answer), `ChatComposer` (auto-grow, Enter / Shift+Enter, IME-safe, stop, `toolbar` slot), `UserMessage`, `AssistantMessage`, `ChatAnswer`, `ChatError` (retry), `ChatThinking`, `ChatIntro`, `ChatSuggestion(s)`, `ChatAvatar`, `ChatCopyButton`, `ChatModelPicker` (provider → model → effort chips, as in Studio), `CHAT_ROW`, `CHAT_CHIP`, `CHAT_PICK_CHIP`, `ChatItem`. Locale strings `chat*`, `copy`, `copied`.
- **Storybook for agents:** `llms.txt` at the Storybook root (every page and section with when-to-use + copy-ready code), `llms-full.txt` (+ all docs), and `components.json`, `QUICK_REF.md`, `DESIGN_SYSTEM.md`, `ICONS.md`, `agent-rules.md`, `tokens.css` served as files; linked from every page's `<head>` and the sidebar. Each page has its own title / description; every section shows its usage code. One source (`app/usage.ts`) for the pages and `llms.txt`, generated by `build-manifest` and checked by `npm run check`.
- **Storybook:** "AI Chat" page (live demo with fake streaming, panel over a Modal, every part). Playwright: contrast + axe in both themes, IME Enter, scroll position while streaming, dialog over modal, phone layout.

### Changed
- **DESIGN_SYSTEM §14b:** AI conversations use the shared chat parts (replaces "chat parts kept in each app").
- **Phones:** `Badge` / `STATUS_PILL` never wrap; table cells stay on one line so a `Table` scrolls sideways on a phone instead of squeezing columns (`TD wrap` for a long-text column); an empty chat starts at the top so the intro shows first.
- **Storybook on phones:** the page column no longer grows to its widest demo (an auto-margin flex item sized to content), section headers stack under 640px, shorter tab-bar labels. Playwright checks that every page fits a 375px screen.

## [0.5.0] - 2026-10-31

### Added
- **Tokens:** type scale `text-caption` 11 · `text-label` 12 · `text-ui` 13 · `text-ui-lg` 14 · `text-title` 15 · `text-title-lg` 16 · `text-kpi` 18 · `text-heading-sm` 20 · `text-heading` 22 · `text-heading-lg` 24 · `text-display` 26; layers `z-sticky` 30 · `z-drawer` 40 · `z-modal` 50 · `z-dialog` 60 · `z-keypad` 70 · `z-popover` 80 · `z-toast` 90 · `z-tooltip` 95; `bg-overlay`; `shadow-overlay`, `shadow-float`; status `bg/border-{danger,success,warning,info}-{bg,border}`, `bg-*-solid`, `text-on-solid`; `ease-out-soft` / `ease-in-soft`; pinned `radius-lg/xl/2xl`.
- **Components:** `Button` + `Spinner`, `Field` + `Input` + `Textarea` (+ `useField`), `Checkbox`, `Switch`, `RadioGroup`, `Tabs`, `Tooltip`, `Menu`, `toast()` / `dismissToast()` + `ToastHost`, `Alert`, `Progress`, `Avatar`, `EmptyState`, `Table` (`THead`, `TBody`, `TR`, `TH`, `TD`), `Drawer`, `SemiLocaleProvider` / `useSemiLocale` (`vi`, `en`), `useDialog` / `useFocusTrap` / `useScrollLock`, `useAnchoredPosition`.
- **Styles:** `BTN_GHOST`, `BTN_SM`, `EMPTY_STATIC`, `cn()`, `FOCUS_RING`, `OVERLAY`. Icon `more`.
- **Tooling:** `lint/classes.mjs` (class-token analysis) and `lint/codemod.mjs` (token codemod) with `node --test` fixtures (`npm test`); `/semi-init --dry-run` writes `semi-codemod-report.md`; `/semi-audit --inventory` writes `semi-migration.json` (per-module debt + coverage %); `components.json` manifest + generated component inventory in `QUICK_REF.md` (`npm run build:manifest`, checked by `npm run check`); Playwright browser checks (`npm run test:ui`) in CI.
- **Storybook:** "Primitives & Forms" and "Layout Patterns" pages; every exported component is shown.

### Changed
- **Library uses the new tokens everywhere:** px text sizes → type scale, `z-[9000]/[10000]/[10001]` → `z-dialog/keypad/popover`, `bg-black/70` → `bg-overlay`, `shadow-2xl` → `shadow-overlay`, status dots and danger buttons → status tokens.
- **Accessibility:** `Modal`, `confirmDialog`, `NumPadPopup` trap focus, lock page scroll and return focus; `Modal` gets `aria-labelledby`, optional `description`, `closeOnBackdrop`; `CustomCombobox` is a WAI-ARIA combobox (↑/↓/Enter/Escape, `aria-activedescendant`); `Pills` sets `aria-pressed`; all shared control classes (`BTN_*`, `ICON_BTN*`, `MODAL_CLOSE`, `CHIP_BASE`, header / viewport controls) show a `focus-visible` ring.
- **UI strings** of every component come from the locale (props still override).
- **`semi-lint`:** colour rules read class tokens from every string literal (and `@apply` in CSS) instead of regex over lines; scans `.js/.jsx/.mjs/.css` too; reports hit lines. New ratchet rules `no-fixed-tone-text`, `literal-colour-value`, `arbitrary-text-size`; `hex-colour-class` covers every colour prefix and `rgb()/hsl()/oklch()`; `legacy-ui-wrapper` points to the new components.
- **`/semi-init` codemod:** token-level, string literals only; collapses light/dark pairs; dark-first mapping; type scale; reports unresolved tokens instead of guessing. Starter layout includes `ToastHost`.
- **`/semi-init`, `/semi-audit`, `/semi-update` skills:** inventory → plan (Foundation / Patterns, one module per PR) → Definition of Done (0 findings per module, both themes checked) → final zero scan.

### Migration
- Existing apps: run `/semi-update`. The new ratchet rules start at 0 for every file; preview fixes with `init.mjs --dry-run`, apply, resolve the reported tokens, then shrink the baseline. Add `<ToastHost />` next to `<ConfirmHost />` if you use `toast()`.

## [0.4.0] - 2026-10-31

### Changed (visible)
- **Light/dark contrast (WCAG AA in both themes):** `BTN_PRIMARY`, `MODAL_BTN_PRIMARY`, `headerPrimary` now use `bg-accent hover:bg-accent-hover text-on-accent` — dark theme: brand green with near-black text (6.6:1, was white at 2.94:1); light theme: `primary-700` with white (6.1:1). Danger buttons, KPI deltas, selected options, active tab, pagination, links, icon tones and `TONAL_SURFACE` use the new themed text tokens instead of fixed `-300/-400` shades.
- **`text-muted`:** `#8b919a` in dark (5.5:1 on panel, was 3.64:1), `#5b6779` in light (5.2:1 on field, was 4.34:1).
- **Focus ring default:** `--default-ring-color` follows `primary-500` instead of Tailwind blue.

### Added
- **Themed semantic tokens:** `bg-accent`, `bg-accent-hover`, `text-on-accent`, `text-accent-fg`, `text-danger-fg`, `text-success-fg`, `text-warning-fg`, `text-info-fg`, `text-tone-<hue>` (purple, violet, indigo, blue, sky, cyan, teal, emerald, amber, orange, rose, pink).
- **`<ThemeScript />` / `themeScript()`:** inline `<head>` script that applies the stored theme before the first paint (no flash of the dark theme for light-mode users). Use with `<html suppressHydrationWarning>` and the same options as `ThemeProvider`. `/semi-init` starter layout includes it.
- **`data-theme="system"`:** follows `prefers-color-scheme` in pure CSS.
- **`<ThemeSwitcher />`:** three-way Sáng · Tối · Hệ thống picker (`showLabels`, `fullWidth`, `labels` for i18n; `radiogroup` semantics). `useTheme()` now also returns `mounted`; `ThemeSwitcher` and `ThemeToggle` show no selection until it is true, so the SSR default never flashes as selected.
- **`monitor` icon** (system theme / desktop) with catalog metadata.
- **Storybook:** theme switcher in the sidebar footer (toggle when collapsed), a "0. Theme" showcase with fixed `data-theme="light"` / `"dark"` previews side by side, live package version and icon count.
- **`<Card>`** (`interactive`, `active`): component form of `CARD` / `CARD_HOVER` / `CARD_ACTIVE`.
- **Maintainer tooling:** `npm run sync:vendor` / `check:vendor` (plugin copies of `semi-lint` + tokens), `npm run bump <version>` / `check:version` (all five manifests incl. `package-lock.json`), both part of `npm run check`; `.github/workflows/check.yml` runs check + build on PRs.

### Fixed
- **ThemeProvider** no longer resets `<html>` to `defaultTheme` on mount before reading the stored theme, and follows OS changes while in `system` mode.
- **Token CSS:** semantic tokens no longer self-reference (`--color-canvas: var(--color-canvas)`); values live in `--semi-*` and utilities read them via `@theme inline`. `--color-*` runtime variables are still defined in every theme scope; `text-text-contrast`-style duplicate utilities are gone.
- **`/semi-audit` used a stale vendored `semi-lint`** (missing Issue #3/#4 rules); it is re-synced, guarded by `check:vendor`, and the audit's literal-palette pattern now comes from `semi-lint` itself.
- **`card-class-override`** now targets the real `<Card>` and catches any `bg-*` / `shadow-*`, including variants (`hover:shadow-lg`).
- **Codemod / audit tonal text:** `/semi-init` maps `text-<hue>-600…900` to `text-tone-<hue>`; `/semi-audit` suggests the same.
- `package-lock.json` version was stuck at 0.2.5.
- **`<Loading>` (all skeleton wrappers)** was not positioned, so its absolute `sr-only` label escaped `AppShell`'s scroll container and made the whole window scroll past the shell; it is now `relative`.

### Migration
- Apps: add `<ThemeScript />` to `<head>` and `suppressHydrationWarning` to `<html>` (see README §3). Apps that override `primary-*` with a dark brand colour should also set `--semi-on-accent: #fff` for the dark theme.

## [0.3.7] - 2026-10-31

### Fixed
- **Gradient Stop Palette Guard Rails (`semi-lint`, Issue #4):**
  - Expanded `no-literal-palette` in `lint/semi-lint.mjs` to detect gradient stop utilities (`from-`, `via-`, `to-`) using physical color literals (`from-white`, `to-slate-900`, etc.).
  - Added warning that Semi Design System enforces Flat UI (no gradients), but if transitional fade masks are kept during migration, stops must use semantic tokens (`from-panel`, `to-transparent`).
- **Semantic Codemod for Fade Overlays (`semi-init`, `init.mjs`):**
  - Added mappings in `runSemanticCodemod` to adapt `(from|via|to)-white` $\rightarrow$ `(from|via|to)-panel`, `(from|via|to)-slate-50` $\rightarrow$ `(from|via|to)-field`, and `(from|via|to)-slate-900` $\rightarrow$ `(from|via|to)-canvas`.
- **Synchronized Palette Audit (`semi-audit`, `audit.mjs`):**
  - Updated `PHYSICAL_RX` and `SEMANTIC_RX` to cover `from-`, `via-`, and `to-` prefixes.

## [0.3.6] - 2026-10-31

### Added
- **Universal Tonal Architecture Across All Components (`@semi/ui`, `@semi/ui/styles`):**
  - Added `TONAL_CONTAINER` and `TONAL_HOVER` to `@semi/ui/styles` (`surfaces.ts`) for consistent styling of chromatic cards, alert banners, callouts, stat widgets, table rows, and interactive buttons.
  - Multi-state theme-matching tokens:
    - Static container: `bg-<color>-500/10 border-<color>-500/20 text-<color>-700 dark:text-<color>-300`
    - Hover state: `hover:bg-<color>-500/15 hover:border-<color>-500/30`
    - Active state: `active:bg-<color>-500/20`
    - Dividers & rings: `divide-<color>-500/20 ring-<color>-500/20`
- **Universal Component Tonal Analysis in `/semi-audit` (`audit.mjs`):**
  - Scans across all component types (cards, banners, callouts, table rows, buttons, badges, chips) and all prefixes (`hover:`, `active:`, `border-`, `divide-`, `ring-`, `text-`).
  - Reports cluster breakdown with both container and hover dual-theme adaptations.
- **Universal Multi-State Tonal Codemod in `/semi-init` (`init.mjs`):**
  - Full automated migration for any component type across static background, hover background, active background, static border, hover border, dividers, rings, and dual-theme high-contrast text.
- **Air-Tight Pastel Surfaces Lint Rule (`semi-lint`):**
  - Expanded `no-solid-pastel-surfaces` in `lint/semi-lint.mjs` to detect all 16 Tailwind chromatic hues across `bg`, `hover:bg`, `active:bg`, `border`, `hover:border`, `divide`, and `ring`.

## [0.3.5] - 2026-10-31

### Added
- **Theme-Matching Tonal Architecture (`@semi/ui`, `@semi/ui/styles`):**
  - Added `SemanticTone` type and `TONAL_SURFACE` constants across 16 chromatic hues (`purple`, `violet`, `indigo`, `blue`, `sky`, `cyan`, `teal`, `emerald`, `green`, `amber`, `yellow`, `orange`, `rose`, `red`, `pink`, `gray`).
  - Added first-class `<Badge tone="..." icon="..." dot>` component in `@semi/ui` for category tags, status pills, and plan labels.
  - Enhanced `<Chip tone="...">` to support theme-matching active chromatic tones.
- **Chromatic Tonal Component Analysis in `/semi-audit` (`audit.mjs`):**
  - Automatically scans and reports chromatic tonal classes (e.g. `bg-purple-50 text-purple-700`, `bg-sky-100 text-sky-800`), grouping by color family with recommended Dual-Theme tone adaptations.
  - Added interactive multiple-choice question for automated tonal adaptation.
- **Theme-Matching Tonal Codemod in `/semi-init` (`init.mjs`):**
  - Automatically adapts legacy solid pastel classes to Semi Dual-Theme matching tones:
    - `bg-<color>-50/100` $\rightarrow$ `bg-<color>-500/10`
    - `border-<color>-100/200/300` $\rightarrow$ `border-<color>-500/20`
    - `text-<color>-600/700/800/900` $\rightarrow$ `text-<color>-700 dark:text-<color>-300`
  - Preserves chromatic color identity (purple stays purple, amber stays amber) while eliminating dark-mode glare and ensuring optimal contrast in both themes.

## [0.3.4] - 2026-10-31

### Added
- **Solid Pastel Surfaces Lint Rule (`semi-lint`):** Added rule `no-solid-pastel-surfaces` (RATCHET) in `lint/semi-lint.mjs` to flag solid chromatic pastel backgrounds and borders (`bg-*-50/100`, `border-*-200`), resolving Issue #3. In Dark Mode (`data-theme="dark"`), solid pastels turn into glaring white/neon rectangular slabs.
- **Tinted Cards & Callouts Guidelines (`docs/DESIGN_SYSTEM.md`, `docs/QUICK_REF.md`):** Documented canonical Semi Bento pattern for tinted cards (neutral `bg-panel border-line` with `<IconTile tone="...">`) and callouts using alpha transparency (`bg-<color>-500/10 border-<color>-500/20`), which automatically blend seamlessly in both dark and light modes.

### Fixed
- **Divider Palette Checks & Codemod (`semi-lint`, `semi-init`):** Expanded `no-literal-palette` to include `divide-` prefix (`divide-slate-100`, `divide-gray-100`, etc.), and added `divide-*` mappings to `runSemanticCodemod` (`divide-divider` and `divide-line`), resolving Issue #2.

## [0.3.3] - 2026-10-31

### Fixed
- **Semantic Codemod in `/semi-init` (`init.mjs`):** Expanded `runSemanticCodemod` to map `border-(?:slate|gray|zinc|neutral|stone)-50` to `border-divider`, resolving Issue #1. In legacy tables and list views, step-50 borders previously went unmigrated and appeared as stark white lines in dark mode. Also generalized all background, text, and border mapping regexes across `slate`, `gray`, `zinc`, `neutral`, and `stone`.

## [0.3.2] - 2026-10-31

### Fixed
- **`/semi-triage` audit (`triage.mjs`):** glow `shadow-[0_0_…]` was never detected; gradient check flagged prose (`up-to-date`, `from-scratch`); dual-theme check matched any word containing "light"/"dark". The audit now scans only the *proposed solution* sections, so legacy code quoted under "Current Workaround" no longer fails a valid proposal. Added hex-class, inline `<path>`, `text-xs/sm`, `uppercase` and missing-template checks, plus `--audit-file` for offline drafts.
- **`/semi-update` (`update.mjs`):** now refreshes the whole managed `semi-design-system` block in consumer `AGENTS.md` from the plugin template (previously only the version stamp changed, so new rules never reached existing projects).

### Changed
- **`/semi-propose`:** must verify the gap first (outdated `@semi/ui` → `/semi-update`; already in docs/exports; app-specific → `UI_EXTENSIONS.md`), search for duplicates (`--search`), self-audit the draft, and get user approval before filing. Scanner reports installed vs latest version and workarounds (inline SVG, native controls) and skips `node_modules`. Fallback writes to the OS temp dir (not the consumer repo) and handles over-long prefilled URLs; labels are dropped and retried if the author cannot set them. `--dry-run` added.
- **`/semi-triage`:** issue content is treated as untrusted input; 5-question analysis (real need, already solvable, generic, compliant minimal API, cost); `NEEDS INFO` verdict; user approval before posting/labelling/closing; close-the-loop step after release. `--ensure-labels`, `--label` filter, `--remove-labels`, closing comment.
- **Always-on rules (`plugin/rules/AGENTS.md`, `semi-ui.md`):** new rule 4 "Gaps go upstream": consumer agents use `/semi-propose` instead of inventing local primitives, mark workarounds `TODO(semi#<issue>)`.
- Repo labels created: `ecosystem-proposal`, `component`, `tokens`, `icons`, `lint`, `triage:accepted|generalized|extension|rejected`, `needs-info`.

## [0.3.1] - 2026-10-31

### Added
- **Ecosystem Collaboration Skills (`/semi-propose` & `/semi-triage`):**
  - **`/semi-propose` (`plugin/skills/semi-propose/`):** Allows AI agents in consumer projects (Auton Platform, IoT, BMCU, 3D Noobs Studio, etc.) to scan project gaps, detect local wrapper components or missing primitives, format standardized feature requests, and publish issues directly to GitHub repo `hoanghuynh296/semi-nextjs-codebase` using GitHub API or prefilled issue URLs.
  - **`/semi-triage` (`plugin/skills/semi-triage/`):** Allows core maintainer agents to list, fetch, and audit proposed issues against Semi Design System constraints (Flat surfaces, Semantic Tokens, Typography, Radii, Bento structures), formulate generalized solutions, assign verdicts (`ACCEPT`, `GENERALIZE`, `WORKAROUND / EXTENSION`, `REJECT`), and post architectural analysis back to GitHub issues.

## [0.3.0] - 2026-10-31

### Added
- **Two-Tier Semantic Tokens Architecture (`tokens/tokens.json`, `tokens/tokens.css`):**
  - Replaced static surface color tokens with dynamic CSS-variable-backed Semantic Tokens:
    - `--color-canvas` (`bg-canvas`): `#0c0d0e` (Dark) / `#f1f5f9` (Light)
    - `--color-app` (`bg-app`): `#121316` (Dark) / `#ffffff` (Light)
    - `--color-panel` (`bg-panel`): `#18191c` (Dark) / `#ffffff` (Light)
    - `--color-field` (`bg-field`): `#1e1f23` (Dark) / `#f1f5f9` (Light)
    - `--color-raised` (`bg-raised`): `#26282e` (Dark) / `#e2e8f0` (Light)
    - `--color-text-contrast` (`text-contrast`): `#ffffff` (Dark) / `#0f172a` (Light)
    - `--color-text-body` (`text-body`): `#d1d5db` (Dark) / `#334155` (Light)
    - `--color-text-muted` (`text-muted`): `#6b7280` (Dark) / `#64748b` (Light)
    - `--color-line` (`border-line`): `rgba(255,255,255,0.08)` (Dark) / `rgba(0,0,0,0.08)` (Light)
    - `--color-line-hover` (`border-line-hover`): `rgba(255,255,255,0.16)` (Dark) / `rgba(0,0,0,0.16)` (Light)
    - `--color-divider` (`border-divider`): `rgba(255,255,255,0.05)` (Dark) / `rgba(0,0,0,0.05)` (Light)
  - Generated compiled CSS utilities and Tailwind 4 `@theme` mappings via updated `scripts/build-tokens.mjs`.
  - Added support for theme switching via `[data-theme="dark"]`, `[data-theme="light"]`, and `.dark` / `.light` class fallbacks.
- **Theme Provider & Switcher Components (`@semi/ui`):**
  - Added `ThemeProvider`, `useTheme()`, and `ThemeToggle` to `@semi/ui`.
  - Added `sun` and `moon` icons to `src/Icon.tsx` and `src/iconCatalog.ts`, bringing total standardized icons to 168.
- **Linter Upgrades (`lint/semi-lint.mjs`):**
  - Added `no-literal-palette` (Ratchet): Banning direct physical classes (`bg-white`, `text-slate-900`, `border-slate-200`, `bg-slate-50`, `bg-gray-800/900`, etc.) in favor of semantic tokens.
  - Added `card-class-override` (Hard): Preventing direct background and shadow overrides on `<Card>`.
  - Retired `input-bg-field` rule as `bg-field` is now the formal semantic token for form fields.
- **Plugin Skill Enhancements (`semi-audit` & `semi-init`):**
  - `/semi-audit`: Added automated scanning for physical Tailwind color classes and calculated `semanticAdoptionRate` with dual-theme health indicators.
  - `/semi-init`: Added automated codemod (`runSemanticCodemod`) mapping legacy classes (`bg-white` -> `bg-panel`, `bg-slate-50` -> `bg-field`, `text-slate-900` -> `text-contrast`, `text-slate-500` -> `text-muted`, `border-slate-200` -> `border-line`, removing drop shadows).
  - `/semi-init`: Eliminated destructive blanket skips (`skip: { ...: ["src/app"] }`) in `semi-lint.json`, recording legacy debt via `--update-baseline` in `semi-lint-baseline.json`.
- **Ecosystem Collaboration Skills (`/semi-propose` & `/semi-triage`):**
  - Added `/semi-propose`: Enables agents in downstream projects to scan unmet requirements, structure standardized GitHub issues, and publish them directly to `hoanghuynh296/semi-nextjs-codebase` via GitHub API or prefilled issue URLs.
  - Added `/semi-triage`: Enables core maintainer agents to list, view, audit rule compliance, and formulate generalized solutions for ecosystem proposals without violating Semi Design System constraints.
- **Documentation:**
  - Added "Dual-Theme & Semantic Tokenization" section in `docs/DESIGN_SYSTEM.md`, updated `docs/QUICK_REF.md`, `docs/DECISIONS.md`, and maintainer guides.

## [0.2.9] - 2026-10-31

### Changed
- **Universal Icon Metadata & Semantic Generalization (`src/iconCatalog.ts`, `docs/ICONS.md`):**
  - Refactored metadata across 76+ icons previously described with narrow, single-domain terminology (such as 3D printing or slicer specifics) into universal, multi-domain definitions suitable for Web, SaaS, Mobile, E-commerce, Dev tools, Cloud/IoT, Media, and 3D applications.
  - Examples:
    - `merge`: Generalized from *"gộp các chi tiết trong viewport 3D"* to *"Hợp nhất các đối tượng, gộp nhánh mã nguồn hoặc liên kết dữ liệu (Merge)"* with multi-purpose examples (Git merge, mesh boolean union, combining datasets).
    - `settings` / `sliders`: Clarified distinction between system configuration vs parameter tuning across web apps, SaaS settings, and IoT devices.
    - `send`: Universalized for message submission, chat dispatch, email sending, or command triggers.
    - `box`: Universalized for inventory boxes, postal parcels, UI bounding boxes, and 3D containers.
    - `code`, `terminal`, `server`, `cpu`, `activity`: Expanded to cover general backend infrastructure, DevOps CI/CD, web development, and system monitoring.
    - `scissors`, `crop`, `resize`, `move`, `rotateCw`, `rotateCcw`, `ruler`, `pipette`, `shapes`: Refactored to represent universal graphic, document, spatial, and UI manipulation tools.
    - `file*` & `folder*` family: Generalized across office documents, spreadsheets, source files, archives, and cloud drives.
  - Maintained 3D and hardware capabilities as valid secondary use cases without restricting primary semantics.
  - Synchronized documentation tables in `docs/ICONS.md` (§2.2–§2.10 and §3 Aliases) with the updated agnostic taxonomy.
- **Storybook Shell:** Updated version badge to `Semi UI v0.2.9` (166 Icons).

## [0.2.8] - 2026-10-31

### Added
- **Media, Documents & Playback Comprehensive Expansion (`@semi/ui`):** Added 22 new Lucide-standard 24×24 stroke icons expanding the system to 166 icons total (Media & Files now contains 31 icons):
  - **Documents & File Management:** `fileText` (documents / README / PDF), `fileCode` (source code / G-code / macro script), `fileArchive` (ZIP / TAR / 7Z archive / project package), `fileCheck` (validated file / integrity checksum pass), `filePlus` (create file / new preset), `fileSpreadsheet` (Excel / CSV export / inventory sheet), `folderPlus` (new directory / project folder), `folderOpen` (open folder / active directory), `paperclip` (file attachments / inquiry attachment).
  - **Audio & Sound:** `volume2` (speaker audio / buzzer level), `volumeX` (mute / silent mode / buzzer off), `headphones` (headphones / audio output), `mic` (microphone / voice control / audio notes).
  - **Video & Timelapse:** `video` (live webcam stream RTSP / timelapse video), `videoOff` (disable camera / privacy mode), `film` (timelapse reel / animation series).
  - **Playback & Editing:** `skipBack` (previous frame / previous layer), `skipForward` (next frame / next layer), `repeat` (loop video / repeat print cycle), `fastForward` (speed up simulation 2x/4x), `rewind` (rewind simulation timeline), `crop` (crop thumbnail / photo frame).
- **Aliases & AI Retrieval:** Added 50+ canonical aliases to `ICON_ALIASES` and `semi-lint` HARD rules (`document`, `doc`, `pdf`, `gcode`, `zip`, `archive`, `excel`, `csv`, `attach`, `sound`, `speaker`, `volume`, `mute`, `silent`, `webcam`, `timelapse`, `movie`, `loop`, `crop_image`, etc.).
- **Storybook Shell:** Updated to `166 Icons` dynamic count across Foundations & Component showcases.

## [0.2.7] - 2026-10-31

### Added
- **3D Slicing, CAD & Hardware Comprehensive Expansion (`@semi/ui`):** Added 21 new Lucide-standard 24×24 stroke icons expanding the system to 144 icons total:
  - **3D Slicing & CAD Tools:** `move` (XYZ coordinates / model translation / jog motor), `rotateCw` (90° clockwise rotation / plate rotate), `rotateCcw` (counter-clockwise rotation), `crosshair` (homing G28 / probe point / auto bed leveling), `ruler` (measurement / dimension / distance tool), `magnet` (lay on face / snap to bed / magnetic PEI plate), `pipette` (filament color picker / AMS slot color), `shapes` (primitive shapes / modifiers / negative volume / support blocker), `focus` (center on object / zoom to fit / camera focus), `orbit` (3D camera orbit / viewport free rotation).
  - **Hardware, Devices & Maintenance:** `thermometer` (nozzle / bed / chamber temp °C), `wrench` (mechanical maintenance / nozzle change / belt tensioning), `hammer` (hardware workshop / fabrication / DIY tools), `circuitBoard` (mainboard / MCU / toolhead CAN bus PCB), `usb` (USB drive / serial UART printing), `bluetooth` (Bluetooth BLE printer pairing / sensors), `hardDrive` (SD / MicroSD / eMMC storage for G-codes), `cable` (stepper motor wires / FPC cable / CAN bus harness), `battery` (UPS power backup / portable device battery), `scanLine` (Micro Lidar scan / first layer inspection / 3D scan), `shieldAlert` (safety enclosure door sensor / thermal runaway protection).
- **Aliases & AI Retrieval:** Added 40+ canonical aliases to `ICON_ALIASES` and `semi-lint` HARD rules (`temp`, `temperature`, `spanner`, `maintenance`, `jog`, `rotate`, `homing`, `origin`, `abl`, `measure`, `snap`, `lay_on_face`, `eyedropper`, `color_picker`, `primitives`, `zoom_to_fit`, `orbit_camera`, `sd_card`, `motherboard`, `pcb`, `wire`, `lidar`, `safety_alert`, etc.).
- **Storybook Shell:** Updated to `144 Icons` dynamic count across Foundations & Component showcases.

## [0.2.6] - 2026-10-31

### Added
- **E-Commerce Comprehensive Icon Expansion (`@semi/ui`):** Added 19 new Lucide-standard 24×24 stroke icons expanding the E-Commerce domain to 31 icons and total system icons to 123:
  - **Orders & Logistics:** `package` (order parcel / package), `packageOpen` (unboxing / packing / returns), `packageX` (cancelled order / failed delivery), `packagePlus` (new order / restock), `clipboardList` (order list / manifest / inventory), `mapPin` (shipping address / pickup location).
  - **Payments & Trust:** `banknote` (cash on delivery / COD / paper money), `landmark` (bank transfer / bank account), `qrCode` (VietQR / QR payment), `barcode` (SKU barcode / barcode scanner), `badgeCheck` (verified mall / official shop / trust badge).
  - **Marketing, Engagement & Loyalty:** `gift` (gift / present / bonus reward), `heart` (wishlist / favorite / like), `star` (ratings / reviews / stars), `badgePercent` (flash sale / deep discount / hot deal), `flame` (best seller / hot trending), `megaphone` (marketing campaigns / promotional broadcasts), `award` (loyalty program / membership tier / VIP), `calculator` (cost calculator / filament print pricing).
- **Interactive Storybook App (`app/`):**
  - Updated icon counts dynamically across Foundations & Icon Catalogue (`123 Icons chuẩn hóa`).
  - Added new e-commerce aliases to `ICON_ALIASES` and `semi-lint` HARD rules (`wishlist`, `like`, `rating`, `review`, `qr`, `vietqr`, `cod`, `cash`, `bank`, `unboxing`, `cancel_order`, `deal`, `hot`, `loyalty`, `calc`, etc.).

## [0.2.5] - 2026-10-30

### Added
- **Multi-Domain Icon Pack (`@semi/ui`):** Added 22 new Lucide-standard 24×24 stroke icons expanding the system to 104 icons total:
  - **E-Commerce & Retail:** `bag` (checkout / shopping bag), `creditCard` (card payments / Stripe / VNPay), `receipt` (invoices / VAT receipts), `truck` (delivery / logistics), `packageCheck` (delivered / received package), `percent` (discounts / coupons), `store` (shops / storefronts), `wallet` (wallet balance / prepaid).
  - **Developer & DevOps:** `database` (SQL / SQLite / Postgres), `server` (backend host / Klipper / node), `cpu` (processor / MCU / load), `bug` (debug / bug report), `gitCommit` (commit hash / firmware version), `gitPullRequest` (pull request / preset contribution), `shield` (SSL / security / firewall), `key` (API keys / auth tokens), `webhook` (webhook integrations / bot notification).
  - **Analytics & Metrics:** `activity` (heartbeat / telemetry), `trendingUp` (growth / positive KPI), `trendingDown` (reduction / negative KPI), `pieChart` (pie chart / allocation), `gauge` (speed / meter / pressure).
- **Schema & AI Retrieval Engine (`src/iconCatalog.ts`, `docs/ICONS.md`):**
  - Upgraded `IconMeta` with `domain` (`core`, `ecommerce`, `developer`, `analytics`, `hardware_3d`, `media`), `intents`, and `lucideEquivalent`.
  - Upgraded `suggestIcon` with fuzzy matching, token normalization, intent search, and Lucide alias lookup.
  - Expanded `semi-lint` HARD rule `icon-alias` regex covering 80+ alias and Lucide variants.

## [0.2.4] - 2026-10-30

### Added
- **AppShell Section Headers (`@semi/ui`):** Added visible section header rendering with `icon?: IconName` and `hideLabel?: boolean` in `ShellNavSection`, allowing sidebar items to be grouped by category or folder with clean headers. Empty non-loading sections are cleanly omitted.

## [0.2.3] - 2026-10-30

### Added
- **Pin Icon (`@semi/ui`):** Added standard 24×24 stroke path for `pin` (thumbtack / pushpin) into `ICONS` and registered in `iconCatalog.ts` and `docs/ICONS.md`.
- **AppShell NavItem Right Slot (`@semi/ui`):** Added `right?: React.ReactNode` to `ShellNavItem` in `AppShell` allowing custom actions (e.g. pin button, badges) positioned at the right end of a tab item with hover reveal capability.

## [0.2.2] - 2026-10-30

### Added
- **Semantic Icon Registry & Guide (`docs/ICONS.md`, `src/iconCatalog.ts`):** Complete catalog with metadata, purpose, do's & don'ts, and keywords for all 67 icons in `@semi/ui`. Added action mapping table for CRUD, navigation, hardware, IoT, status, and commerce.
- **Core Entity Icons (`@semi/ui`):** Added standard 24×24 stroke paths for `user` (profile / customer), `users` (team / multi-user), `filter` (funnel data filters), `bell` (notifications), and `tag` (categories / badges) to `ICONS`.
- **Icon Linter Rule (`lint/semi-lint.mjs`):** Added `icon-alias` HARD rule catching common misnamed icon calls (`delete`, `remove`, `cancel`, `gear`, `funnel`, `profile`, `notification`, etc.) and directing to canonical `IconName`.
- **AppShell Shimmer (`@semi/ui`):** Added `loading?: boolean` and `loadingCount?: number` to `ShellNavSection` in `AppShell` so side menu sections can render shimmering placeholder items while data is loading.

## [0.2.1] - 2026-10-30

### Added
- **Icons (`@semi/ui`):** Added Lucide 24×24 stroke paths for `terminal` (`>_` prompt), `folder` (directory / Finder), `file` (document), `smartphone` (mobile device), and `branch` (git branch) into `ICONS`.

## [0.2.0] - 2026-10-30

### Added
- **Structural Layout & Page Components (`@semi/ui`):**
  - `AppShell` + `MobileTabBar` (`TAB_BAR_PAD`): 2-panel floating Bento frame on `bg-canvas` (`md:p-2 md:gap-2`), collapsible `w-52` ↔ `w-14` `rounded-2xl` sidebar with grouped `sections`, primary CTA slot, and mobile bottom navigation bar (plus "Menu" bottom sheet when an app has >5 routes).
  - `PageTitle` & `PageTabsTitle`: text-only `font-display` page heading (`22px–26px`) and underline group tabs (`h-[2.5px] bg-primary`).
  - `SubpageToolbar`: unified `STICKY_TOOLBAR` with `left` filters and `right` icon-only `BTN_PRIMARY BTN_ICON` + `SearchInput` + `RefreshButton`.
  - `KpiCard`: metric card with `18px–22px` `tabular-nums` value, flat coloured icon in label, and shimmer `loading` state.
  - `Modal`: shared portal dialog with `MODAL_BACKDROP`, `MODAL_PANEL`, `MODAL_HEAD`, `MODAL_CLOSE`, and `MODAL_FOOT`.
- **Form & Shell Style Constants (`@semi/ui/styles`):** `FIELD_LABEL`, `FIELD_INPUT`, `FIELD_TEXTAREA` (`bg-white/[0.05]` so inputs contrast inside `bg-field` modals), and `SHELL_OUTER`, `SHELL_ASIDE`, `SHELL_MAIN`, `SHELL_CONTAINER`.
- **Structural Linter Rules (`lint/semi-lint.mjs`):**
  - `legacy-shell-aside`: bans edge-to-edge `border-r` sidebars and `-translate-x-full` mobile hamburger drawers in favour of `AppShell` + `MobileTabBar`.
  - `legacy-ui-wrapper`: bans local `ui.tsx` wrapper barrels (`PageHeader`, `Select`, `Modal`, `Input`, `Textarea`, `Button`, `EmptyState`) that shadow `@semi/ui`.
  - `input-bg-field`: bans `bg-field` on inputs/textareas (invisible inside `bg-field` modals; enforces `FIELD_INPUT` / `FIELD_TEXTAREA`).
- **Monorepo & Structural Audit (`audit.mjs` & `init.mjs`):** Automatically discovers all frontend apps in a monorepo (`frontend/dashboard`, `frontend/store`, `web/`, `apps/*`) and audits structural alignment with 3D Noobs Studio.

## [0.1.0] - 2026-10-30

### Added
- **Design Tokens (`tokens/tokens.json` → `tokens/tokens.css`):** Dark surface scale (`canvas`, `app`, `panel`, `field`, `raised`, `line`, `line-hover`, `divider`), brand `primary-*` (`#00AE42`), semantic `emerald-*` / `amber-*` / `rose-*` / neutral `gray-*` palettes, and typography tokens (`--font-sans`, `--font-display`, `--font-mono`).
- **Base CSS (`styles/base.css`):** Shimmer skeleton keyframe, hidden scrollbar utility, focus-visible ring, and touch target resets.
- **Style Constants (`@semi/ui/styles`):**
  - `surfaces.ts`: `CARD`, `CARD_HOVER`, `CARD_ACTIVE`, `HERO`, `TILE`, `SECTION_*`, `COUNT_PILL`, `EMPTY`, `ICON_BTN*`, `STATUS_PILL`, `STATUS_DOT`, `STICKY_TOOLBAR`, `MODAL_*`.
  - `buttons.ts`: `BTN_PRIMARY`, `BTN_SECONDARY`, `BTN_DANGER`, `BTN_ICON`, `MODAL_BTN_*`.
  - `appChrome.ts`: `HEADER_ICON_*`, `headerPrimary`, `HEADER_PILL`, `VIEWPORT_*`.
- **Shared React Components (`@semi/ui`):** `Icon`, `IconTile`, `AppHeader`, `PageActions`, `Chip`, `Pills`, `CustomSelect`, `CustomCombobox`, `NumberInput`, `NumPadPopup`, `DatePicker`, `SearchInput`, `Pagination`, `SidePanel`, `RefreshButton`, `Skeleton` (`SkeletonCard`, `SkeletonGrid`, `SkeletonRows`, `PageSkeleton`), `confirmDialog` + `ConfirmHost`, `ExternalLink`, `Markdown`.
- **Linter (`lint/semi-lint.mjs`):** Zero-dependency CLI (`npx semi-lint`) with 15 hard rules, 7 ratchet rules, JSON output mode (`--json`), and per-project `semi-lint.json` configuration.
- **Agent Plugin (`plugin/`):** `semi-design` bundle for Antigravity and Claude Code including `rules/AGENTS.md`, `PostToolUse` auto-lint hook, and skills `semi-ui`, `/semi-init`, `/semi-audit`, and `/semi-update`.
