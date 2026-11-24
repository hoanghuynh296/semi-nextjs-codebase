# Pill tabs

Default section tabs for pages with 5+ sections or sections with icons (settings-like pages): no track, h30 round pills with 16px icons and 12px/600 labels, and one item-hover pill that slides to the active tab in 300ms ease-out.

## When to use

- 5+ sections of one page, or sections with icons (Cấu hình: Hộp thư, Nhóm thư, Nguồn khách, Mặt hàng, Mẫu thư, Data Hub, Doanh nghiệp, Người dùng).
- Section switching that needs URL state (?tab=) or an unsaved-changes guard (onBeforeChange).

## Use something else when

| Need | Use |
|---|---|
| 2–5 filter values shown in full, often with counts | SegmentedControl |
| 2–4 top-level views of a discovery or reading page | TextTabs |
| Filters of a list (status, owner, date) | FilterChipRow |
| Sections of one record inside a card or dialog | Tabs |

## Import

```tsx
import { PillTabs, useTabParam } from "@semi/ui";
```

## Examples

### Settings sections with icons

```tsx
"use client";

import { useState } from "react";
import { Card, PillTabs, type PillTabItem } from "@semi/ui";

const SECTIONS = [
  { key: "mail", label: "Hộp thư", icon: "mail", summary: "Kết nối IMAP / SMTP và chu kỳ đồng bộ thư đến." },
  { key: "groups", label: "Nhóm thư", icon: "layers", summary: "Quy tắc tự động gán thư theo nhà cung cấp và từ khoá." },
  { key: "sources", label: "Nguồn khách", icon: "filter", summary: "Kênh tiếp nhận yêu cầu báo giá từ hội chợ, web và đại lý." },
  { key: "items", label: "Mặt hàng", icon: "tag", summary: "Danh mục nguyên liệu, quy cách đóng gói và đơn vị tính." },
  { key: "templates", label: "Mẫu thư", icon: "fileText", summary: "Mẫu hỏi giá và phản hồi nhanh có biến trộn." },
  { key: "datahub", label: "Data Hub", icon: "database", summary: "Khoá kết nối đồng bộ danh mục với hệ thống trung tâm." },
  { key: "company", label: "Doanh nghiệp", icon: "settings", summary: "Tên pháp nhân, mã số thuế và chữ ký mặc định." },
  { key: "users", label: "Người dùng", icon: "user", summary: "Thành viên phòng mua hàng và quyền phê duyệt." },
] as const satisfies readonly (PillTabItem & { summary: string })[];

export default function PillTabsSections() {
  const [section, setSection] = useState<(typeof SECTIONS)[number]["key"]>("mail");
  const current = SECTIONS.find((s) => s.key === section) ?? SECTIONS[0];

  return (
    <PillTabs
      label="Cấu hình"
      value={section}
      onChange={(next) => setSection(next)}
      items={[...SECTIONS]}
    >
      <Card className="flex flex-col gap-stack">
        <h2 className="text-section text-strong">{current.label}</h2>
        <p className="text-ui text-muted">{current.summary}</p>
      </Card>
    </PillTabs>
  );
}
```

### URL ?tab=, manual activation and guard

```tsx
"use client";

import { useState } from "react";
import { Card, PillTabs, Switch, useTabParam } from "@semi/ui";

const TABS = [
  { key: "general", label: "Chung", icon: "settings" },
  { key: "notifications", label: "Thông báo", icon: "bell" },
  { key: "members", label: "Thành viên", icon: "users" },
  { key: "audit", label: "Nhật ký", icon: "clock" },
] as const;

const KEYS = TABS.map((t) => t.key);

export default function PillTabsGuarded() {
  const [tab, setTab] = useTabParam<(typeof TABS)[number]["key"]>("general", { param: "section", values: KEYS });
  const [dirty, setDirty] = useState(false);
  const [manual, setManual] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-group">
      <div className="flex flex-wrap items-center gap-group">
        <Switch checked={dirty} onChange={(v) => (setDirty(v), setBlocked(null))} label="Có thay đổi chưa lưu" />
        <Switch checked={manual} onChange={setManual} label="Chuyển bằng Enter / Space (manual)" />
      </div>
      <PillTabs
        label="Cấu hình khu vực"
        value={tab}
        onChange={(next, meta) => {
          setBlocked(null);
          setTab(next, meta);
        }}
        onBeforeChange={(next) => {
          if (dirty) {
            setBlocked(TABS.find((t) => t.key === next)?.label ?? next);
            return false;
          }
          return true;
        }}
        activation={manual ? "manual" : "automatic"}
        items={[...TABS]}
      >
        <Card className="flex flex-col gap-2">
          <p className="text-ui text-strong">Mục đang mở: {TABS.find((t) => t.key === tab)?.label}</p>
          <p className="text-ui text-muted">
            {blocked
              ? `Đã chặn chuyển sang "${blocked}" vì còn thay đổi chưa lưu.`
              : "Phím mũi tên cập nhật ?section= bằng replaceState nên không sinh thêm lịch sử mỗi lần bấm."}
          </p>
        </Card>
      </PillTabs>
    </div>
  );
}
```

### When to use which: all three side by side

```tsx
"use client";

import { useState } from "react";
import { PillTabs, SegmentedControl, Separator, TextTabs } from "@semi/ui";

export default function TabsWhenToUseWhich() {
  const [section, setSection] = useState<"mail" | "groups" | "sources" | "items" | "templates" | "users">("mail");
  const [status, setStatus] = useState<"all" | "open" | "quoting" | "done">("open");
  const [view, setView] = useState<"discover" | "templates" | "collections">("discover");

  return (
    <div className="flex flex-col gap-section">
      <div data-density-view="" className="flex flex-col gap-3">
        <div className="text-overline text-muted">PillTabs · 5+ mục hoặc có biểu tượng</div>
        <PillTabs
          label="Cấu hình hệ thống"
          value={section}
          onChange={(v) => setSection(v)}
          panelClassName="pt-3"
          items={[
            { key: "mail", label: "Hộp thư", icon: "mail" },
            { key: "groups", label: "Nhóm thư", icon: "layers" },
            { key: "sources", label: "Nguồn khách", icon: "filter" },
            { key: "items", label: "Mặt hàng", icon: "tag" },
            { key: "templates", label: "Mẫu thư", icon: "fileText" },
            { key: "users", label: "Người dùng", icon: "user" },
          ]}
        >
          <p className="text-ui text-muted">Cấu hình máy chủ thư và chu kỳ đồng bộ tự động mỗi 5 phút.</p>
        </PillTabs>
      </div>

      <Separator />

      <div data-density-view="" className="flex flex-col gap-3">
        <div className="text-overline text-muted">SegmentedControl · 2–5 giá trị lọc</div>
        <div>
          <SegmentedControl
            label="Trạng thái yêu cầu"
            value={status}
            onChange={(v) => setStatus(v)}
            options={[
              { key: "all", label: "Tất cả", count: 128 },
              { key: "open", label: "Đang mở", count: 24 },
              { key: "quoting", label: "Đang báo giá", count: 9 },
              { key: "done", label: "Đã chốt", count: 95 },
            ]}
          />
        </div>
        <p className="text-ui text-muted">Hiển thị các yêu cầu ở trạng thái đã chọn ngay trong danh sách hiện tại.</p>
      </div>

      <Separator />

      <div data-density-view="" className="flex flex-col gap-3">
        <div className="text-overline text-muted">TextTabs · 2–4 góc nhìn lớn</div>
        <TextTabs
          label="Thư viện mẫu"
          heading={false}
          className="mb-0"
          value={view}
          onChange={(v) => setView(v)}
          items={[
            { key: "discover", label: "Khám phá" },
            { key: "templates", label: "Mẫu sẵn" },
            { key: "collections", label: "Bộ sưu tập" },
          ]}
        >
          <p className="text-lead text-muted">Tổng hợp các mẫu thiết kế được cộng đồng in nhiều nhất tuần này.</p>
        </TextTabs>
      </div>
    </div>
  );
}
```

## API

### PillTabs

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` * | `PillTabItem<T>[]` |  |  |
| `value` * | `T` |  |  |
| `onChange` | `(key: T, meta: TabChangeMeta) => void` |  | Called when the active tab changes; receives `{ via }` so URL state hooks can replace on arrow keys. |
| `onBeforeChange` | `TabBeforeChange<T>` |  | Guard run before switching (button AND href tabs); return or resolve `false` to stay on the current tab. |
| `activation` | `'automatic' \| 'manual'` | `"automatic"` | `"automatic"` (default) switches as arrows move; `"manual"` moves focus with arrows and commits on Enter / Space. |
| `label` * | `string` |  | Accessible name of the tab list ("Cấu hình"). |
| `idPrefix` | `string` |  | Optional id prefix when the page renders its own `role="tabpanel"` below: tab `${idPrefix}-tab-${key}` controls panel `${idPrefix}-panel`. Omit when passing `children` or item `content` (ids are generated automatically). |
| `children` | `React.ReactNode` |  | Active panel content; omit to use per-item `content` or render the panel yourself. |
| `className` | `string` |  |  |
| `panelClassName` | `string` | `"pt-7"` |  |

## Accessibility

- WAI-ARIA tablist / tab / tabpanel with id, aria-controls and aria-labelledby; roving tabindex; ←/→, Home and End.
- activation="manual" moves focus with arrows and switches on Enter or Space; default "automatic" switches button tabs on arrow keys once onBeforeChange approves.
- Overflowing rows scroll sideways with no scrollbar, keep the active tab in view and show a 2px edge cue; sliding and fades turn off under prefers-reduced-motion.

## Notes

- Keep the section in the URL with `const [tab, setTab] = useTabParam("mail", { values })` (or `useFilterParams().setParams({ tab }, "replace")`): arrow keys replace the entry so they never stack history entries.
- Pass `idPrefix` when the page renders its own `role="tabpanel"` below (`${idPrefix}-panel` labelled by `${idPrefix}-tab-${key}`).
- When to use which: PillTabs for 5+ sections or sections with icons · SegmentedControl for 2–5 filter values shown in full with counts · TextTabs for 2–4 top-level views of a discovery or reading page · FilterChipRow for filters.

<!-- GENERATED by scripts/build-docs.mjs from examples/pill-tabs/ and the types in src/ -->
