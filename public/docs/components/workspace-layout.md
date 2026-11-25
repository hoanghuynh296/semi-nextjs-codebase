# Workspace layout

Page type “workspace” (L12): a control panel on the left (segmented tabs, back + tool name, sections with a text-overline label and a counter like “3/8”, drop zones, steppers, a message box) with the main action pinned at its bottom, and the result on the right. Phones stack the panel above the result with the action at the bottom of the screen.

## When to use

- A tool where the user sets inputs and sees what they produce: a quote request and its comparison, a generator, an import with a preview, a print job.
- A record being composed step by step, with one main action at the end (Gửi hỏi giá, Tạo, In).

## Use something else when

| Need | Use |
|---|---|
| A list of records with search and filters | StickyContextBar + a list or DataTable |
| A form that saves fields of one record | a form page with FormActions |
| Settings that apply to a stand-alone tool app's canvas | SidePanel |

## Import

```tsx
import { WorkspaceLayout, WorkspaceHeader, WorkspaceSection } from "@semi/ui";
```

## Examples

### Quote request

Tabs, back + name, sections with counters, steppers, a drop zone, a message with @ and / hints; the comparison on the right. Below lg the panel stacks on top and its action stays at the bottom of the screen (not inside this docs frame, which scrolls sideways: sticky needs a page that scrolls vertically).

```tsx
import { useState } from "react";
import { Badge, Button, DropZone, HintTextarea, Stepper, ToggleGroup, WorkspaceHeader, WorkspaceLayout, WorkspaceSection } from "@semi/ui";

const LINES = [
  { id: "l1", name: "Tiêu đen 500 g/l", spec: "Độ ẩm ≤ 13%, sạch 99,5%" },
  { id: "l2", name: "Quế chẻ", spec: "Dài 30–40 cm, dầu ≥ 3%" },
];
const QUOTES = [
  { supplier: "Gia vị Tây Nguyên", days: 12, prices: [4120, 2890], best: [false, true] },
  { supplier: "HTX Tiêu Chư Sê", days: 15, prices: [4090, 2950], best: [true, false] },
];
const SUPPLIERS = [
  { value: "@taynguyen", label: "Gia vị Tây Nguyên", hint: "Đắk Lắk" },
  { value: "@chuse", label: "HTX Tiêu Chư Sê", hint: "Gia Lai" },
  { value: "@yenbai", label: "Hương Quế Yên Bái", hint: "Yên Bái" },
];
const TEMPLATES = [{ value: "/fob", label: "Hỏi giá FOB", hint: "Giá FOB Hải Phòng, hạn giao" }];
const usd = (n: number) => `${n.toLocaleString("vi-VN")} USD`;

export default function WorkspaceRequest() {
  const [tab, setTab] = useState<"lines" | "suppliers" | "terms">("lines");
  const [qty, setQty] = useState([12, 4]);
  const [msg, setMsg] = useState("Chào anh chị, bên em cần báo giá FOB Hải Phòng, giao trước 15/12.");
  return (
    <WorkspaceLayout
      header={
        <WorkspaceHeader
          backHref="/components/workspace-layout/"
          backLabel="Về Mua hàng"
          title="YC-014 Tiêu đen cho Seoul Spice"
          description="Cần hàng trước 15/12 · Trần Thu Hà"
          headingLevel={2}
          tabs={
            <ToggleGroup
              label="Phần của yêu cầu"
              value={[tab]}
              onChange={(v) => v[0] && setTab(v[0])}
              options={[
                { key: "lines", label: "Mặt hàng" },
                { key: "suppliers", label: "Nhà cung cấp" },
                { key: "terms", label: "Điều khoản" },
              ]}
              className="w-full [&>button]:flex-1"
            />
          }
        />
      }
      panel={
        <>
          <WorkspaceSection label="Mặt hàng" count={LINES.length} max={8} action={<Button size="sm" variant="ghost" icon="plus">Thêm</Button>}>
            {LINES.map((l, i) => (
              <div key={l.id} className="rounded-card bg-card p-3 flex flex-col gap-2">
                <div className="min-w-0">
                  <div className="text-ui font-semibold text-strong">{l.name}</div>
                  <div className="text-ui text-muted truncate">{l.spec}</div>
                </div>
                <Stepper label={`số tấn ${l.name}`} unit="tấn" min={1} value={qty[i]} onChange={(v) => setQty(qty.map((q, j) => (j === i ? v : q)))} />
              </div>
            ))}
          </WorkspaceSection>
          <WorkspaceSection label="Quy cách đính kèm" count={0} max={5}>
            <DropZone title="Kéo tệp quy cách vào đây" hint="PDF, ảnh mẫu hoặc Excel, tối đa 10 MB" accept={[".pdf", "image/*", ".xlsx"]} maxSize={10_000_000} onAdd={() => undefined} />
          </WorkspaceSection>
          <WorkspaceSection label="Lời nhắn">
            <HintTextarea
              label="Lời nhắn gửi nhà cung cấp"
              rows={3}
              value={msg}
              onChange={setMsg}
              triggers={[
                { char: "@", hint: "để nhắc nhà cung cấp", items: SUPPLIERS.map((s) => ({ ...s, icon: "truck" })) },
                { char: "/", hint: "để chèn mẫu", items: TEMPLATES.map((t) => ({ ...t, icon: "fileText" })) },
              ]}
            />
          </WorkspaceSection>
        </>
      }
      action={
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
          <Button>Lưu nháp</Button>
          <Button variant="primary" icon="send" fullWidth>
            Gửi hỏi giá (2)
          </Button>
        </div>
      }
      result={
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="flex-1 text-lead font-title font-semibold text-strong">So sánh báo giá</h3>
            <span className="text-ui text-muted">2/2 nhà cung cấp đã trả lời</span>
          </div>
          <div className="grid md:grid-cols-2 gap-group">
            {QUOTES.map((q) => (
              <article key={q.supplier} className="rounded-card bg-card p-card flex flex-col gap-3">
                <div className="min-w-0">
                  <div className="text-ui font-semibold text-strong truncate">{q.supplier}</div>
                  <div className="text-ui text-muted">FOB · {q.days} ngày</div>
                </div>
                <div className="flex flex-col divide-y divide-divider">
                  {LINES.map((l, i) => (
                    <div key={l.id} className="flex items-center gap-2 py-2">
                      <span className="flex-1 text-ui text-body">{l.name}</span>
                      {q.best[i] && (
                        <Badge tone="emerald" size="sm">
                          Tốt nhất
                        </Badge>
                      )}
                      <span className="text-ui tabular-nums text-strong">{usd(q.prices[i])}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-ui text-muted">Tổng ({qty[0] + qty[1]} tấn)</span>
                  <span className="text-lead font-figure font-semibold text-strong tabular-nums">{usd(q.prices[0] * qty[0] + q.prices[1] * qty[1])}</span>
                </div>
              </article>
            ))}
          </div>
        </>
      }
    />
  );
}
```

### In the app shell

AppShell with the phone tab bar (mobileNav="tabs"): the main action stays above the tab bar. Full screen at /demo/workspace/.

```tsx
"use client";

import { useState } from "react";
import { AppShell, Button, Stepper, WorkspaceHeader, WorkspaceLayout, WorkspaceSection } from "@semi/ui";

const LINES = ["Tiêu đen 500 g/l", "Quế chẻ", "Hồi khô", "Thảo quả", "Gừng sấy"];

// In the app's shell: AppShell (here with the phone tab bar, mobileNav="tabs") renders in layout.tsx, the workspace in
// the page. On a phone the main action stays above the tab bar while the panel is in view.
export default function WorkspaceInShell() {
  const [qty, setQty] = useState(LINES.map(() => 2));
  return (
    <AppShell
      productName="Sales Hub"
      logoIcon="bag"
      mobileNav="tabs"
      mobileTabIds={["inbox", "purchasing", "suppliers"]}
      activeId="purchasing"
      sections={[
        {
          items: [
            { id: "inbox", label: "Hộp thư", icon: "mail", href: "/demo/workspace/" },
            { id: "purchasing", label: "Mua hàng", icon: "bag", href: "/demo/workspace/" },
            { id: "suppliers", label: "Nhà cung cấp", icon: "truck", href: "/demo/workspace/" },
          ],
        },
      ]}
    >
      <WorkspaceLayout
        header={<WorkspaceHeader backHref="/demo/workspace/" backLabel="Về Mua hàng" title="YC-014 Tiêu đen cho Seoul Spice" description="Cần hàng trước 15/12" />}
        panel={
          <WorkspaceSection label="Mặt hàng" count={LINES.length} max={8}>
            {LINES.map((name, i) => (
              <div key={name} className="rounded-card bg-card p-3 flex flex-col gap-2">
                <div className="text-ui font-semibold text-strong">{name}</div>
                <Stepper label={`số tấn ${name}`} unit="tấn" min={1} value={qty[i]} onChange={(v) => setQty(qty.map((q, j) => (j === i ? v : q)))} />
              </div>
            ))}
          </WorkspaceSection>
        }
        action={
          <Button variant="primary" icon="send" fullWidth>
            Gửi hỏi giá
          </Button>
        }
        result={<div className="rounded-card bg-card p-card text-ui text-muted min-h-60">Báo giá của nhà cung cấp hiện ở đây khi về.</div>}
      />
    </AppShell>
  );
}
```

### Minimal

No header: just sections, the action and the result.

```tsx
import { useState } from "react";
import { Button, Stepper, WorkspaceLayout, WorkspaceSection } from "@semi/ui";

export default function WorkspaceMinimal() {
  const [copies, setCopies] = useState(2);
  return (
    <WorkspaceLayout
      panel={
        <WorkspaceSection label="Số bản" count={copies} max={10}>
          <Stepper label="số bản in" value={copies} min={1} max={10} onChange={setCopies} />
        </WorkspaceSection>
      }
      action={
        <Button variant="primary" icon="printer" fullWidth>
          In {copies} bản
        </Button>
      }
      result={<div className="rounded-card bg-card p-card text-ui text-muted min-h-40">Bản xem trước của nhãn hiện ở đây.</div>}
    />
  );
}
```

## API

### WorkspaceLayout

| Prop | Type | Default | Description |
|---|---|---|---|
| `header` | `React.ReactNode` |  | Top of the panel: a `WorkspaceHeader` (back + tool name), segmented tabs above it when the tool has parts. |
| `panel` * | `React.ReactNode` |  | The controls: `WorkspaceSection`s. Scrolls inside the panel on `lg+`. |
| `action` * | `React.ReactNode` |  | The main action (one primary Button, `fullWidth`, a secondary beside it at most). Pinned to the panel's bottom. |
| `result` * | `React.ReactNode` |  | What the controls produce: a preview, a comparison, a list. Its headings start at h2 (the tool name is the h1). |
| `panelLabel` | `string` |  | Name of the panel region (default "Bảng điều khiển"). |
| `resultLabel` | `string` |  | Name of the result region (default "Kết quả"). |
| `className` | `string` |  |  |

### WorkspaceHeader

Back + tool name (+ one meta line) at the top of the workspace panel; `tabs` (a `ToggleGroup`) sit above it.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` * | `React.ReactNode` |  | The tool or record name ("YC-014 Tiêu đen cho Seoul Spice"). The page's h1 by default. |
| `description` | `React.ReactNode` |  | One muted line under the title (due date, owner). |
| `backHref` | `string` |  | Where the round back button goes (a `next/link`). |
| `onBack` | `() => void` |  | Back without a URL (closes the tool); ignored when `backHref` is set. |
| `backLabel` | `string` |  | Accessible name of the back button: where it goes ("Về Mua hàng"). Default "Quay lại". |
| `tabs` | `React.ReactNode` |  | Segmented tabs of the tool's parts, full width above the title (`<ToggleGroup className="w-full" …/>`). |
| `headingLevel` | `1 \| 2` | `1` | 1 (default): the tool name is the page title. 2 when the page already has an h1. |

### WorkspaceSection

A section of the workspace panel: a `text-overline` label, a counter ("3/8") and an optional action on its right.

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` * | `string` |  | Section name in sentence case ("Mặt hàng"); shown in `text-overline`. |
| `count` | `number` |  | How many items the section holds. |
| `max` | `number` |  | The limit, shown as "count/max". |
| `action` | `React.ReactNode` |  | A small text button on the right ("Thêm"). |
| `children` * | `React.ReactNode` |  |  |
| `className` | `string` |  |  |

## Accessibility

- Two named regions (panel and result: “Bảng điều khiển”, “Kết quả”, override with panelLabel / resultLabel); each WorkspaceSection is a group named by its label.
- WorkspaceHeader's title is the page h1 by default; headings in the result start at h2. The back button is a link named by backLabel (where it goes).

## Notes

- The panel is 380px wide on lg+, sticky under the top of the scrolling area, and scrolls inside; the result scrolls with the page. On phones the action sticks at `bottom: var(--semi-bottom-bar, 0px)`: AppShell sets it to the tab bar's height in tabs mode, so the action sits above MobileTabBar.
- One primary in the action bar (fullWidth), a secondary beside it at most (Lưu nháp). Section labels are the only uppercase text (text-overline, written in sentence case in code).
- Do not put WorkspaceLayout inside an overflow-x-auto / overflow-hidden box: that box becomes the sticky container and the phone action no longer stays on screen.

<!-- GENERATED by scripts/build-docs.mjs from examples/workspace-layout/ and the types in src/ -->
