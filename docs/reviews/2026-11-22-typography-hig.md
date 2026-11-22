# Typography on phones: Semi vs Apple HIG (review, 2026-11-22)

Review and proposal only: no token or component changed. Measured on `main` (v0.33.0, Flat style, regular density)
with `next dev`, Chrome 375×812 (touch) and 1280×800, light and dark. Proposed values were **injected as CSS variables**
in the browser, never committed. Apple source: [HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
(built-in text styles, Large default Dynamic Type; iOS default 17 / min 11, macOS default 13 / min 10).

## 1. Today

Tokens (`tokens/tokens.css`, rem, line height 1.5 up to 16px, 1.25 from 18px): `caption` 11 · `label` 12 · `ui` 14
(13 compact) · `ui-lg` 15 · `title` 15 · `title-lg` 16 · `figure` 18 · `heading-sm` 20 · `heading` 22 · `heading-lg` 24 · `display` 26.
Only fields change by viewport (16px below `sm`, v0.33.0). Everything else is one scale on every device.

Computed font sizes (px) on the rendered docs and example pages (17 pages; count = elements):

| Role | Token used | 375 | 1280 |
|---|---|---|---|
| Table header and cell (`Table`, `DataTable`) | `label` | 12 (648) | 12 (648) |
| Button, tab, nav link, field label | `label` | 12 | 12 |
| Badge / chip / count | `caption` (some `label`) | 11–12 | 11–12 |
| Input, Select/Combobox, SearchInput | `ui` → 16 below `sm` | 16 | 14 |
| Card title, section title | `ui`–`title` | 14–15 | 14–15 |
| Running text (`p`, description) | `label` / `ui` / `ui-lg` | 12–15 | 12–15 |
| Item, Toast, Chat bubble | `ui` + `label` + `caption` | 14 / 12 / 11 | same |
| Page title (`PageTitle`) | `heading` / `display` | 22 | 26 |

**Finding 0:** most of the product is 12px, below Apple's iOS Footnote (13) and far below Body (17). Tables, buttons and
tabs (every interactive label) are `text-label`. The dense default was tuned for desktop and carried to phones unchanged.

## 2. Apple HIG against Semi (px)

| Apple style (iOS / macOS) | iOS | macOS | Semi today | Gap on a phone |
|---|---:|---:|---|---|
| Large Title | 34 | 26 | `display` 26 | −8 |
| Title 1 | 28 | 22 | `heading-lg` 24 | −4 |
| Title 2 | 22 | 17 | `heading` 22 (page titles) | 0 |
| Title 3 | 20 | 15 | `heading-sm` 20 | 0 |
| Headline (semibold) | 17 | 13 | `title` 15 semibold | −2 |
| Body | 17 | 13 | `ui` 14 (fields 16) | −3 |
| Callout | 16 | 12 | `title-lg` 16 | 0 |
| Subhead | 15 | 11 | `ui-lg` 15 | 0 |
| Footnote | 13 | 10 | none (`label` 12) | −1 |
| Caption 1 / 2 | 12 / 11 | 10 / 10 | `label` 12 / `caption` 11 | 0 |

Titles are close to iOS. The gap is the **middle of the scale**: Body, Headline and the "interactive label" role
(buttons, tabs, table cells), which Semi puts at 12 where Apple's equivalents are 15–17. On desktop Semi is *above*
macOS (body 14 vs 13), so macOS is a floor, not a target. Apple also publishes no web scale: the iOS/macOS split maps
to phone/desktop, with a web-sized desktop body of 15.

## 3. Proposal: one scale, Apple roles, two steps

Apple role names, `rem`, steps at `sm` (640px). Line heights are Apple's leading ÷ size (phone) and about 1.3–1.45 (desktop).
Desktop keeps Apple's ratios (body 15; Title 3 ×1.18, Title 2 ×1.29, Title 1 ×1.65, Large ×2 rounded to whole px) with a **12px floor**
(Caption 1, Caption 2 and Footnote collapse to 12; hierarchy comes from weight and colour).

| Role (Apple) | Today | iOS pt/leading | **Phone** (<sm) | **Desktop** (≥sm) | New token |
|---|---|---|---|---|---|
| Large Title | `display` 26 | 34/41 | **34**/1.2 | **30**/1.2 | `display` |
| Title 1 | `heading-lg` 24 | 28/34 | **28**/1.2 | **24**/1.2 | `heading-lg` |
| Title 2 | `heading` 22 | 22/28 | **22**/1.25 | **20**/1.25 | `heading` (and `figure`) |
| Title 3 | `heading-sm` 20 | 20/25 | **20**/1.25 | **18**/1.25 | `heading-sm` |
| Headline (semibold) | `title` 15, `title-lg` 16 | 17/22 | **17**/1.3 | **15**/1.3 | `title` (= `ui` size) |
| Body | `ui` 14, `ui-lg` 15 | 17/22 | **17**/1.3 | **15**/1.45 | `ui` |
| Subhead | `ui-lg` 15 / `label` 12 | 15/20 | **15**/1.33 | **13**/1.4 | `label` |
| Footnote | `label` (meta) 12 | 13/18 | **13**/1.38 | **12**/1.4 | `meta` (new) |
| Caption 1/2 | `caption` 11 | 12/16, 11/13 | **12**/1.33 | **12**/1.33 | `caption` |
| Fields (Input, Select…) | 16 / 14 | 17 | **17** | **15** | `FIELD_INPUT` → `ui` |

Compact density keeps `ui` one step lower on desktop (14, today 13). `ui-lg` and `title-lg` become aliases of `ui`
(migration rewrites them); `text-kpi` stays deprecated. Prefer fewer tokens: nothing below 12px survives.

**Mapping of today's names:** `caption`→`caption` (11→12 phone and desktop) · `label`→`label` (12→15 / 13) ·
`ui`→`ui` (14→17 / 15) · `ui-lg`→`ui` · `title`→`title` (15→17 / 15) · `title-lg`→`title` · headings and `display` keep names.
Places that used `label` for *meta lines* (a time, a count beside a title) move to `meta` (13 / 12).

**Per component (what changes):**
- *Input, SearchInput, Select, Combobox, NumberInput, Textarea:* 17 phone / 15 desktop (`FIELD_INPUT`); drops the v0.33.0 `max-sm:text-title-lg` special case. `h-field` ≥ 44 on phones.
- *Button, Tabs, Pills, Chip, AppShell nav:* `label` 15 / 13; `Button` md `h-control` 34 → **44 on phones** (Apple touch target; `modal` size already does it).
- *Table / DataTable cells and headers:* `label` role (12 → 15 / 13); row height `h-control` becomes 44 phone. Dense data may opt into `meta` (13) with `data-density="compact"`.
- *Badge:* `caption` 12 (was 11); *Toast, Alert, Item:* body `ui`, secondary `meta`; *Card:* title `title`, body `ui`; *Chat:* bubbles `ui`, timestamp `caption`.
- *PageTitle:* `heading` 22 → Title 1 **28** phone / `display` **30** desktop (was 22 / 26): the largest jump.

**`-apple-system-body` (iOS Dynamic Type in Safari):** worth supporting as an *opt-in*, not a base. `font: -apple-system-body`
follows the user's iOS Text Size setting, but only in Safari/WebKit, resolves to px (so it fights `rem` and zoom), and
cannot be mixed per role without a stylesheet fork. Using `rem` already honours browser font size and zoom (WCAG 1.4.4),
and iOS Safari's own page-zoom setting scales `rem`. Recommendation: ship `rem`; add an optional
`@supports (font: -apple-system-body)` block in `base.css` that sets `html { font-size: calc(-apple-system-body ÷ 17 × 100%) }`
(root only) so every `rem` token scales with Dynamic Type. Needs a real iPhone test (not done here, see Open questions).

## 4. Impact (proposed values injected, nothing committed)

Method: Playwright + Chrome, `densityAudit` and `a11yAudit` (`lint/`) on 17 docs/example pages at 375 and 1280, light
(dark on dashboard, list-page, data-table); *today* vs *proposed*; plus computed sizes and overflow counts.

| Check | Today | Proposed |
|---|---|---|
| `semi density` hits (all 8 budgets) | 0 | 0 |
| `semi a11y` hits (contrast, edge, field-size, targets, names) | 0 | 0 |
| Page horizontal overflow | 0 | 0 |
| Clipped (ellipsis) text, dashboard 375 | 0 | 2 |
| Computed table cell / button / tab, 375 | 12 | 15 |
| Computed input, 375 / 1280 | 16 / 14 | 17 / 15 |
| Computed h1, 375 / 1280 | 22 / 26 | 22 (docs title, not `PageTitle`) / 30 |

Zero hits is **weak evidence**: the budgets measure padding, nesting and colour, not fit, and docs previews are marked
`data-density-skip`/`-view` (I stripped the skip markers in the second run; still 0). The real cost is visible:
- **Toolbars and filter pills** (list-page 375): pills "Tất cả · Chờ xử lý · Đã thanh toán · Hoàn tiền" fit today and  overflow into a horizontal scroll at 15px; the toolbar needs wrap or an overflow menu.
- **Tables:** at 15px cells, the status column was already cut off at 375 (screenshots) and the 15px cells push it further right. Tables must scroll
  horizontally or collapse to a card list on phones; `DataTable` needs a `phone="cards"` mode (new work).
- **AppShell bottom nav:** 5 labels at 15px do not fit; the nav keeps `caption` (12) or icons-only labels.
- **Control heights:** 34px controls hold 15px text (line 20), but Apple's target is 44pt; 44 on phones adds ~10px per row
  and fewer rows per screen (density budget `tight-row` is derived from `h-control`, so it scales on its own).
- **Desktop:** only +1px (labels 13, body 15) and a 30px title: little crowding, the one real shift is the page title.

Screenshots (375 and 1280, today vs proposed), in `docs/reviews/assets/`:
`preview-list-page-375-today.png` / `-proposed.png` (toolbar, table), `preview-list-page-1280-*.png`,
`dashboard-375-light-*.png`, `dashboard-1280-light-*.png`, `field-375-light-*.png`.

## 5. Findings, ranked

1. **Interactive labels are the problem, not body text:** buttons, tabs, nav and table cells are 12px (`label`), under iOS Footnote (13) and Subhead (15). Fixing only fields (v0.33.0) leaves the rest small.
2. **Phones and desktop need two steps:** one scale cannot be both iOS (17 body) and a dense tool (15). The `sm` switch already exists for fields.
3. **Touch targets matter as much as size:** 44px controls on phones; 34px today.
4. **Tables and pill filters are the crowded cases** (section 4): need scroll/cards, not smaller text.
5. **Desktop barely moves** (+1px), so the risk is phone layouts, not desktop.
6. **Tooling is blind to fit:** density/a11y report 0 hits; add a phone overflow/clipping check before releasing.

## 6. Release and migration

**Major (v1.0.0 or 0.x breaking).** Every app changes visually, token names `ui-lg` / `title-lg` are removed, new `meta`,
and heights change (a layout change, not only a style one). Per AGENTS.md majors are the owner's call. A cheaper
interim, **minor**: ship only the phone step for `label`→13 and Button/field heights 44 behind `data-type-scale="apple"`
(opt-in per product, like `contrast`), then make it the default in the major.

Migration plan: (1) release migration `migrations/<ver>-type-scale.mjs` rewriting `text-ui-lg`/`text-title-lg`/meta
`text-label` and the `max-sm:text-title-lg` fields workaround; (2) release with `data-type-scale="apple"` opt-in;
(3) pilot **feedback-hub** (form-heavy; pick the pilot with the owner, I did not inspect the apps) and **sales-hub** (tables), check toolbars/tables at 375;
(4) then sme-hub, data-hub, project-manager; (5) **3dnoobs-studio** last (dense, 3D tools; keep `compact` density);
(6) flip the default in the major; each app runs `/semi-sync` then `/semi-check` at 375 and 1280.

## 7. Open questions for the owner

1. Body 17 on phones is Apple-faithful but large for tables and dashboards. Accept 17 everywhere, or 15–16 for data (cells, toolbars) and 17 only for reading and fields?
2. Major now, or opt-in `data-type-scale="apple"` first?
3. Desktop body 15 (proposed) or keep 14 for the dense tools (compact density)?
4. Controls 44px on phones for all six apps, including 3dnoobs-studio?
5. Support iOS Dynamic Type via `-apple-system-body` (needs an iPhone test), or `rem` only?
6. Want `DataTable` to switch to cards on phones (new component work), or horizontal scroll with a sticky first column?

**Not done:** real iPhone/Safari check, Vietnamese long-label wrapping beyond the sample pages, dark-theme screenshots (dark was audited on 3 pages only).
