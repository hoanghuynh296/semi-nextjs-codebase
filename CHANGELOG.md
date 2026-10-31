# Changelog

All notable changes to the **Semi Design System** (`@semi/ui` and `semi-design` plugin) are documented in this file.

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
