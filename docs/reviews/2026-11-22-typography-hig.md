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

---

# Part 2. Phone layout (scope added by the owner)

Question: why do phone screens agents build in the apps look messy, and what should Semi enforce?

## 8. What the rules say today

| Topic | Today (DESIGN_SYSTEM.md, skills) | Gap |
|---|---|---|
| "Phone first" (§1) | no horizontal page scroll at 375, touch targets ≥ 36px (44 for nav) | a floor, not a layout: nothing says how a screen is built |
| Page structure | `PageTitle` then `SubpageToolbar` (pill filters left, icon CTA right), sticky below the safe area; a title row variant (§4a) | no phone variant: the same row wraps (ds#57) |
| Spacing | `px-4 sm:px-6`, `gap-group` 16, `p-card` 16, density budgets (`tight-box`, `tight-row`) | budgets catch tightness, not *too many rows of chrome* |
| Columns | grids use `sm:grid-cols-…`; "single column" only implied | no rule: one column + full-width cards on phones |
| List vs table | `Table` "scrolls sideways on phones"; `DataTable` has no phone mode (ds#25) | wide tables are the default phone result |
| Detail, back | none; `Drawer` has a bottom side; modals are "full screen on phones" | no push-detail + Back pattern (ds#59), no sheet detents or grabber |
| Sticky actions, safe area | `STICKY_TOOLBAR`, tab bar and Drawer use `env(safe-area-*)` | no sticky bottom action bar; forms have no submit-bar rule |
| Forms | `Field` stacks label above input; fields 16px (v0.33.0) | no `inputMode` / `enterKeyHint` / `autoComplete` rule (only `NumberInput` sets `inputMode`) |
| Empty / loading | `EMPTY` card, skeleton (§13, §13b) | fine on phones, but the empty card can fill the screen (see studio) |
| Checks | `semi density` and `semi a11y` at 375 (budgets, 24px targets, 16px fields) | no check for toolbar rows, table width, duplicate title, bar overlap (ds#60) |
| Skills | `semi-ui` and AGENTS rules say "check at phone width"; `semi-check` runs the two tools | agents are told to *look*, never *what good looks like* |

## 9. Real screens at 375×812 (read-only, dev servers)

Reached: **sales-hub** (3300: Inbox, Customers, Settings), **3dnoobs-studio** (3140: dashboard, Slicer), **project-manager** (3011: start
screen), **data-hub** (3190: login only, needs a session). **Down, skipped:** sme-hub (3200), feedback-hub (33000). I did not log in or change data.
Sales-hub shows real customer names and mail, so its screenshots are **not committed**; studio's are
(`assets/app-studio-dashboard-375.png`, `app-studio-slicer-375.png`).

Recurring problems:
1. **Toolbar becomes 3–4 rows of chrome before content** (sales-hub Customers): three filter selects on two rows, then a row with
   two text buttons plus the primary "+", then a lone search icon on a fourth row, then a summary line. About 190px of 812 before the first record.
2. **Header cramped / split** (Inbox): the page title shares a row with a select, then three icon buttons wrap to a second row;
   the card inside repeats the same title ("Hộp thư đến") the select already shows: **duplicate title**.
3. **Tab rows clip** (sales-hub Settings): five section tabs run off the edge with no affordance; options styled as bare text with no boundary.
4. **Bottom tab bar overload** (studio): six tabs with truncated labels ("Dashboa…", "Filament …", "Periphe…", "Automatio…"); sales-hub has four and reads fine.
5. **Tables on a phone:** Customers shows one data column plus a checkbox column; the rest is off-screen, the selection checkbox costs 40px for a rarely used action.
6. **Marketing inside a tool** (studio Slicer): a large upload card and three feature cards, no title or back in the top bar (only an AI icon), actions hidden below the fold.
7. **Empty states too large** (studio dashboard): "No prints in this period" sits in a ~150px blank block, and a dashed empty card follows; the first screen shows zero data.
8. **Popover covers the action** (project-manager): the folder suggestions open on load and cover the helper text and the primary button.
9. **Inconsistent paddings:** nested cards (page panel › card › tile) give about 32px of side margin on each side, so content is ~310px wide in a 375 screen (studio dashboard).
10. **Tile row scrolls sideways** (studio quick tiles) with no hint, the cut-off tile reads as a bug.

## 10. Apple HIG, iPhone (current pages)

Sources: [layout](https://developer.apple.com/design/human-interface-guidelines/layout), [toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars),
[tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), [sheets](https://developer.apple.com/design/human-interface-guidelines/sheets),
[lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables), [text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields),
[entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data), [buttons](https://developer.apple.com/design/human-interface-guidelines/buttons).
The navigation-bars and forms pages returned 404 (their rules are folded into toolbars and entering-data). HIG gives **no iPhone margin, row-height or safe-area numbers**;
those below are Apple's *rules*, numbers only where the page has one.

- **Margins / safe area:** respect safe areas and the Dynamic Island; limit text width for readability; stack views vertically and let rows grow when text is larger.
- **Navigation / toolbar:** large title that becomes standard on scroll; standard Back (no "Back" text); keep titles under 15 characters; **one primary action, trailing**; overflow goes to a More menu; about three groups of items.
- **Tab bar:** fewer tabs, single-word labels, never hide or disable a tab, avoid an overflow tab, badges only for critical info; stays visible across sections.
- **Sheets:** detents medium (about half) and large; **grabber** on resizable sheets; swipe to dismiss (confirm when unsaved); Cancel leading, Done trailing; one sheet at a time; full-screen for long flows.
- **Lists:** disclosure chevron to drill in; succinct text; selection only in an edit mode.
- **Forms:** a real label (placeholder is only a hint); fields stacked vertically; keyboard type fits the content; prefill, pickers over typing; validate as you go; **hit target ≥ 44×44pt**; one or two prominent buttons per view; spinner inside a button for slow actions.
- **Empty / loading:** no HIG page; closest is "don't hide tabs, explain why a section is empty".

Semi differs: filters/CTA in a wrapping row instead of a nav bar with one trailing action and a More menu; tables instead of disclosure lists; no sheet grabber/detents; 34px controls.

## 11. Proposed phone layout rules (below `sm`, 375 is the test width)

Each rule says what provides it and what could check it (`D` = `semi density`, `A` = `semi a11y`, `L` = `semi-lint`, `S` = `semi-ui` skill).

| # | Rule | Provided by | Check |
|---|---|---|---|
| P1 | **Chrome budget:** title + toolbar + filters ≤ 2 rows, ≤ 25% of viewport height (≈200px) before first content; a 3rd row means filters move into a sheet | `SubpageToolbar` phone mode: filters → "Lọc" button opening a bottom `Drawer` with active filters as removable chips; secondary actions → "⋯" menu (ds#57) | D `toolbar-rows` (count distinct rows of controls above the first content block; ds#60) |
| P2 | **One primary action, trailing/bottom:** one filled accent button per view; on phones a primary create action is a round icon button in the toolbar or a sticky bottom bar, never a text button row | `SubpageToolbar` `primary`, new `StickyActionBar` | D `primary-actions` (exists) |
| P3 | **Tables become lists:** a table wider than the viewport is a stacked list (title line, 1–2 meta lines, status badge, chevron) below `sm`; never more than 2 data columns beside a checkbox | `DataTable` `phone="list"` (default for ≥ 3 columns), `Item`/`ItemGroup` (ds#25) | D `phone-table` (a `table` whose scrollWidth > clientWidth + 8px at 375) |
| P4 | **Selection is a mode:** row checkboxes appear after "Chọn" (Apple's edit mode), not as a permanent 40px column | `DataTable` `selectable="mode"` | A/D count checkbox columns at 375 |
| P5 | **Detail = push with Back:** opening a record navigates to a detail page with a Back button, title ≤ 15 chars short form, one primary + "⋯" overflow; no master-detail split on phones | new `DetailView` / `PageTitle back` (ds#59) | L `detail-no-back` (a route with `[id]` and no `back`) |
| P6 | **Sheets:** pickers, filters, row actions and small forms are bottom sheets with grabber, Cancel/Done, medium and large detents; long or multi-step flows are a full-screen `Modal` | `Drawer side="bottom"` gains `detents`, `grabber`; `Modal` stays full screen | L `custom-overlay` (exists) |
| P7 | **Navigation:** ≤ 5 tabs, labels one word ≤ 10 chars, no truncation; the rest go in "Menu"; no sub-items on phones (§4a) | `MobileTabBar`/`AppShell` (cap and warn at 6) | A `tabbar-labels` (label scrollWidth > clientWidth) |
| P8 | **No titled duplicates:** one `h1` per screen; a card/section title may not repeat the `h1` or the selected filter label | `PageTitle`, `Card` | D `duplicate-heading` (ds#60) |
| P9 | **Margins and nesting:** page gutter 16, at most one framed box inside the page panel on phones (use dividers, not nested cards); content width ≥ 343px | `Card` flat variant `max-sm`, `AppShell` content container | D `box-nesting` (exists, make it 2 at 375), `narrow-content` |
| P10 | **Single column:** grids are one column below `sm` (two only for tiles ≤ 4 short items); no horizontal-scroll rows without a visible partial next item and `scroll-snap` | `grid` examples, `ScrollRow` (new, or `Carousel`) | D `clipped-row` |
| P11 | **Forms:** label above field; ≤ 1 field per row; `inputMode`/`autoComplete`/`enterKeyHint` set by field `kind` (email, tel, number, url, search); submit in a sticky bottom bar above the keyboard with `h-11`; validate on blur | `Field` `kind`, `FormActions` (new sticky bar), `NumberInput` | L `field-input-mode` (an `<Input>` named email/phone/amount without `kind`/`inputMode`), A `form-submit-visible` |
| P12 | **Targets:** controls ≥ 44px tall on phones, 8px apart (table/list rows ≥ 44) | style token `spacing-control` 44 below `sm`, `Button`, `Item` | A `target-size` raised to 44 at < 640 (today 24) |
| P13 | **States:** an empty state is ≤ 40% of the viewport, one icon, one sentence, one action; loading uses the same shape as the content (skeleton) | `EMPTY` `max-sm` compact, `Skeleton` | D `empty-height` |
| P14 | **Safe areas:** sticky bars and tab bar pad `env(safe-area-inset-bottom)`; content never sits under them (bottom padding = bar height) | `STICKY_TOOLBAR`, `MobileTabBar`, `StickyActionBar` | A `bar-overlap` (last element's bottom is above the fixed bar) |
| P15 | **Popovers and menus don't open on load or cover the primary action;** use sheets when taller than 40% of the viewport | `Popover`, `CustomCombobox` (sheet mode) | D `overlay-on-load` |

**Belongs in the `semi-ui` skill (agents follow it by default):** P1, P2, P3, P5, P6, P8, P9, P10, P11, P13, P15, plus a "phone screen recipe" (title → one toolbar row →
content as list/cards → one primary action) and a checklist "screenshot at 375: is the first record visible without scrolling?".
**Tool-only (skill just says "run it"):** P7, P12, P14. Fold into existing issues: P1 → ds#57, P3/P4 → ds#25, P5 → ds#59, new checks → ds#60.

## 12. Findings, ranked (layout)

1. **No phone page recipe.** Rules describe the desktop page and say "check at 375"; agents therefore stack desktop toolbars. (P1, recipe in skill)
2. **Toolbars eat the phone screen** (3–4 rows before data). Needs `SubpageToolbar` phone mode: sheet filters + overflow (ds#57).
3. **Tables as the phone default** (one column visible): list mode (ds#25).
4. **No detail/back pattern**, so master-detail is hand-built, differently in each app (ds#59).
5. **Tools cannot see these problems** (all budgets pass): add toolbar-rows, phone-table, duplicate-heading, tab-label, overlap checks (ds#60).
6. **Tab bar overload and tile rows** (studio): cap and warn.
7. **Forms:** no keyboard-type rule, no submit bar.
8. **Empty states too tall; marketing cards inside tools** (studio): size cap, skill hint.

## 13. Open questions (layout)

1. Phone tables: list by default for ≥ 3 columns, or keep horizontal scroll as the default and make lists opt-in?
2. Primary action: sticky bottom bar, or a trailing toolbar icon (Apple)? One rule for all six apps.
3. Is a 44px control height acceptable for the dense apps (data-hub, 3dnoobs-studio) on phones?
4. Ship P1/P3/P5 as new components in a minor, or together with the type-scale major (Part 1) as one "phone-first" 1.0?
5. sme-hub and feedback-hub dev servers were down: should I review them when up? Should app screenshots (real data) stay out of the repo, as here?
6. Do the apps have an iPad layout target, or is "tablet" just desktop with touch?
