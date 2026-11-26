# Semi components

Every component doc, for agents: read the one you need (`node_modules/@semi/ui/docs/components/<id>.md`), copy an
example, keep its imports from `@semi/ui`. Generated from `examples/` and the types in `src/`.

## Actions

| Doc | Components | When to use |
|---|---|---|
| [Button](button.md) | `Button`, `Spinner` | Any action: save, create, refresh, delete, open a dialog. |
| [Button group](button-group.md) | `ButtonGroup` | Previous / today / next; a primary action with its overflow menu; zoom − / +. |
| [Card actions](card-actions.md) | `CardActions` | Cards and media tiles in a grid (suppliers, products, templates, files) that open on click and have one or two quick actions. |
| [Chip](chip.md) | `Chip` | Several filters that can be on at once (materials, device types). |
| [External link](external-link.md) | `ExternalLink` | Any link that leaves the app (docs, GitHub, a payment page). |
| [Split button](split-button.md) | `SplitButton` | Two or more ways to start one job (type it in, import a file, copy from another system): G1. |
| [Toggle](toggle.md) | `Toggle`, `ToggleGroup` | A view mode with icons; text formatting; a pin / follow / mute switch on a toolbar. |

## Forms

| Doc | Components | When to use |
|---|---|---|
| [Calendar](calendar.md) | `Calendar` | Inline date selection on a page; picking a date range for a report. |
| [Checkbox](checkbox.md) | `Checkbox` | Opt in to something in a form (accept terms, include archived). |
| [Combobox](combobox.md) | `CustomCombobox` | Long or grouped lists the user searches (materials, customers, repositories, SKUs). |
| [Date picker](date-picker.md) | `DatePicker` | Schedule a job, filter by day, set a due date. |
| [Field, Input, Textarea](field.md) | `Field`, `Input`, `Textarea` | Every form control: wrap it in Field instead of writing a <label>. |
| [FileDrop](file-drop.md) | `FileDrop`, `DropZone` | Choosing or dropping one or more files: CSV import, product photos, invoices, firmware, model files (FileDrop). |
| [Filter chip row](filter-chip-row.md) | `FilterChipRow`, `FilterChip`, `FilterOptions` | The filters of a list, grid or table page on desktop and iPad (md+), under its SearchPill in a StickyContextBar. |
| [Filter panel](filter-panel.md) | `PhoneFilterBar`, `FilterPanel` | Below md on every page that has a FilterChipRow on desktop (same filters, same state). |
| [Form actions, unsaved guard, validation](form-actions.md) | `FormActions`, `useUnsavedGuard`, `useFormValidation`, `FormErrorSummary` | Every form: the action row is FormActions, never a hand-ordered pair of buttons. |
| [Hint textarea](hint-textarea.md) | `HintTextarea` | A message or note where people mention a record (@ a supplier, a colleague) or insert a template or command (/). |
| [Input group](input-group.md) | `InputGroup` | Money and units, URLs and domains, a copy or reveal button inside the field. |
| [Input OTP](input-otp.md) | `InputOTP` | Verification codes, PINs, invite codes of a fixed length. |
| [Multi combobox](multi-combobox.md) | `MultiCombobox` | Picking several values from a long or grouped list in a form (supplied goods, tags, assignees, repositories). |
| [Number input](number-input.md) | `NumberInput`, `NumPadPopup` | Quantities, temperatures, prices, percentages. |
| [Option cards](option-cards.md) | `OptionCards` | Picking one visual option from 2–6 choices (an AI provider, a shipping method, a plan) where a card with an icon or short description reads faster than a radio list. |
| [Radio group](radio-group.md) | `RadioGroup` | 2–5 options where the descriptions help the choice (plans, shipping). |
| [Search input](search-input.md) | `SearchInput` | Filter the list or grid on the current page. |
| [Search pill](search-pill.md) | `SearchPill` | The search of a list, grid or DataTable page, above its filter chips (inside StickyContextBar). |
| [Select](select.md) | `CustomSelect` | One value from a short or medium list (printers, regions). |
| [Slider](slider.md) | `Slider` | Values where the position matters more than the exact number (volume, opacity, infill, price range filters). |
| [Stepper](stepper.md) | `Stepper` | A small whole number people nudge rather than type: tấn per line, copies, guests, 1–99. |
| [Switch](switch.md) | `Switch` | Settings that take effect at once (notifications, dark sync, auto-print). |
| [View switch](view-switch.md) | `ViewSwitch` | A collection people browse both as rows and as cards (products, files, suppliers). |

## Overlays

| Doc | Components | When to use |
|---|---|---|
| [Command](command.md) | `Command`, `CommandDialog`, `CommandPalette` | Every app with more than a few pages: mount CommandPalette once in the root layout to jump to a place or record and start a create action from anywhere on ⌘K (L1). |
| [Confirm dialog](confirm-dialog.md) | `ConfirmHost` | Before an irreversible action: delete, stop a print, discard changes. confirmDelete names the object. |
| [Context menu](context-menu.md) | `ContextMenu` | Power-user shortcuts on canvases, file grids and rows, when the same actions also exist in a visible Menu or toolbar. |
| [Detail overlay](detail-overlay.md) | `DetailOverlay` | Open a record from a list, grid or table and step through the results without losing the list (suppliers, orders, leads). |
| [Drawer](drawer.md) | `Drawer` | Filters of a list, details of a row, a secondary form that keeps the page visible. |
| [Feature intro](feature-intro.md) | `FeatureIntro` | A new or reworked feature people already in the app should notice once (a new workspace, a new way to compare quotes). |
| [Hover card](hover-card.md) | `HoverCard` | Peek at a linked record without opening it. |
| [Menu](menu.md) | `Menu` | Secondary actions of a row, card or page (Đổi tên, Nhân bản, Xoá): G2, G4. |
| [Modal](modal.md) | `Modal` | A short task that needs the user's full attention (edit settings, create an item). |
| [Popover](popover.md) | `Popover` | Quick edits without leaving the page (rename, set a limit), compact filter forms. |
| [Toast](toast.md) | `ToastHost` | Confirm an action happened (Đã lưu): toast.success, shown once, never a modal. |
| [Tooltip](tooltip.md) | `Tooltip` | Name an icon-only control; add a short hint to a truncated value. |

## Navigation & layout

| Doc | Components | When to use |
|---|---|---|
| [App header](app-header.md) | `AppHeader` | Single-screen tools: 3D editors, slicers, colour tools. |
| [App shell](app-shell.md) | `AppShell`, `RouteHeader`, `AccountMenu`, `MobileTabBar` | Every app with several pages (dashboards, admin, store back office). |
| [Breadcrumb](breadcrumb.md) | `Breadcrumb` | Detail pages deep in a hierarchy (Kho › Vật liệu › PLA đen). |
| [List + reader](list-reader.md) | `ListReaderLayout`, `ReaderHeader` | Mail inboxes, support tickets, chat queues, notification centres or log viewers where people scan a list and read items side by side. |
| [Mega menu](mega-menu.md) | `MegaMenu` | One sidebar item leads to many destinations of one area that fall into 2–4 groups (a catalogue, tools, reports). |
| [Menubar](menubar.md) | `Menubar` | Editors and tool apps with many commands (3D, slicer, image tools), next to an AppHeader. |
| [Minimal header](minimal-header.md) | `MinimalHeader` | A detail page (one order, one customer) or a settings page reached from a list. |
| [Navigation menu](navigation-menu.md) | `NavigationMenu` | Marketing sites, storefronts, docs headers. |
| [Page actions](page-actions.md) | `PageActions`, `PageActionsProvider`, `PageActionsSlot` | A layout owns the header row but the page decides the actions (TextTabs + “+”). |
| [Page layouts](page.md) | `Page`, `PageEnter`, `SubNav`, `PageSection`, `PageGrid` | Every page inside AppShell: lists and workspaces (work), settings / explore / articles (reading), areas with sub-pages or mailbox folders (two-column). |
| [Page title](page-title.md) | `PageTitle` | The first line of every page (PageTitle). |
| [Pagination](pagination.md) | `Pagination` | Server-paged tables and reports. |
| [Pill tabs](pill-tabs.md) | `PillTabs` | 5+ sections of one page, or sections with icons (Cấu hình: Hộp thư, Nhóm thư, Nguồn khách, Mặt hàng, Mẫu thư, Data Hub, Doanh nghiệp, Người dùng). |
| [Resizable panels](resizable.md) | `ResizablePanels` | Tools where people tune the space between two or three areas. |
| [Route header banner](route-header-banner.md) | `RouteHeaderBanner` | A short app-wide announcement people should notice for a while: a new feature, a planned maintenance window, a changed price list. |
| [Scroll area](scroll-area.md) | `ScrollArea` | A list or log inside a card that must keep its height. |
| [Section header](section-header.md) | `SectionHeader` | Above a rail or a grid of MediaCards on a discovery, home or gallery page. |
| [Segmented control](segmented-control.md) | `SegmentedControl` | 2–5 filter values shown in full, often with counts (Tất cả · Đang mở · Đang báo giá · Đã chốt). |
| [Side panel](side-panel.md) | `SidePanel`, `SidePanelToggle` | Settings or layers beside a 3D view, map or editor. |
| [Sticky context bar](sticky-context-bar.md) | `StickyContextBar`, `BarActions` | A list, grid or table page with a search and filters people change while they scroll (customers, suppliers, products). |
| [Subpage toolbar](subpage-toolbar.md) | `SubpageToolbar`, `RefreshButton` | Every list or grid page. |
| [Tabs](tabs.md) | `Tabs` | Sections of one object inside a card or dialog: Tổng quan / Hoạt động / Cài đặt. |
| [Text tabs](text-tabs.md) | `TextTabs` | 2–4 top-level views of a discovery or reading page, rendered as the page heading (Khám phá / Mẫu sẵn / Cảm hứng). |
| [Workspace layout](workspace-layout.md) | `WorkspaceLayout`, `WorkspaceHeader`, `WorkspaceSection` | A tool where the user sets inputs and sees what they produce: a quote request and its comparison, a generator, an import with a preview, a print job. |

## Data display

| Doc | Components | When to use |
|---|---|---|
| [Accordion](accordion.md) | `Accordion` | FAQs and help; long settings split into groups. |
| [Aspect ratio](aspect-ratio.md) | `AspectRatio` | Thumbnails and media that must not jump while loading. |
| [Avatar & LetterAvatar](avatar.md) | `Avatar`, `LetterAvatar` | Owners, assignees, customers in rows and cards (`Avatar`). |
| [Badge](badge.md) | `Badge`, `CountBadge`, `NewTag` | Status of a row or card (Đã thanh toán, Lỗi), a plan or role tag. |
| [Card](card.md) | `Card` | Group the content of a page in cards; nested facts in TILE (bg-card-field). |
| [Carousel](carousel.md) | `Carousel` | Product photos, featured items, onboarding steps. |
| [Chart](chart.md) | `BarChart`, `LineChart`, `DonutChart`, `Sparkline` | Compare categories (BarChart), show change over time (LineChart), parts of a whole with ≤ 5 parts (DonutChart), a trend next to a KPI (Sparkline). |
| [Code block](code-block.md) | `CodeBlock` | API keys and commands to copy, config snippets, developer docs. |
| [Collapsible](collapsible.md) | `Collapsible` | Hide rarely used options (“Tuỳ chọn khác”), long details. |
| [Data table](data-table.md) | `DataTable` | Admin lists: orders, customers, inventory, logs — sort by a column, search, act on several rows. |
| [Icon](icon.md) | `Icon`, `IconTile` | Every icon in the UI: pick the semantic name (trash = delete, close = dismiss, refresh = reload). See docs/ICONS.md. |
| [Item](item.md) | `Item`, `ItemGroup` | Settings lists, files, members, notifications, linked records. |
| [Kbd](kbd.md) | `Kbd` | Show the shortcut of an action next to it. |
| [KPI card](kpi-card.md) | `KpiCard` | The metric row at the top of a dashboard (2–4 per row), with the screen's main number as the featured card. |
| [Markdown](markdown.md) | `Markdown` | Answers of an AI assistant, release notes, short rich text. |
| [Media card](media-card.md) | `MediaCard` | Galleries and discovery sections: videos, templates, collections, articles with a cover image. |
| [QR code](qr-code.md) | `QRCode` | Show a payment QR (VietQR) in a payment dialog, or print one on a receipt. |
| [Separator](separator.md) | `Separator` | Split groups inside a card or menu; “hoặc” between two ways to sign in. |
| [Table](table.md) | `Table`, `THead`, `TBody`, `TR`, `TH`, `TD` | Orders, invoices, logs: rows compared by column. |
| [Typography](typography.md) | `Prose` | Help articles, release notes, policies, long AI answers (wrap Markdown in Prose). |

## Feedback

| Doc | Components | When to use |
|---|---|---|
| [Alert](alert.md) | `Alert` | State the user must see while working (firmware update, low material, failed print). |
| [Empty state](empty-state.md) | `EmptyState` | First use: no items yet, a feature not set up (variant first-use). |
| [Error, not found, no access](states.md) | `ErrorState`, `NotFound`, `Forbidden` | A route or a fetch failed: ErrorState with onRetry (route error.tsx passes Next.js's reset). |
| [Guided empty state](guided-empty-state.md) | `GuidedEmptyState` | First use of a page whose value needs setup in a few steps (suppliers before quotes, a catalogue before orders). |
| [Progress](progress.md) | `Progress` | Print progress, upload, storage used. |
| [Skeleton](skeleton.md) | `Skeleton`, `SkeletonCard`, `SkeletonGrid`, `SkeletonRows`, `SkeletonList`, `SkeletonTable`, `SkeletonDetail`, `PageSkeleton`, `Loading`, `BootLoader` | Any content that is loading: show its shape. |
| [Task host](task-host.md) | `TaskHost` | The user started a job and cannot do anything useful until it finishes: an upload before printing, an import, a firmware update, a payment step, an AI job that the next screen needs. |

## AI

| Doc | Components | When to use |
|---|---|---|
| [Action confirmation](action-confirmation.md) | `ActionConfirmation` | Human-in-the-loop: any agent action that is outward-facing, costs money or cannot be undone. |
| [AI chat](ai-chat.md) | `AIChat`, `ChatPanel`, `ChatView` | Every AI conversation in a Semi app (assistant beside a workspace, help over a modal). |
| [Chat messages](chat-messages.md) | `UserMessage`, `AssistantMessage`, `ChatAnswer`, `ChatAvatar`, `ChatCopyButton`, `ChatError`, `ChatThinking`, `ChatIntro`, `ChatSuggestion`, `ChatSuggestions`, `ChatList`, `ChatComposer` | A chat that does not fit AIChat's layout; AI output inside another feature. |
| [Chat model picker](chat-model-picker.md) | `ChatModelPicker` | Let people pick the provider, model and thinking effort of an AI feature. |
| [Context meter](context-meter.md) | `ContextMeter` | Next to the composer or model picker in long chats and agent sessions. |
| [File tree](file-tree.md) | `FileTree` | Changes an agent made, a repo or export browser, attachments with folders. |
| [Reasoning](reasoning.md) | `Reasoning` | Models that expose thinking / reasoning text; show it before the AssistantMessage body. |
| [Sources](sources.md) | `Sources`, `Citation` | Answers built from search or documents (RAG); every claim that came from a page. |
| [Task list](task-list.md) | `TaskList` | Multi-step agent work (plans, migrations, onboarding jobs) people watch progress on. |
| [Terminal](terminal.md) | `Terminal` | Agents and jobs that run shell commands, builds, deploy logs. |
| [Tool call](tool-call.md) | `ToolCall` | Agent runs and chats where the model calls functions, MCP tools or APIs. |

## Blocks

| Doc | Components | When to use |
|---|---|---|
| [Agent workspace](agent-run.md) |  | Starting an agent chat or run log; shows how the AI parts sit together in a ChatList; the AI doc pages link here. |
| [Dashboard](dashboard.md) |  | The home page of an admin or operations app: a few numbers, one trend, what needs attention. |
| [List page](list-page.md) |  | Orders, customers, products, jobs: any page whose job is to find and act on records. |
| [Settings page](settings-page.md) |  | Account, workspace or device settings. |

## Setup

| Doc | Components | When to use |
|---|---|---|
| [Locale](locale.md) | `SemiLocaleProvider` | An app in English, or one that renames a built-in label. |
| [Theme](theme.md) | `ThemeProvider`, `ThemeScript`, `ThemeSwitcher`, `ThemeToggle` | Once in every app's root layout; the segmented switcher in settings, variant="menu" in a header or toolbar, useThemeUtility() in AppShell's utilities (and its rail). |

