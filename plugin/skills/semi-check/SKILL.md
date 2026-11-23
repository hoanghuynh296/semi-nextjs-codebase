---
name: semi-check
description: Check an existing app against its brand and the Semi Design System (@semi/ui), then fix it after the user agrees - the first adoption of Semi in an app (with or without @semi/ui) and the periodic check after. Audits every frontend app (foundation, brand kit, lint rules, colour / size tokens, structure, density and accessibility of the rendered screens), writes every issue with file:line by phase to semi-check.md, shows a short summary, asks, then fixes phase by phase (foundation, token codemod, hand fixes, structure) and verifies until clean. Triggered by /semi-check.
---

# Check and fix an app (`/semi-check`)

The Semi commands, one per place:

| Where you are | Command |
|---|---|
| Brand repo (`brand.json`): create or change the brand | **`/semi-brand`** |
| Empty folder: a new product | **`/semi-new-app`** (with `--brand <kit>` for a product of a brand) |
| Existing app: check it against the brand and Semi, then fix | **`/semi-check`** |
| Existing app: the brand kit or Semi has a new release | **`/semi-sync`** |

Building screens needs no command (the `semi-ui` skill runs on its own); density and type scale are asked in words.

The check part changes **no source file**. Its only output is `semi-check.md` at the folder it checks: every issue with
`file:line` and what to do. Nothing is fixed until the user says so. When nothing is left, `semi-check.md` is deleted.

## Workflow

1. **Check** the workspace root (it finds every Next.js / React app, also in monorepos):
   ```bash
   node "<path-to-this-skill>/scripts/audit.mjs" --cwd "<workspace-or-app-dir>"
   ```
   No app at all → stop and point to `/semi-new-app`. Nothing found → say so and stop. Folders git ignores and nested
   repositories (their own `.git`) are left out, one "Bỏ qua …" line each; `--include <dir>` (audit and `fix.mjs`)
   checks one on purpose when the user asks.
2. **Show** the summary it prints, as is (Vietnamese, short): a table per app with its phase and issue count, then the
   issues grouped in a few lines. Link `semi-check.md` for the details; do not add long lists.
3. **Ask** (`AskUserQuestion`) whether to fix now: "Sửa hết theo thứ tự (Recommended)", "Chỉ phase 1–2 (nền móng,
   token)", "Chưa sửa". A periodic check in CI uses `--ci` and stops here.
4. **Ask the decisions now**, so the answers are known before you start (`AskUserQuestion`, up to 4 per call):
   - **Theme**, when the `providers` item says the theme is not clear ("chưa rõ app sáng hay tối"): ask whether the app
     is light or dark today, and pass `--theme dark|light` to `fix.mjs` (foundation and tokens). Never guess light.
   - **Structure** (phase 4, ids `D…`): "fix as proposed (Recommended)" or "keep". For "keep", add the check to
     `semi-lint.json`: `"keep": { "<check>": "<the user's reason>" }` (or an array of path prefixes). Never keep
     something the user did not choose to keep.
5. **Phase 1 — Foundation** (`F…`). It changes how the app looks, so first take screenshots of 3–5 key pages in the
   app's current theme (dev server + browser, when available). Then:
   ```bash
   node "<path-to-this-skill>/scripts/fix.mjs" --cwd "<audited-dir>" foundation [--brand "<github:owner/repo>"]
   ```
   With a brand (`--brand` to adopt one, or `"brand"` already in `semi-lint.json`) it installs and wires the kit; its
   brand colours and fonts are the brand's (surfaces and text are Semi's neutrals, the same for every brand).
   It installs `@semi/ui` (Next.js and Tailwind stay as they are), adds `transpilePackages`, the Semi CSS block,
   `semi-lint.json` + a baseline of today's lint debt, removes a style / palette left from before 1.0 (`"style"` in
   `semi-lint.json`, `data-style` on `<html>`: Semi has one look), and the Semi block in `AGENTS.md`. It prints the
   `next/font` lines for the fonts the layout lacks (the brand's, or Semi's Geist):
   add them to the layout with the providers. It prints only what it wrote; whatever it could not do goes in one
   **Làm tay** list at the end, and a failed install stops it with exit 1 (npm's error is printed above; fix the
   app's peer conflict, never add `--legacy-peer-deps` on your own, and run foundation again). Then do the `Làm tay` items:
   - **providers:** edit the root layout exactly as the script prints (`ThemeScript` / `ThemeProvider` with the
     `defaultTheme` it detected from the page background, so the app keeps its theme; `ToastHost`, `ConfirmHost`, `TaskHost`);
     keep everything else.
   - **tailwind-v4:** run `npx @tailwindcss/upgrade` in the app (the official tool), check the pages, run foundation again.

   Take the same screenshots again and compare. Expected: fonts, greys, radius and borders move slightly towards Semi.
   Not acceptable: a light app turning dark, unreadable text, broken layout. Fix those before going on.
6. **Phase 2 — Tokens** (codemod), one module at a time for a big app:
   ```bash
   node "<path-to-this-skill>/scripts/fix.mjs" --cwd "<audited-dir>" tokens --only "<app>/<module-dir>"
   ```
   Read the diff: it only rewrites class strings to tokens (colours, sizes, `rounded-*` → `rounded-chip|control|card|panel`,
   `shadow-sm` → `shadow-card`), so the page then follows the app's style. A string is changed only when every token is a
   class, token for token (spacing, line breaks and order stay); SVG geometry, style values and `glsl` / `css`
   templates are never touched. Strings it skipped and files it refused (the result would not parse) are listed: look
   at them by hand. `--dry-run` shows the counts without writing. In a dark app, solid `bg-white` / `bg-black` are
   left for you (knobs, swatches, logo tiles are white on purpose).
7. **Phase 3 — Hand fixes** (`L…`), file by file, using the rule texts in the `Luật` section and
   `node_modules/@semi/ui/docs/QUICK_REF.md`. Pick an `@semi/ui` component or a semantic token; never re-add a physical
   colour, a local wrapper, a `skip` for a whole folder or a higher baseline. An illustration or a data palette (device
   drawing, 3D scene colours, a partner's logo) is content: name that file under `skip` with a reason
   (`"skip": { "literal-colour-value": { "<file>": "illustration: …" } }`), and the audit lists it.
8. **Phase 4 — Structure**, per the decisions: `AppShell` + `MobileTabBar` (or `AppHeader` for a tool app),
   `PageTitle` + `SubpageToolbar`, `Table` / Bento `Card` grids, `KpiCard`, `Modal`, `Field` + `Input`, …
   (`node_modules/@semi/ui/components.json` lists every export with props). A need `@semi/ui` cannot express →
   `/semi-propose` and a `// TODO(semi#<issue>)` workaround, not a new primitive.
   Then **review the key screens against `DESIGN_SYSTEM.md` §19** (the generic AI look; a person's judgement, so
   `semi-check.md` cannot list it): four equal KPI cards where one number matters most, a decorative icon colour per
   card, a hero with three icon feature cards, an icon before every label, sample text unrelated to the product, every
   block a card with the same padding. Show the user what you found per screen (a line each, with a screenshot when a
   browser is available), propose the change (`KpiCard featured`, neutral icons, a real number or a quote as proof,
   text from `semi_brand` brief / voice) and apply only what they accept.
   Walk the same screens through the **screen review** of `DESIGN_SYSTEM.md` §19b, the questions no tool answers:
   above all the states (loading, empty and "no result", error with retry, partial, no permission, too much data:
   open each one by URL, a slow network or a filter that matches nothing), the platform conventions (Escape, Enter,
   back, a confirmed or undoable destructive action, a form that keeps its input after an error) and the brand's
   voice. Report a line per screen and missing state, and fix with the user's yes (`Skeleton*`, `EmptyState`,
   `Alert` with a retry, `confirmDialog`, `toast` with an action).
9. **Phase 5 — Density** (§4c of `DESIGN_SYSTEM.md`): lint reads code a line at a time and cannot see a screen that
   is cramped or cluttered, so this phase measures the rendered pages. Start the app's dev server and list its key
   routes (the shell's nav items, a detail page, a form, a dialog you can open by URL), then:
   ```bash
   node "<path-to-this-skill>/scripts/vendor/density.mjs" <url> [<url> …] [--theme dark|light]
   ```
   It checks each page at 1280px and 375px and prints every hit with its rule, the measured value, the element's
   text and class (search the source for them) and the budget. Without Playwright in the app (exit 2), open each page
   in the browser tool and evaluate the output of `node "<path-to-this-skill>/scripts/vendor/density.mjs" --snippet`
   (it returns the hits as JSON). Keep the hits in your report, not in `semi-check.md` (`--verify` rewrites that from
   the static audit). Show the user a line per page (a screenshot when it helps), then fix them with the user's yes: a Semi component over hand-made rows
   (`Item`, `Menu`, `DataTable`), the spacing roles (`p-card`, `gap-stack`, `gap-group`), a frame removed rather than
   padded, secondary buttons beside the one primary. `data-density-view` goes only on a frame that stands for a whole
   screen (a preview), `data-density-skip="<reason>"` only on a specimen; never to silence a hit on an app screen.
   Measure again until every page is clean, and in both themes when the app has both.
10. **Phase 6 — Accessibility** (§18 of `DESIGN_SYSTEM.md`): Semi's components pass WCAG 2.2 AA on their own, but a
   screen made of them can still fail (muted text on a tinted card, an icon button without a name, a field whose edge
   disappears on a grey panel, a hand-made control with no focus ring or a 16px hit area). On the same routes:
   ```bash
   node "<path-to-this-skill>/scripts/vendor/a11y.mjs" <url> [<url> …]
   ```
   It checks each page in dark and light at 1280px and 375px: `contrast`, `edge`, `name`, `focus-ring`,
   `target-size`, `img-alt`, `lang`, `zoom-lock`, plus axe-core's serious WCAG findings (`axe/<id>`) when the app has
   `axe-core` installed (it says so when not; propose `npm i -D axe-core`). Without Playwright (exit 2), evaluate the
   output of `--snippet` in the browser tool, once per theme. Keep the hits in the report, show a line per page, and
   fix them with the user's yes: the themed text tokens (`text-muted`, `text-*-fg`, `text-on-primary`) instead of
   fixed shades, `border-control-line` on a field, `Field` or `aria-label` for a name, `FOCUS_RING` on a custom
   control, `HIT_AREA` (from `@semi/ui/styles`) on a control drawn smaller than 24px, or the Semi component that
   already does all of it. `data-a11y-skip="<reason>"` only on a specimen (a contrast sample), never to silence an
   app screen. Measure again until every page is clean.
11. **Verify** after each phase (and each module):
   ```bash
   node "<path-to-this-skill>/scripts/fix.mjs" --cwd "<audited-dir>" --verify
   ```
   It audits again, rewrites `semi-check.md` with what is left (deletes it when nothing is), and runs the app's own
   `semi-lint` and `tsc`; exit 1 while anything is left. Then run the build, and `npx semi-lint --update-baseline` so
   the baseline shrinks (it never grows: new hits are fixed, not recorded; only `/semi-sync` records a new rule's
   debt with `--accept-new`). The foundation phase also wires the gate outside Claude Code: `semi-lint` in the `lint`
   script and `.github/workflows/semi.yml` (`semi-lint --ci` + `tsc`). Check changed screens in both themes when a browser is available.
12. **Report** in a few lines: issues before → after per phase (density and accessibility: hits per page before → after), what was kept (and why), what is left, and whether
   `semi-check.md` was deleted. Do not commit unless the user asks.


## Phases (in semi-check.md, fixed in this order)

| Phase | Issues | How it is fixed |
|---|---|---|
| 1. Nền móng (`F…`) | `@semi/ui` not installed, `transpilePackages`, Semi CSS, `semi-lint.json`, layout providers, brand kit not installed / not wired (`brand`), a style / palette left from before 1.0 (`legacy-look`), fonts not loaded (`fonts`), Tailwind v3 | `fix.mjs foundation` (installs, keeps Next / Tailwind) + the layout by hand, screenshots before / after |
| 2. Token | colour / size / radius classes the codemod maps safely (`rounded-lg` → `rounded-control`, `shadow-sm` → `shadow-card`) | `fix.mjs tokens [--only dir] [--dry-run] [--theme dark\|light]` |
| 3. Sửa tay (`L…`) | lint hits no codemod can fix safely | edits by hand |
| 4. Cấu trúc (`D…`) | AppShell / AppHeader frame, local wrappers, list pages without `SubpageToolbar`, tables, components that duplicate `@semi/ui`, other UI libraries | asks: fix, or keep (`semi-lint.json` `keep`) |
| 4b. Không "AI" + review | the generic AI screen (`DESIGN_SYSTEM.md` §19; `decorative-icon-tones` is the only part lint finds, in phase 3) and the screen review (§19b: missing loading / empty / error / no-permission states, platform conventions, brand voice) | reviewed by eye on the key screens, proposed, applied with the user's yes |
| 5. Mật độ | the density budgets of §4c on the rendered pages: text against a box's edge, rows shorter than a control, frames four deep, five text sizes or four colours in a box, two filled buttons in a view, boxes closer than 8px, double lines | `scripts/vendor/density.mjs <url…>` (or `--snippet` in a browser tool), fixed by hand with the user's yes |
| 6. Tiếp cận (a11y) | WCAG 2.2 AA on the rendered pages, both themes: text contrast, field edges, control names, focus rings, 24px targets, field text 16px on phones, image alt, lang, zoom (+ axe-core when installed) | `scripts/vendor/a11y.mjs <url…>` (or `--snippet` in a browser tool), fixed by hand with the user's yes |

Checks the team chose to keep are listed in `semi-lint.json` (`"keep": { "tables": "reason" }`, or an array of path
prefixes) and only appear as one "Giữ nguyên" line.

Options: `--no-write` (summary only), `--ci` (summary only, exit 1 while issues are left: a periodic check in the
app's CI), `--json` (full machine-readable report), `--inventory <file>` (per-module token coverage).

## Why the file is deleted when clean

`semi-check.md` always mirrors the latest audit: `--verify` rewrites it with the remaining issues and deletes it when
there are none, so an old file never sends the next run after problems that are already fixed.
