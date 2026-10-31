# Changelog

All notable changes to the **Semi Design System** (`@semi/ui` and `semi-design` plugin) are documented in this file.

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
