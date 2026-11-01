# Semi components

Every component doc, for agents: read the one you need (`node_modules/@semi/ui/docs/components/<id>.md`), copy an
example, keep its imports from `@semi/ui`. Generated from `examples/` and the types in `src/`.

## Actions

| Doc | Components | When to use |
|---|---|---|
| [Button](button.md) | `Button`, `Spinner` | Any action: save, create, refresh, delete, open a dialog. |
| [Button group](button-group.md) | `ButtonGroup` | Previous / today / next; a primary action with its overflow menu; zoom − / +. |
| [Chip](chip.md) | `Chip` | Several filters that can be on at once (materials, device types). |
| [External link](external-link.md) | `ExternalLink` | Any link that leaves the app (docs, GitHub, a payment page). |
| [Pills](pills.md) | `Pills` | Filter a list by status or period: Tất cả / Đang in / Xong. |
| [Toggle](toggle.md) | `Toggle`, `ToggleGroup` | A view mode with icons; text formatting; a pin / follow / mute switch on a toolbar. |

## Forms

| Doc | Components | When to use |
|---|---|---|
| [Calendar](calendar.md) | `Calendar` | Inline date selection on a page; picking a date range for a report. |
| [Checkbox](checkbox.md) | `Checkbox` | Opt in to something in a form (accept terms, include archived). |
| [Combobox](combobox.md) | `CustomCombobox` | Long lists the user searches (materials, customers, SKUs). |
| [Date picker](date-picker.md) | `DatePicker` | Schedule a job, filter by day, set a due date. |
| [Field, Input, Textarea](field.md) | `Field`, `Input`, `Textarea` | Every form control: wrap it in Field instead of writing a <label>. |
| [Input group](input-group.md) | `InputGroup` | Money and units, URLs and domains, a copy or reveal button inside the field. |
| [Number input](number-input.md) | `NumberInput`, `NumPadPopup` | Quantities, temperatures, prices, percentages. |
| [Radio group](radio-group.md) | `RadioGroup` | 2–5 options where the descriptions help the choice (plans, shipping). |
| [Search input](search-input.md) | `SearchInput` | Filter the list or grid on the current page. |
| [Select](select.md) | `CustomSelect` | One value from a short or medium list (printers, regions). |
| [Slider](slider.md) | `Slider` | Values where the position matters more than the exact number (volume, opacity, infill, price range filters). |
| [Switch](switch.md) | `Switch` | Settings that take effect at once (notifications, dark sync, auto-print). |

## Overlays

| Doc | Components | When to use |
|---|---|---|
| [Command](command.md) | `Command`, `CommandDialog` | Jump anywhere and run any action from the keyboard (⌘K) in apps with many pages. |
| [Confirm dialog](confirm-dialog.md) | `ConfirmHost` | Before deleting, stopping a print or discarding changes. |
| [Context menu](context-menu.md) | `ContextMenu` | Power-user shortcuts on canvases, file grids and rows, when the same actions also exist in a visible Menu or toolbar. |
| [Drawer](drawer.md) | `Drawer` | Filters of a list, details of a row, a secondary form that keeps the page visible. |
| [Hover card](hover-card.md) | `HoverCard` | Peek at a linked record without opening it. |
| [Menu](menu.md) | `Menu` | Secondary actions of a row or card (Đổi tên, Nhân bản, Xoá). |
| [Modal](modal.md) | `Modal` | A short task that needs the user's full attention (edit settings, create an item). |
| [Popover](popover.md) | `Popover` | Quick edits without leaving the page (rename, set a limit), compact filter forms. |
| [Toast](toast.md) | `ToastHost` | Confirm an action happened (Đã lưu), warn about something passing (mất kết nối), offer undo. |
| [Tooltip](tooltip.md) | `Tooltip` | Name an icon-only control; add a short hint to a truncated value. |

## Navigation & layout

| Doc | Components | When to use |
|---|---|---|
| [App header](app-header.md) | `AppHeader` | Single-screen tools: 3D editors, slicers, colour tools. |
| [App shell](app-shell.md) | `AppShell`, `MobileTabBar` | Every app with several pages (dashboards, admin, store back office). |
| [Breadcrumb](breadcrumb.md) | `Breadcrumb` | Detail pages deep in a hierarchy (Kho › Vật liệu › PLA đen). |
| [Page actions](page-actions.md) | `PageActions`, `PageActionsProvider`, `PageActionsSlot` | A layout owns the header row but the page decides the actions (PageTabsTitle + “+”). |
| [Page title](page-title.md) | `PageTitle`, `PageTabsTitle` | The first line of every page (PageTitle). |
| [Pagination](pagination.md) | `Pagination` | Server-paged tables and reports. |
| [Scroll area](scroll-area.md) | `ScrollArea` | A list or log inside a card that must keep its height. |
| [Side panel](side-panel.md) | `SidePanel`, `SidePanelToggle` | Settings or layers beside a 3D view, map or editor. |
| [Subpage toolbar](subpage-toolbar.md) | `SubpageToolbar`, `RefreshButton` | Every list or grid page. |
| [Tabs](tabs.md) | `Tabs` | Sections of one object: Tổng quan / Hoạt động / Cài đặt. |

## Data display

| Doc | Components | When to use |
|---|---|---|
| [Accordion](accordion.md) | `Accordion` | FAQs and help; long settings split into groups. |
| [Avatar](avatar.md) | `Avatar` | Owners, assignees, customers in rows and cards. |
| [Badge](badge.md) | `Badge` | Status of a row or card (Đã thanh toán, Lỗi), a plan or role tag. |
| [Card](card.md) | `Card` | Group the content of a page in cards; nested facts in TILE. |
| [Collapsible](collapsible.md) | `Collapsible` | Hide rarely used options (“Tuỳ chọn khác”), long details. |
| [Data table](data-table.md) | `DataTable` | Admin lists: orders, customers, inventory, logs — sort by a column, search, act on several rows. |
| [Icon](icon.md) | `Icon`, `IconTile` | Every icon in the UI: pick the semantic name (trash = delete, close = dismiss, refresh = reload). See docs/ICONS.md. |
| [Kbd](kbd.md) | `Kbd` | Show the shortcut of an action next to it. |
| [KPI card](kpi-card.md) | `KpiCard` | The metric row at the top of a dashboard (2–4 per row). |
| [Markdown](markdown.md) | `Markdown` | Answers of an AI assistant, release notes, short rich text. |
| [Separator](separator.md) | `Separator` | Split groups inside a card or menu; “hoặc” between two ways to sign in. |
| [Table](table.md) | `Table`, `THead`, `TBody`, `TR`, `TH`, `TD` | Orders, invoices, logs: rows compared by column. |

## Feedback

| Doc | Components | When to use |
|---|---|---|
| [Alert](alert.md) | `Alert` | State the user must see while working (firmware update, low material, failed print). |
| [Empty state](empty-state.md) | `EmptyState` | No items yet, no search results, a feature not set up. |
| [Progress](progress.md) | `Progress` | Print progress, upload, storage used. |
| [Skeleton](skeleton.md) | `Skeleton`, `SkeletonCard`, `SkeletonGrid`, `SkeletonRows`, `PageSkeleton`, `Loading` | Any content that is loading: show its shape. |

## AI

| Doc | Components | When to use |
|---|---|---|
| [AI chat](ai-chat.md) | `AIChat`, `ChatPanel`, `ChatView` | Every AI conversation in a Semi app (assistant beside a workspace, help over a modal). |
| [Chat messages](chat-messages.md) | `UserMessage`, `AssistantMessage`, `ChatAnswer`, `ChatAvatar`, `ChatCopyButton`, `ChatError`, `ChatThinking`, `ChatIntro`, `ChatSuggestion`, `ChatSuggestions`, `ChatList`, `ChatComposer` | A chat that does not fit AIChat's layout; AI output inside another feature. |
| [Chat model picker](chat-model-picker.md) | `ChatModelPicker` | Let people pick the provider, model and thinking effort of an AI feature. |

## Setup

| Doc | Components | When to use |
|---|---|---|
| [Locale](locale.md) | `SemiLocaleProvider` | An app in English, or one that renames a built-in label. |
| [Theme](theme.md) | `ThemeProvider`, `ThemeScript`, `ThemeSwitcher`, `ThemeToggle` | Once in every app's root layout; the switcher in settings or the sidebar footer. |

