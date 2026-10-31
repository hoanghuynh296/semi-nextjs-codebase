// What each Storybook page and section shows, with copy-ready usage code. One source for both readers: the pages render
// it (titles, the code under each demo) and scripts/build-manifest.mjs turns it into public/llms.txt for agents.
// Plain data only (Node imports this file directly).

export interface StoryPage {
  /** Route without extension: the export serves `/<path>.html`. */
  path: string;
  title: string;
  /** One line: what an agent finds on the page. */
  summary: string;
}

export interface StorySection {
  page: string;
  title: string;
  /** What to use it for, in one sentence. */
  when: string;
  code: string;
}

export const STORY_PAGES: StoryPage[] = [
  { path: "foundations", title: "Foundations & Icons", summary: "Surface tokens, the type scale and the searchable icon registry." },
  { path: "components", title: "Components Showcase", summary: "Theme switching, toolbars, buttons, form controls, KPI cards, chips, dialogs and skeletons." },
  { path: "primitives", title: "Primitives & Forms", summary: "Button, Field, choices, Tabs, Tooltip, Menu, Drawer, Toast, Alert, Progress, Table, EmptyState, locale." },
  { path: "patterns", title: "Layout Patterns", summary: "Page tabs and header actions, the tool-app header, SidePanel, Markdown and skeleton layouts." },
  { path: "chat", title: "AI Chat", summary: "The standard AI chat panel (AIChat), its parts and the provider / model / effort picker." },
];

export const STORY_SECTIONS: Record<string, StorySection> = {
  // ── foundations ──
  surfaces: {
    page: "foundations",
    title: "Surfaces & tokens",
    when: "Every background, text and border colour: semantic tokens that switch with the theme, never palette classes.",
    code: `<div className="bg-canvas">            {/* app frame */}
  <main className="bg-app">           {/* content area */}
    <section className="bg-panel border border-line rounded-xl">   {/* card */}
      <h2 className="text-contrast">Title</h2>
      <p className="text-body">Body</p>
      <span className="text-muted">Caption</span>
      <input className="bg-field" />   {/* or FIELD_INPUT */}
    </section>
  </main>
</div>
// Status: bg-danger-bg border-danger-border text-danger-fg (success / warning / info), bg-*-solid for dots and bars`,
  },
  typography: {
    page: "foundations",
    title: "Type scale",
    when: "All text sizes; font-medium / font-semibold only, sentence case, tabular-nums for numbers.",
    code: `text-caption 11 · text-label 12 · text-ui 13 (default UI) · text-ui-lg 14 · text-title 15 · text-title-lg 16
text-kpi 18 / sm:text-heading 22 (KpiCard) · text-heading 22 / sm:text-display 26 (PageTitle)
// no Tailwind text-xs / text-sm / text-base and no arbitrary pixel sizes`,
  },
  icons: {
    page: "foundations",
    title: "Icon registry",
    when: "Every icon; pick by meaning from docs/ICONS.md (trash = delete, close = dismiss, refresh = sync).",
    code: `import { Icon, IconTile } from "@semi/ui";

<Icon name="refresh" className="w-4 h-4" />
<IconTile name="printer" tone="green" size="md" />`,
  },

  // ── components ──
  theme: {
    page: "components",
    title: "Theme (light · dark · system)",
    when: "Theme setup of every app: applied before paint, stored, follows the OS on system.",
    code: `// app/layout.tsx
import { ThemeScript, ThemeProvider, ToastHost, ConfirmHost } from "@semi/ui";

<html lang="vi" suppressHydrationWarning>
  <head><ThemeScript /></head>
  <body className="bg-canvas text-body">
    <ThemeProvider>{children}<ToastHost /><ConfirmHost /></ThemeProvider>
  </body>
</html>

// settings / sidebar footer
<ThemeSwitcher fullWidth />   // or <ThemeToggle /> in a collapsed rail`,
  },
  "subpage-toolbar": {
    page: "components",
    title: "SubpageToolbar",
    when: "The sticky toolbar of a list page: filters left; add + search + refresh right.",
    code: `import { SubpageToolbar, Pills } from "@semi/ui";

<SubpageToolbar
  left={<Pills value={filter} onChange={setFilter} options={[{ key: "all", label: "Tất cả" }, { key: "printing", label: "Đang in" }]} />}
  onPrimaryAction={openCreate}
  primaryActionLabel="Thêm máy in"
  searchValue={q}
  onSearchChange={setQ}
  onRefresh={reload}
/>`,
  },
  buttons: {
    page: "components",
    title: "Buttons",
    when: "Actions: one primary per area, secondary for the rest, danger for destructive, icon-only with aria-label.",
    code: `import { Button } from "@semi/ui";

<Button variant="primary" icon="play" onClick={start}>Bắt đầu in</Button>
<Button icon="edit">Sửa</Button>
<Button variant="danger" icon="trash">Xoá</Button>
<Button iconOnly icon="plus" aria-label="Thêm" />
<Button variant="primary" loading={saving}>Lưu</Button>
// class form: BTN_PRIMARY / BTN_SECONDARY / BTN_DANGER / BTN_GHOST (+ BTN_SM, BTN_ICON) from @semi/ui/styles`,
  },
  "form-controls": {
    page: "components",
    title: "Form controls",
    when: "Selects, comboboxes, numbers and dates: never the browser's own select, number or date inputs.",
    code: `import { Field, CustomSelect, CustomCombobox, NumberInput, DatePicker, Input } from "@semi/ui";

<Field label="Máy in"><CustomSelect variant="field" value={printer} onChange={setPrinter} options={printers} /></Field>
<Field label="Vật liệu"><CustomCombobox value={mat} onChange={setMat} options={materials} /></Field>
<Field label="Nhiệt độ"><NumberInput value={temp} onChange={(e) => setTemp(e.target.value)} unit="°C" integer /></Field>
<DatePicker value={date} onChange={setDate} ariaLabel="Ngày in" />
<Field label="Tên bản in" hint="Hiện trên thẻ"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>`,
  },
  kpi: {
    page: "components",
    title: "KPI cards & Pagination",
    when: "Headline numbers of a dashboard (tabular-nums, shimmer while loading) and paged lists.",
    code: `import { KpiCard, Pagination } from "@semi/ui";

<KpiCard label="Tổng sản lượng" value="1.842" sub="+12.4% so với tuần trước" icon="box" tone="good" loading={loading} />
<Pagination page={page} pages={8} onChange={setPage} />`,
  },
  chips: {
    page: "components",
    title: "Chips & badges",
    when: "Badge = read-only status / tag; Chip = on-off filter; Pills = single choice.",
    code: `import { Badge, Chip } from "@semi/ui";

<Badge tone="emerald" dot>Hoàn thành</Badge>
<Badge tone="amber" icon="clock">Đang xử lý</Badge>
<Chip active={on} onClick={() => setOn(!on)} tone="purple">Bambu Lab PLA</Chip>`,
  },
  dialogs: {
    page: "components",
    title: "Modal & confirmDialog",
    when: "Dialogs (full screen on phones) and confirmations: never window.confirm / alert.",
    code: `import { Modal, Button, confirmDialog } from "@semi/ui";

<Modal open={open} onClose={close} title="Sửa máy in" footer={<Button size="modal" variant="primary" onClick={save}>Lưu</Button>}>
  …form…
</Modal>

if (await confirmDialog({ title: "Xoá máy in?", message: "Không thể hoàn tác.", confirmLabel: "Xoá", tone: "danger" })) remove();`,
  },
  skeletons: {
    page: "components",
    title: "Skeletons",
    when: "Loading states: shimmer shapes of the real layout, never loading text or page spinners.",
    code: `import { Loading, SkeletonCard, SkeletonRows, SkeletonGrid } from "@semi/ui";

{loading ? <SkeletonGrid count={3} className="grid md:grid-cols-3 gap-3" /> : <Cards />}
<Loading><SkeletonRows count={5} /></Loading>   {/* Loading announces the region (role=status) */}`,
  },

  // ── primitives ──
  button: {
    page: "primitives",
    title: "Button & Spinner",
    when: "The component form of the button classes; Spinner only inside the control running an action.",
    code: `import { Button, Spinner } from "@semi/ui";

<Button variant="primary" size="md" icon="check">Lưu</Button>
<Button size="sm" variant="ghost">Xem thêm</Button>
<Button size="modal" variant="secondary">Huỷ</Button>
<Spinner label="Đang lưu" />`,
  },
  field: {
    page: "primitives",
    title: "Field · Input · Textarea",
    when: "Any labelled input: label, hint and error are wired for screen readers automatically.",
    code: `import { Field, Input, Textarea } from "@semi/ui";

<Field label="Tên máy in" hint="Hiện trên thẻ" error={errors.name} required>
  <Input icon="printer" value={name} onChange={(e) => setName(e.target.value)} />
</Field>
<Field label="Ghi chú"><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></Field>`,
  },
  choice: {
    page: "primitives",
    title: "Checkbox · Switch · RadioGroup",
    when: "Booleans and single choice with labels and descriptions; Switch for settings that apply at once.",
    code: `import { Checkbox, Switch, RadioGroup } from "@semi/ui";

<Checkbox checked={auto} onChange={setAuto} label="Tự động in khi rảnh" description="Máy nhận job tiếp theo" />
<Switch checked={notify} onChange={setNotify} label="Thông báo khi in xong" />
<RadioGroup label="Gói dịch vụ" value={plan} onChange={setPlan}
  options={[{ value: "free", label: "Free" }, { value: "pro", label: "Pro", description: "Tối đa 10 máy" }]} />`,
  },
  tabs: {
    page: "primitives",
    title: "Tabs",
    when: "Switching views inside a card or page section (←/→, Home, End); segmented for compact toggles.",
    code: `import { Tabs } from "@semi/ui";

<Tabs value={tab} onChange={setTab} items={[
  { key: "overview", label: "Tổng quan", icon: "gauge", content: <Overview /> },
  { key: "activity", label: "Hoạt động", count: 12, content: <Activity /> },
]} />
<Tabs variant="segmented" value={range} onChange={setRange} items={[{ key: "day", label: "Ngày" }, { key: "week", label: "Tuần" }]} />`,
  },
  overlay: {
    page: "primitives",
    title: "Tooltip · Menu · Drawer · Toast",
    when: "Hints on icon buttons, overflow actions, side sheets for secondary tasks, and transient feedback.",
    code: `import { Tooltip, Menu, Drawer, toast } from "@semi/ui";

<Tooltip content="Làm mới"><Button iconOnly icon="refresh" aria-label="Làm mới" /></Tooltip>
<Menu items={[{ label: "Đổi tên", icon: "edit", onSelect: rename }, { label: "Xoá", icon: "trash", danger: true, onSelect: remove }]} />
<Drawer open={open} onClose={close} title="Bộ lọc">…</Drawer>
toast({ tone: "success", title: "Đã lưu" });   // <ToastHost /> mounted once in the root layout`,
  },
  alert: {
    page: "primitives",
    title: "Alert · Progress",
    when: "Callouts inside a page (status tint + icon + optional action) and determinate / indeterminate progress.",
    code: `import { Alert, Progress, Button } from "@semi/ui";

<Alert tone="warning" title="Sắp hết nhựa" action={<Button size="sm">Đặt thêm</Button>}>Cuộn PLA còn 80 g.</Alert>
<Progress label="Tiến độ in" value={64} showValue />
<Progress label="Đang xử lý" />   {/* no value = indeterminate */}`,
  },
  table: {
    page: "primitives",
    title: "Table · Avatar · Badge",
    when: "Rows compared column by column; cells stay on one line and the table scrolls sideways on phones.",
    code: `import { Table, THead, TBody, TR, TH, TD, Avatar, Badge } from "@semi/ui";

<Table>
  <THead><TR><TH>Mã đơn</TH><TH>Khách hàng</TH><TH align="right">Tổng</TH></TR></THead>
  <TBody>
    {rows.map((r) => (
      <TR key={r.id} onClick={() => open(r)}>
        <TD>{r.code}</TD>
        <TD><Avatar name={r.customer} size="sm" /> {r.customer}</TD>
        <TD numeric>{r.total}</TD>
      </TR>
    ))}
  </TBody>
</Table>`,
  },
  empty: {
    page: "primitives",
    title: "EmptyState",
    when: "An empty list or first run: icon, one line, optional description and the action that adds the first item.",
    code: `import { EmptyState, Button } from "@semi/ui";

<EmptyState icon="printer" title="Chưa có máy in nào" description="Thêm máy in đầu tiên để theo dõi tiến độ."
  action={<Button variant="primary" icon="plus" onClick={add}>Thêm máy in</Button>} />`,
  },
  locale: {
    page: "primitives",
    title: "Locale (SemiLocaleProvider)",
    when: "UI strings of the shared components: Vietnamese by default, English shipped, any key overridable.",
    code: `import { SemiLocaleProvider, en } from "@semi/ui";

<SemiLocaleProvider locale={en}>{children}</SemiLocaleProvider>
<SemiLocaleProvider locale={{ close: "Đóng lại" }}>…</SemiLocaleProvider>   // partial override`,
  },

  // ── patterns ──
  "page-tabs": {
    page: "patterns",
    title: "PageTabsTitle · PageActions",
    when: "2–4 sibling pages under one title; the page's buttons go to the header slot.",
    code: `import { PageTabsTitle, PageActions, Button } from "@semi/ui";

<PageTabsTitle tabs={[{ key: "printers", label: "Máy in" }, { key: "jobs", label: "Job in" }]} value={view} onChange={setView} />
<PageActions><Button variant="primary" iconOnly icon="plus" aria-label="Thêm máy in" /></PageActions>`,
  },
  "app-header": {
    page: "patterns",
    title: "AppHeader (tool apps)",
    when: "Top bar of a stand-alone tool / 3D app: logo + title go home, one primary action on the right.",
    code: `import { AppHeader, headerPrimary } from "@semi/ui";

<AppHeader title="Phối màu" productName="3D Noobs" logoIcon="palette" homeHref="/">
  <button className={headerPrimary(ready)} onClick={done}>Xong</button>
</AppHeader>`,
  },
  "side-panel": {
    page: "patterns",
    title: "SidePanel",
    when: "The left settings panel of a tool app (320px), collapsing to a thin rail.",
    code: `import { SidePanel, SidePanelToggle } from "@semi/ui";

<div className="h-full flex">
  <SidePanel collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)}>
    <SidePanelToggle onClick={() => setCollapsed(true)} /> …settings…
  </SidePanel>
  <div className="flex-1 min-w-0">…canvas…</div>
</div>`,
  },
  markdown: {
    page: "patterns",
    title: "Markdown (AI text)",
    when: "Any AI-written text: paragraphs, lists, bold, code and links (ExternalLink); never raw strings.",
    code: `import { Markdown } from "@semi/ui";

<Markdown text={answer} />`,
  },
  "layout-skeletons": {
    page: "patterns",
    title: "Skeletons",
    when: "Page-level loading shapes that match the layout being loaded.",
    code: `import { Loading, PageSkeleton, SkeletonGrid } from "@semi/ui";

<Loading><PageSkeleton /></Loading>
<SkeletonGrid count={3} className="grid grid-cols-1 md:grid-cols-3 gap-3" />`,
  },

  // ── chat ──
  "ai-chat": {
    page: "chat",
    title: "AIChat (workspace panel)",
    when: "Every AI conversation. UI only: the app keeps the messages, streams the answer and owns the provider / model lists.",
    code: `import { AIChat, ChatIntro, ChatSuggestions, ChatSuggestion, ChatModelPicker, type ChatItem } from "@semi/ui";

<div className="relative">   {/* the panel fills the nearest positioned parent; placement="screen" covers the page */}
  <AIChat
    title="Trợ lý AI"
    shown={open}
    onClose={() => setOpen(false)}
    messages={messages}            // ChatItem[]: { id, role, content (Markdown), pending?, error?, failed? }
    busy={streaming}
    onSend={ask}
    onStop={abort}
    onRetry={retry}
    onNewChat={reset}
    toolbar={
      <ChatModelPicker
        providers={providers}      // [{ value, label, icon: <logo /> }]: shown when more than one
        provider={provider} onProviderChange={setProvider}
        models={models} model={model} onModelChange={setModel}
        efforts={efforts} effort={effort} onEffortChange={setEffort}   // only when the model takes one
      />
    }
    empty={
      <>
        <ChatIntro title="Hỏi gì về bản in?">Trợ lý biết máy in và cài đặt của bạn.</ChatIntro>
        <ChatSuggestions label="Gợi ý">
          <ChatSuggestion onClick={() => ask("Vì sao PETG bị kéo sợi?")}>Vì sao PETG bị kéo sợi?</ChatSuggestion>
        </ChatSuggestions>
      </>
    }
  />
</div>`,
  },
  "chat-parts": {
    page: "chat",
    title: "Parts",
    when: "Compose a custom chat (e.g. inside a settings tab) from the same parts AIChat uses.",
    code: `import { ChatPanel, ChatView, ChatComposer, UserMessage, AssistantMessage, ChatAnswer, ChatError,
  ChatThinking, ChatCopyButton, Markdown } from "@semi/ui";

<ChatPanel title="Trợ lý AI" onClose={close} onNewChat={messages.length ? reset : undefined}>
  <ChatView busy={busy} empty={!messages.length}
    composer={<ChatComposer value={text} onChange={setText} onSend={ask} busy={busy} onStop={abort} toolbar={picker} />}>
    <UserMessage>Vì sao bản in bị kéo sợi?</UserMessage>
    <AssistantMessage busy={busy} actions={<ChatCopyButton text={answer} />}>
      {answer ? <Markdown text={answer} /> : <ChatThinking />}
    </AssistantMessage>
    <ChatError onRetry={retry}>Không kết nối được tới model.</ChatError>
  </ChatView>
</ChatPanel>`,
  },
};
