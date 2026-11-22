# UI/UX consistency across Semi and six apps (review, 2026-11-22)

Review and proposal only: no component, token or app changed. Scope set by the owner: page layout on desktop, plus every
place where the same UI job is done in different ways, in Semi and in sme-hub, sales-hub, data-hub, feedback-hub,
project-manager and 3dnoobs-studio. Typography and phone layout are in PR #64 (`2026-11-22-typography-hig.md`, rules P1-P15);
this review reuses them and does not redo them. Desktop anatomy below is the wide form of the same page anatomy: the P-rules are its narrow form.

**Method and limits (read before trusting a number).**
- *Live, 1280×800, DOM measurements* (read-only dev servers): sales-hub (3300) and 3dnoobs-studio (3140), 4-5 screens each.
  data-hub (3190) stopped at a login wall and project-manager (3011) at its onboarding screen (every other route 404s without a scan,
  which changes state): **not compared live**. sme-hub (3200) and feedback-hub (33000) dev servers were **down**.
- *Source scans* (grep counts + excerpts, sibling subagents) of all six app repos and of Semi. Counts are grep line hits, so read them
  as orders of magnitude; file:line cites are approximate. Full scan notes: `side-session-notes/…/scan-A-sme-data.md`, `scan-B-others.md`, `scan-C-semi.md`
  (outside the repo).
- No screenshots are committed: sales-hub shows real customers, and the other pages were measured, not captured. Everything is described.
- Not covered: dark-mode parity per screen, motion, real keyboard-flow testing, sme-hub/feedback-hub/data-hub/project-manager rendered pages.

## 1. Summary

1. **There is no page anatomy, so every page invents one.** Two title layouts, three places for search, filters in `left`, pills, a sidebar or
   a separate row, the primary action icon-only in two apps and a text button in the other four (sme-hub: 193 text `<Button>`, 5 `onPrimaryAction`).
2. **Semi lacks the components that make the boring 80% identical**: a form kit (validation, Save/Cancel order, unsaved guard), `ErrorState` /
   `Forbidden` / `NotFound`, formatters (date, money), a status→tone map, a Modal/Drawer/page rule, a Vietnamese copy guide.
   Apps then write their own, differently (data-hub: 4 local status maps and 6 date formats; project-manager: hand-rolled dates; studio: its own toast store).
3. **Apps that follow Semi are visually clean** (sme-hub and data-hub: 0 raw `<button>`, no hex colours, no `dark:` pairs). The drift is in *behaviour
   and wording*, which no check sees. 3dnoobs-studio is the exception: 321 raw `<button>`, 0 `Field`, 0 `Alert`, 336 raw palette utilities, its own `semi-check.md` lists 648 open issues.
4. **None of the six apps has `error.tsx` / `not-found.tsx` / a 403 page that is shared;** none guards unsaved changes; sales-hub and studio route by state or query,
   so there are no deep links.
5. **Proposal:** one `Page` anatomy (title row → tab row → toolbar row → content → pagination) owned by one component, 8 more layout rules D1-D16,
   a Semi "boring defaults" kit (forms, states, format, status, copy), and a `semi-ui` skill recipe per page type. Section 5 lists the owner decisions with a recommendation each.

## 2. Findings, ranked by user impact

Owner: **C** = Semi component, **S** = `semi-ui` skill/docs, **L** = lint/check (`semi-lint`, `density`, `a11y`), **A** = app fix.
Evidence is `app:file:line` or a measured value.

| # | Finding | Where / evidence | Proposed rule (checkable?) | Owner |
|---|---|---|---|---|
| F1 | **Errors and wrong URLs land on the default Next page.** No `error.tsx`, `not-found.tsx` or global error in 4 of 6 apps scanned; sme-hub has a per-page `NoAccess` but no boundaries; data-hub no 403 UI. Retry exists only in `ChatError`/`FileDrop`. | scan A/B; Semi has no `ErrorState`, `Forbidden`, `NotFound` | **D17** shared `ErrorState` (message, cause, retry, keep loaded data), `Forbidden`, `NotFound`, boundary helpers; lint `missing-error-boundary` (app route group without `error.tsx`/`not-found.tsx`) | C, L, A |
| F2 | **Work is lost silently.** No unsaved-changes guard anywhere (grep finds none in Semi, sales-hub, feedback-hub, project-manager; sme-hub `product-form.tsx:587` "Huỷ" discards; data-hub drawers and the import wizard likewise; studio one `beforeunload`). | forms in every app | **D13** `useUnsavedGuard(dirty)` + confirmDialog "Bỏ thay đổi?"; lint `form-no-guard` (a page with `<Field>` inputs and no guard) | C, L |
| F3 | **Pages are not addressable.** sales-hub navigates by state (`go("mail")`, everything is `/`), studio by `?tab=`; no Back, no deep link, reload loses place. | sales-hub `page.tsx`; studio sidebar items are buttons | **D15** each page type is a route; sidebar items are links (`shell-nav-href` exists, extend to state navigation); lint `state-nav` | A, L |
| F4 | **Same status, different colour or wording.** data-hub *queued* is sky in `JobsView.tsx:18`, amber in `InboxViews.tsx:141`; 4 hand maps. sme-hub "active" has 4 wordings, `STATUS_LABEL` in 5 files. project-manager "Chưa chạy" vs "Sẵn sàng". Apps pass raw colours (`amber`, `rose`) to `Badge`. Semi has `Badge`, `STATUS_PILL` (unused class string) and `Chip` for the same job and no status map. | scans A/B/C | **D18** `StatusBadge` + `statusTone(status)` map (success/warning/danger/info/neutral, brand-overridable); `Badge tone` accepts semantic tones only for statuses; lint `ad-hoc-status-pill` | C, L |
| F5 | **Dates and money are formatted six ways.** data-hub ~6 date/number variants, USD through `vi-VN` (`ProvidersView.tsx:39`); sales-hub `usd()` in en-US inside a vi UI (`sales.ts:105`); sme-hub `lib/format.ts` (105 uses) with 2 bypasses (`nhat-ky/page.tsx:143`, `pos/command-bar.tsx:212`); project-manager dd/mm/yyyy by hand; studio duplicates `fmtDuration/formatHours/formatAgo` but has `localeTag()`. Semi exports only `formatFileSize`; `vi-VN` hard-coded in `Chart.tsx`. | | **D19** `@semi/ui/format`: `formatDate`, `formatDateTime`, `formatRelative`, `formatMoney(amount, currency)`, `formatNumber`, `formatDuration`, locale from `ThemeProvider`/`locale` context; lint `local-format` (`toLocaleString`, `Intl.NumberFormat`, hand `"₫"` in `src`/app) | C, L |
| F6 | **Primary action is icon-only in two apps and a text button in four,** against the written rule (§4: icon-only CTA). Live: studio and sales-hub always green icon-only (discoverable only by tooltip); sme-hub 193 text buttons, no icon-only primary; data-hub repeats the toolbar CTA inside `EmptyState`. The rule has no text counterpart and `Button` and the `BTN_*` strings both exist (§9 documents only the strings). | live + scans | **D2** (section 3) | C, S |
| F7 | **Two toast APIs, two form conventions.** studio wraps `toast` in its own `toastStore` (207 uses); feedback-hub: errors as `Alert`, success as `toast` (3); `Field error=` used 1× in sme-hub and 0× in data-hub, so errors arrive as a toast or a form-level `Alert` on submit; required marks mix `required` with "(không bắt buộc)". Semi has no form-level kit. | | **D13** form kit: validation on blur then on change, `Field error`, error summary `Alert` above Save, required = `*` + `aria-required`, optional fields say nothing; lint `toast-for-validation`, `local-toast` | C, S, L |
| F8 | **Save/Cancel order and verbs vary.** sme-hub product form Lưu→Huỷ (`product-form.tsx:583`) but modals Huỷ→Lưu (`supplier-modal.tsx:80`); studio Delete on the left, Cancel then Save; save labels "Lưu / Lưu nguồn / Lưu hạn mức / Tạo API key". | | **D13** `FormActions`: Huỷ (ghost) left of Lưu (primary), right-aligned, destructive left-aligned and separated; verb is always the generic "Lưu"/"Tạo"; lint `action-order` | C, L |
| F9 | **Create/edit lives in Modal, Drawer or a page, per entity.** sme-hub supplier and price list Modal, product a page; data-hub company Drawer, dictionary Modal, API key Drawer; feedback-hub 3 Modals for decisions. No rule in Semi. | | **D12/D13** (section 3): ≤4 short fields → `Modal`; ≤1 screen of fields or a record in context → `Drawer` (right); a record with sections, tabs or relations → page with Back; a confirmation → `confirmDialog` | S, L |
| F10 | **Confirm vs undo vs type-to-confirm** is not defined: `confirmDialog` default label "Đồng ý" (not the action verb); `ActionConfirmation` only for AI; toast `action` undo exists. 17-18 `confirmDialog` calls per hub are fine, studio has 1 `window.confirm` and 1 `alert()`. | scan C/B | **D20**: reversible → do + toast with Hoàn tác; irreversible → `confirmDialog` with `confirmLabel` = the verb (required when `tone="danger"`); permanent + bulk → type the name; lint `native-dialog` exists, add `confirm-label` | C, S, L |
| F11 | **Copy: no Vietnamese guide.** "Thêm cửa hàng" and "Tạo cửa hàng" on one page; Thêm (19) vs Tạo (13) in Semi's own examples; "Chưa … được" (15) vs "Không … được" (5); empty titles "Chưa có / Không có / Không thấy / Không tìm thấy"; "Tải thêm" vs "Xem thêm"; Huỷ/Hủy and Xoá/Xóa mixed in studio's catalog; "…" 47× vs "..." 15× (studio); English leftovers ("Secret", "Tenant", "Signing secret", "Scripts" beside "Module con"); developer text shown to users (data-hub `.env`, `docs/DEPLOY.md`, `JobsView.tsx:245`); sentence-ending periods in EmptyState titles. | | **D21** copy guide in `docs/COPY.md` + brand voice: Thêm = add an existing thing to a list, Tạo = make a new record (pick one per brand), Huỷ/Xoá (decided), "…" only, sentence case, no period in titles, failures "Không thể …", empty "Chưa có …" vs no result "Không tìm thấy …", units after number; lint `vn-copy-variants` (Hủy/Xóa, "..."), `ellipsis` | S, L |
| F12 | **Tabs, pills, toggle and segmented control are used interchangeably.** project-manager uses four view-switch idioms; sales-hub settings has an h1 plus a separate 7-tab row (36px) while studio puts page-title tabs *in* the h1 slot; Semi has `Tabs`, `PageTabsTitle`, `Pills`, `ToggleGroup`, `Chip` with overlapping "when". | live + scans | **D4** | S, L |
| F13 | **Tables are wider than the page.** Live: sales-hub customers table 1103px in a 996px content area; wide tables also at 1280. Bulk bar above the table in `DataTable`, pagination not seen in any live app (no app uses `<Pagination>` except project-manager and studio; `DataTable pageSize` in 12 files). | live | **D7, D8**; P3 covers phones | C |
| F14 | **Search behaves differently:** icon-only search at the right end (studio, sales-hub), plus a second 164px text-like search button in sales-hub; raw search inputs in 3+2+5+6 files of sme/pm/data/studio; 4 hand-rolled 300 ms debounces in data-hub (sme-hub has `useDebounced`). `SearchInput` has no debounce or shortcut. | live + scans | **D5** | C, S |
| F15 | **Studio has not adopted Semi** (321 raw `<button>`, 71 hand-made empty divs, 9 hand-built dialogs, 336 raw palette utilities, status chosen by label text `PrinterDetailModal.tsx:506`). Cause is not the rules, it is migration cost; but until done, every cross-app rule above is false there. | scan B | App migration plan with `/semi-check`; owner decision | A |
| F16 | **Spacing differs and is not owned.** Live: the shared shell gives gutter 24, top 32, title→toolbar 28 (studio) but title→table 70 (sales-hub, filters share the title row); settings content starts 293px down (sales-hub: title, 36px tabs, pill group); studio dashboard cards ≈188×88 at y=95. Radius, gutter and gap come from tokens but the *composition* is per page. | live | **D9** `Page` component owns the rhythm; density `page-rhythm` | C, L |
| F17 | **Semi docs contradict components.** `Button` icon w-3.5 vs §15 w-4; EMPTY icon square w-12 (§13), w-9 (component), w-6 (§15); `Modal` `ghost` silently becomes secondary; infinite scroll described in §4 but no hook exists; toast queue caps at 4 silently. | scan C | Fix doc or component; `check:manifest` could diff documented sizes | C, S |
| F18 | **Motion has no tokens or check:** two easing tokens, no durations; `animate-pulse` and `active:scale` not guarded by `prefers-reduced-motion`. | scan C | **D22** duration tokens + `reduced-motion` a11y check | C, L |
| F19 | **Navigation depth:** sme-hub has 22 `Breadcrumb` uses and role-based nav; data-hub no breadcrumbs, no nav groups; no back convention anywhere; no `settings-page` layout beyond the doc block (settings = tabs in sales-hub, flat in studio). | | **D10, D12** (and P5 on phones) | C, S |
| F20 | **Loading:** sme-hub has 0 `loading.tsx`, data-hub only the admin group; spinners vs skeleton vs "Đang tải" text mixed; `loading-text` lint exists. | scans | **D23** every route group has `loading.tsx` using `PageSkeleton`; lint `missing-loading` | A, L |
| F21 | Pagination wording and mechanism: "Tải thêm" vs "Xem thêm" (data-hub), `pageSize=0` queue (feedback-hub), no infinite-scroll hook. | | **D8** | C |
| F22 | **Visual leftovers in apps that follow Semi:** 91× `min-h-[48px]` in sme-hub; raw colour names to `Badge`; nested cards (P9). Minor, check by `density`. | scan A | existing rules | A |

Things that are good and should stay: Semi-only components in sme-hub/data-hub/sales-hub, `confirmDialog` and no native dialogs there, central status maps in sales-hub (`lib/sales.ts`) and feedback-hub (`lib/format.ts`), studio's i18n (20 message files, `localeTag()`, money as a message), consistent Huỷ/Xoá in the three vi-only apps, Cancel before Save in almost every modal.

## 3. Desktop page layout (the owner's original question)

### 3.1 What the rules say today and where they leave a choice

| Topic | Rule today (DESIGN_SYSTEM §4/§4a, examples) | Choice left open |
|---|---|---|
| Title | `PageTitle` text only, display type | **Two layouts, "pick one per page":** title on its own row + `SubpageToolbar`, or `SubpageToolbar title="…"` (title shares the row) |
| Tabs | `PageTabsTitle` (2-4 sibling pages, replaces the title), `Tabs` (in card/panel), `Pills` (filter) | sibling views of one page can be any of the three; `ToggleGroup` for modes |
| Filters | `left` slot of the toolbar (pills, selects); "filter sidebar beside long results" | pills vs selects vs sidebar vs separate row; no cap on count |
| Search | `searchValue` prop → icon-only search, right end | no rule for a visible field; `DataTable search` prop is separate state |
| Sort / view switch | none (table headers sort) | no slot; `ToggleGroup` free-floating |
| Primary action | icon-only `BTN_PRIMARY`+`BTN_ICON`, right end, `primaryActionLabel` required | text `Button` is also valid everywhere else (§9) |
| Secondary actions | "text buttons stay in the toolbar's `right` slot" | how many; text vs icon; where "⋯" goes |
| Bulk actions | `DataTable bulkActions` renders a bar above the table | not in the toolbar, not sticky |
| Pagination | `DataTable pageSize`; `Pagination` component; "long lists load the next page near the end" | table vs feed not distinguished |
| Gaps | `gap-group` 16, `gap-section` 24, `mb-5/mb-6` hard-coded inside `SubpageToolbar` | page rhythm lives in each page's `space-y-*` |
| Detail / settings / form | none (only P5 for phones) | everything |
| `semi-ui` skill | "start from a block (`semi add dashboard`)", keep budgets, check at phone width | no recipe per page type; blocks in `examples/` exist for list, dashboard, settings only |

`SubpageToolbar` itself forces the inconsistency: the `title` prop turns the same component into a different layout, `left` is an untyped slot (anything
goes), `right` accepts anything (text buttons, selects), and the primary action is a prop that apps skip by writing a `Button` in `right`.

### 3.2 Measured comparison (1280×800, live: studio and sales-hub; others from source)

| Page type | Item | 3dnoobs-studio | sales-hub | sme-hub (source) | data-hub (source) | project-manager / feedback-hub |
|---|---|---|---|---|---|---|
| all | gutter / top / content max | 24 / 32 / 1440 (shared shell) | 24 / 32 / 1440 (same shell) | `PageTitle` 21 files, `SubpageToolbar` 8 | `PageTitle` 11, toolbar 1 | pm: 26px h1 centred onboarding, no shell; fh: toolbar 4 files |
| list | title | h1 26px x249 | h1 26px x249, shares the row | `PageTitle` row (5 a-layout, 1 b) | `PageTitle` | pm: title-in-toolbar 3 |
| list | filters | left of toolbar row y=110 (2 selects) | 3 selects **in the title row** (x≈411-716) | pills 8, selects 38 | selects 25, pills 5 | |
| list | search | icon button, right end, expands | icon right end **+** 164px search-like button x=883 | raw/`SearchInput` 3 | `SearchInput` 5 + 4 debounces | |
| list | primary action | icon-only green, x=1129 | icon-only green, x=1170 | **text** `Button` | **text** `Button`, also in `EmptyState` | |
| list | secondary | refresh icon x=1213 | text "Nhập file", refresh/search icons | text | text | |
| list | bulk | none | row checkboxes (table 1103 px > 996 px content) | 15 `DataTable` | 12 `DataTable` | |
| list | pagination | none seen | none seen | `pageSize` | "Tải thêm"/"Xem thêm" mix | fh queue `pageSize=0` |
| list | rows above content | 2 (title, toolbar) | 1 (everything in title row) | 2 | 2 | |
| list | title→content | 28 to toolbar | ≈70 to table | | | |
| detail | pattern | tab strip replaces h1; pill row; card | **master/detail split pane** (list 415px + pane) | `Breadcrumb` 22 uses, page | drawer/modal, no breadcrumb | fh: 3 Modals for decisions |
| dashboard | title | greeting as h1 (26px) | none (opens on inbox) | `KpiCard`-style page (21 `PageTitle`) | | |
| dashboard | controls | segmented 7/30/90 days left-inside section, "Edit widgets" icon top right | - | | | |
| settings | layout | none found | h1 + **7-tab row** (36px, count badges, y=107) + pills; content y=293 | `cai-dat/*` pages, flat, "Thêm/Tạo cửa hàng" | `KeysView` drawers | pm: onboarding card, no shell |
| settings | save | - | per modal "Lưu nguồn / Lưu kết nối" | Lưu→Huỷ page, Huỷ→Lưu modal | Huỷ→Lưu | no dirty guard |

Observations: (1) the shared shell is already identical (padding, 1440 cap, sticky action cluster `sticky top-0`), so the drift is *inside* the content area;
(2) the toolbar is one row in sales-hub and two rows in studio for the same controls; (3) the primary action is always in the same place (right) but not in
the same form; (4) there is no sort, view switch or pagination seen in any live app, so those slots are not exercised.

### 3.3 References (pattern names only, nothing copied)

- Apple HIG for macOS/iPadOS: *toolbars* (title leading, search trailing and always reachable, primary item trailing, a few groups, overflow to "More"), *sidebars* and
  *split views* (selection drives the detail; sidebar width resizable; no more than 2-3 levels), *search* (a field in the toolbar, results update as you type, scopes under it).
  iPadOS is "desktop with touch": 44pt targets stay, so the desktop anatomy keeps the same slot order, only denser.
- Linear / GitHub / Stripe: a stable header (title, count, one primary), a filter bar with **applied filters as chips** below it, a trailing display/sort control, a bulk bar that
  replaces the filter bar on selection, URLs for every view and filter. These are the dense-tool pattern that D-rules follow.

### 3.4 Proposed page anatomy (D-rules)

One component, `Page` (or `PageShell`), owns the slots; pages only fill them. Sticky region = title row + tab row + toolbar row (below the safe area on phones).

```
LIST                                   DETAIL
┌ Breadcrumb / Back (optional) ──────┐ ┌ Back · Breadcrumb ─────────────────┐
│ Title (h1) · count        [Primary]│ │ Title  [status badge]  [Primary] ⋯│
│ [tabs: PageTabsTitle|Tabs]  (opt.) │ │ [tabs: sections of this record]    │
│ 🔍 Search  [Filter][Filter] [+Lọc]  │ │ ┌ main (flex) ─────┐ ┌ aside 320 ┐ │
│                  Sort  View  ⟳  ⋯  │ │ │ Cards, gap-group │ │ meta, rel.│ │
│ (applied filter chips)             │ │ └──────────────────┘ └───────────┘ │
│ ── bulk bar replaces row when sel. │ └────────────────────────────────────┘
│ content: DataTable / Item list     │
│ ─ count · Pagination (right) ──────│ DASHBOARD
└────────────────────────────────────┘ ┌ Title            [period seg.] ⋯ ──┐
SETTINGS                               │ KpiCard row (≤4, first featured)   │
┌ Title                    ──────────┐ │ sections gap-section: Card grids   │
│ ┌ section nav ┐ ┌ section Card ───┐ │ └────────────────────────────────────┘
│ │ (>5 → left) │ │ Field rows      │ │ FORM (page)            EMPTY
│ └─────────────┘ │ ─ Huỷ  [Lưu] ───│ │ ┌ Back · Title ───────┐ ┌ title row (kept) ┐
│                 └─────────────────┘ │ │ max-w-2xl sections  │ │ toolbar (kept)   │
└────────────────────────────────────┘ │ sticky: Huỷ  [Tạo]  │ │ EmptyState: 1 icon,│
                                        └─────────────────────┘ │ 1 line, 1 action │
```

| # | Rule | Owner component | Check |
|---|---|---|---|
| **D1** | **One title layout.** The h1 is always its own row (`PageTitle`/`Page title`). `SubpageToolbar title="…"` is deprecated (migration rewrites it). A page may have a PageTabsTitle *instead of* the title only when its 2-4 tabs are sibling routes. | `Page` (new) + `PageTitle` | L `title-layout` (a `SubpageToolbar` with `title`, or two h1); density `one-h1` |
| **D2** | **One primary action per view, trailing in the title row** (Apple: one trailing primary). Form: **text + icon** (`Thêm khách hàng`) on desktop, icon-only on phones (matches P2); the icon-only-everywhere rule of §4 is rewritten. Secondary actions: at most one more visible text button, the rest in a `⋯` `Menu`. | `Page actions` slot (`PageActions`) | existing density `primary-actions`; new `title-row-actions` (≤1 filled, ≤2 visible buttons) |
| **D3** | **Toolbar row order:** search leading → ≤3 filters → trailing group: sort, view switch (`ToggleGroup`), refresh, `⋯`. Slots are typed (`search`, `filters`, `trailing`); `left`/`right` stay for one release. | `SubpageToolbar` v2 | density `toolbar-order` (x-order of search < filters < trailing) |
| **D4** | **Switchers:** `PageTabsTitle` = sibling routes (replaces the title); `Tabs` (row under title) = sections of one record or page; `Pills` = filter of the *same* dataset (in the toolbar, ≤5, otherwise a `CustomSelect`); `ToggleGroup` = view mode; `Chip` = removable applied filter. | existing | L `switcher-misuse` (Pills with `href` or route targets, Tabs with >7 items) |
| **D5** | **Search is a visible field** on desktop (≥ 240px, leading), never an icon that expands; built-in 250 ms debounce, `Esc` clears, `/` focuses; one search per page (table search is fed by the toolbar, no second field). | `SearchInput`, `DataTable` | density `one-search`; L `raw-search-input` |
| **D6** | **Filters:** ≤3 inline; more → one "Bộ lọc" button opening a side panel/sheet; active filters always show as removable chips under the toolbar; "Xoá lọc" when any is active. Filters live in the toolbar, not in the page sidebar, except the filter-sidebar layout of §4. | `SubpageToolbar` + `FilterBar` (new) | density `filter-count` |
| **D7** | **Bulk actions:** a selection bar replaces the toolbar row (count, actions, "Bỏ chọn"); owned by `DataTable`; selection is a mode on phones (P4). | `DataTable` | a11y `bulk-bar` (checkbox column with no bar) |
| **D8** | **Pagination vs feed:** tables use `pageSize` 25/50 with count left and `Pagination` right; feeds (inbox, activity, chat) load on scroll; the fallback label is always "Xem thêm"; never a table with `pageSize=0` over 100 rows. | `DataTable`, new `useInfiniteList` | density `table-unbounded` |
| **D9** | **Rhythm:** gutter `px-4 sm:px-6`, top `pt-8`; title→toolbar `gap-stack` 12, toolbar→content `gap-group` 16, section→section `gap-section` 24; owned by `Page`, pages never set `space-y`/`mb` on those joins. | `Page` | density `page-rhythm` (measured gaps vs tokens ±2px) |
| **D10** | **Detail page:** Back or `Breadcrumb` above the title; title + `StatusBadge`; primary + `⋯` trailing; section `Tabs`; two columns (main, aside 320) from `lg`. Master-detail (split pane) only for list-driven reading (inbox), with the selection in the URL. | `DetailPage` (new, = P5) | L `detail-no-back` (shared with P5) |
| **D11** | **Dashboard:** title row (period `ToggleGroup`, "Tuỳ chỉnh" trailing); ≤4 KPIs with one `featured`; no toolbar, no pagination; sections separated by `gap-section`; widget cards neutral. | `Page`, `KpiCard` | density `kpi-count` |
| **D12** | **Settings page:** ≤5 sections → `Tabs` under the title; >5 → left section nav (sales-hub's 7 tabs); every section a `Card` of `Field` rows; one save bar per section (`FormActions`), not per field. | `SettingsPage` (new block) | L `settings-no-save-bar` |
| **D13** | **Forms:** label above field; required `*`; validation on blur then change; error text under the field via `Field error` and an `Alert` summary above `FormActions` when >1; `FormActions` = Huỷ (ghost) then Lưu/Tạo (primary), right-aligned, sticky on pages, destructive action left; `useUnsavedGuard`; page forms capped at `max-w-2xl` (explicit exception to the "no narrow containers" rule). | `Form`, `FormActions`, `useUnsavedGuard` (new) | L `form-no-guard`, `action-order`, `toast-for-validation` |
| **D14** | **Empty state:** inside the content slot, toolbar and title kept; one icon, one sentence, the **one** primary action (then the title-row primary is hidden while the list is empty, so there is one filled button); "no result" has a different title and a "Xoá lọc" action. | `EmptyState` variants `first-use` / `no-results` | density `empty-duplicate-primary` |
| **D15** | **Every page is a route:** sidebar items are links, tabs and filters live in the URL, Back works, reload keeps place. | `AppShell` | L `state-nav` |
| **D16** | **Slot-owner rule:** pages compose `Page`; hand-built title/toolbar rows are lint errors. This is what makes D1-D15 stick. | `Page` | L `no-adhoc-page-header` (an `h1` outside `Page`/`PageTitle`) |
| D17-D23 | Errors/states (F1), status (F4), formats (F5), confirm (F10), copy (F11), motion (F18), loading (F20); see section 2. | | |

**Where the current API forces inconsistency:** `SubpageToolbar` `title` prop (two layouts, the owner's observed drift), untyped `left`/`right`, `onPrimaryAction` optional so the
CTA is easily replaced by a `Button`, `DataTable` search and bulk bars not connected to the toolbar, `PageTabsTitle` doubling as the title, no `Page` component (each app
re-writes `PageShell`; live DOM shows studio and sales-hub did it identically, which is luck of one author).

### 3.5 What goes into the `semi-ui` skill (the default recipe)

Add a **"Page recipe by type"** step before step 3: list = D1-D9 order, detail = D10, dashboard = D11, settings = D12, form = D13, empty = D14; plus a **"boring defaults" checklist**: status via `StatusBadge`,
money/date via `@semi/ui/format`, create/edit surface by the D-table (modal/drawer/page), confirm vs undo (D20), copy from `COPY.md` (Thêm/Tạo, Huỷ/Xoá, "…", failure/empty wording), errors via
`ErrorState`, every route group with `loading.tsx`, `error.tsx`, `not-found.tsx`. Skill-only (no check possible): D2 label wording, D11 "one featured KPI", D14 copy. Check-only: D3, D5, D9, D15, D16.

### 3.6 Existing issues

ds#57 (`SubpageToolbar` phone layout) = D3 + D6 + P1: do it as `SubpageToolbar` v2 with typed slots, one design for both widths. ds#25 (`DataTable` phone layout) = D7, D8 + P3/P4.
ds#59 (phone detail, push + back) = D10 + P5. ds#60 (phone checks) = extend the same check set with the desktop ones: `toolbar-order`, `page-rhythm`, `title-row-actions`, `filter-count`, `one-search`, `empty-duplicate-primary`, `table-unbounded`.
New issues proposed: `Page`/`PageShell` (D1, D9, D16), form kit (D13), states kit (D14, D17, D23), `StatusBadge` (D18), `@semi/ui/format` (D19), `COPY.md` + lint (D21), `DetailPage`/`SettingsPage` blocks (D10, D12).

## 4. Rollout shape

- **Minor (0.34-0.36), additive, opt-in:** `Page`, `FormActions`+`useUnsavedGuard`, `ErrorState`/`Forbidden`/`NotFound`, `StatusBadge`, `@semi/ui/format`, `COPY.md`, new lint rules as warnings, skill recipes.
- **Major (1.0, together with P-rules and the type scale):** remove `SubpageToolbar title`, untyped slots, `STATUS_PILL`, the `BTN_*` docs; migrations rewrite `title` layouts and `ui-lg` names; lint warnings become errors.
- **Apps:** pilot feedback-hub (small, forms) and sme-hub (many list pages, already clean); data-hub next (login wall: needs a test session for `/semi-check`); sales-hub (single page → routes first); project-manager; **3dnoobs-studio last** (needs its own migration plan, 648 open issues).
- Order: F1/F2 (errors, unsaved guard) and F4/F5 (status, formats) have the highest user impact and the smallest API surface: ship them first, ahead of the layout work.

## 5. Owner questions (everything, PR #64 included), with a recommendation

Layout and anatomy
1. **One page anatomy (D1-D16), enforced by a `Page` component, and deprecate `SubpageToolbar title`?** Recommend **yes**: the second title layout is the root of the drift.
2. **Primary action: text + icon on desktop, icon-only on phones (D2), replacing the "icon-only everywhere" rule?** Recommend **yes**: four apps already use text; icon-only fails discoverability and Apple's one trailing primary is labelled. (PR #64 Q2: trailing icon on phones, not a sticky bar, except forms.)
3. **Search as a visible field (D5) in every list?** Recommend **yes**, ≥240px, leading.
4. **Settings with >5 sections: left nav (D12), and is a detail page always a route with Back (D10, P5)?** Recommend yes to both.
5. **Master-detail split pane allowed only for inbox-like pages, URL-driven?** Recommend yes.

Shared with PR #64 (type and phone)
6. Phone tables: list by default for ≥3 columns, or scroll by default? (PR #64 Q1/Q6) Recommend **list**, with DataTable doing it automatically.
7. Body 17 on phones everywhere, or 15-16 for data? (Q1) Recommend **16 for data (cells, toolbars), 17 for reading and fields**; 44px controls on phones for all six apps including studio (Q4), yes.
8. Desktop body 15 or 14 for dense tools? (Q3) Recommend **14 stays in `compact` density; regular goes to 15**.
9. `-apple-system-body`: opt-in `@supports` block, needs a real iPhone test (Q5). Recommend **ship `rem` only now**, test Dynamic Type later.
10. iPad: a layout target or "desktop with touch"? Recommend **desktop with touch** (44pt targets, no extra layout) until a product asks.

Release and process
11. **One release line to 1.0 or staged?** (PR #64 Q2, Q4) Recommend **staged**: additive minors first (F1, F2, F4, F5 kits, `Page`, copy guide, warning-level lint), then one 1.0 with the type scale, phone anatomy and removals; each minor ships migrations.
12. **Which new kits get built first?** Recommend the order: states kit + form kit, `StatusBadge` + `format`, `Page`, `COPY.md`, detail/settings blocks.
13. **Vietnamese copy decisions:** Thêm (add to a list) vs Tạo (make a record): one brand-wide choice; "Huỷ"/"Xoá" spellings (already the majority); "Xem thêm" for paging; sentence case, no period in titles; "…". Recommend **Tạo for new records, Thêm for adding existing items to a set; Huỷ/Xoá; Xem thêm**. Will you fix these, or let me draft `COPY.md` for review?
14. **Studio:** bring it onto Semi first (blocks all rules there), or treat it as a tool app with its own exceptions? Recommend **migrate**, in a separate effort with its own plan (cause: 321 raw buttons, 0 `Field`).
15. **Apps with state routing (sales-hub, studio): convert to real routes as part of adoption?** Recommend yes, a blocker for D15 and P5.
16. **Lint strictness:** new rules as warnings for one minor, errors in 1.0? Recommend yes. Add a phone *and* desktop overflow/clip check before release (PR #64 finding 6).
17. **Two toast APIs / local wrappers:** forbid app-level `toast` wrappers (lint `local-toast`) and add what they were missing to Semi? Recommend yes.
18. **Re-run the review** of sme-hub, feedback-hub, data-hub and project-manager rendered pages when their servers and test sessions are up, and with dark mode? Recommend **yes, before the 1.0 decision**; screenshots of real data stay out of the repo.

**Not done:** rendered review of four apps, dark-mode parity, motion, keyboard flows, performance of perceived loading, real user testing. Counts are heuristic.
