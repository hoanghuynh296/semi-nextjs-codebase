# List + reader

A list card beside a reader card (`ListReaderLayout`) with a sticky one-row `ReaderHeader` (wrapping title left, [•••] then one main action right, top-aligned, identical button height). Each panel scrolls independently on `AppShell page="fixed"` / `Page fixed` with zero hand-tuned `calc()`. Open item lives in `?open=` (`useDetailParam`) and `RouteHeader` breadcrumbs (`useRecordCrumb`); below `lg` the reader replaces the list with a Back button.

## When to use

- Mail inboxes, support tickets, chat queues, notification centres or log viewers where people scan a list and read items side by side.

## Use something else when

| Need | Use |
|---|---|
| A table or card grid where opening a record shows a modal overlay | DetailOverlay + useDetailParam |
| A tool with a 380px control panel and live result | WorkspaceLayout |

## Import

```tsx
import { ListReaderLayout, ReaderHeader } from "@semi/ui";
```

## Examples

### Mail inbox (list + reader)

```tsx
"use client";

import { useState } from "react";
import { Item, ListReaderLayout, ReaderHeader, toast, useDetailParam } from "@semi/ui";

type Thread = { id: string; subject: string; from: string; time: string; preview: string; paragraphs: string[] };

const THREADS: Thread[] = Array.from({ length: 12 }, (_, i) => ({
  id: `m-${i + 1}`,
  subject:
    i === 0
      ? "Báo giá hạt tiêu đen hữu cơ xuất khẩu quý 4 và lịch giao container tại cảng Cát Lái"
      : `Trao đổi đơn hàng #${1040 + i} — xác nhận quy cách đóng gói`,
  from: ["Gia vị Tây Nguyên", "HTX Chư Sê", "Hương Quế Yên Bái", "Nông sản Đắk Lắk"][i % 4],
  time: `${9 + (i % 9)}:${String((i * 13) % 60).padStart(2, "0")}`,
  preview: "Gửi anh chị bảng giá cập nhật theo lô 10 tấn và chứng từ kiểm định mới nhất.",
  paragraphs: Array.from(
    { length: 8 },
    (_, p) =>
      `Đoạn ${p + 1}: Chúng tôi đã kiểm tra tồn kho và lịch tàu dự kiến trong tuần tới. Vui lòng xác nhận số lượng cuối cùng trước 15:00 để bộ phận kho giữ hàng và chuẩn bị hồ sơ xuất xưởng.`,
  ),
}));

export default function ListReaderInboxExample() {
  const detail = useDetailParam("mail");
  const [fallbackId, setFallbackId] = useState<string | null>(THREADS[0].id);
  const openId = detail.openId ?? fallbackId;
  const active = THREADS.find((t) => t.id === openId) ?? null;

  return (
    <div className="h-[440px] flex flex-col min-h-0">
      <ListReaderLayout
        open={active !== null}
        openKey={active?.id}
        recordTitle={active?.subject}
        onClose={() => {
          setFallbackId(null);
          if (detail.openId) detail.close();
        }}
        listLabel="Danh sách thư"
        readerLabel="Nội dung thư"
        list={THREADS.map((item) => (
          <Item
            key={item.id}
            title={item.subject}
            description={`${item.from} · ${item.preview}`}
            meta={item.time}
            selected={active?.id === item.id}
            onClick={() => {
              setFallbackId(item.id);
              detail.open(item.id);
            }}
          />
        ))}
        reader={
          active && (
            <>
              <ReaderHeader
                title={active.subject}
                meta={`${active.from} · ${active.time}`}
                moreActions={[
                  { label: "Chuyển tiếp", icon: "send", onSelect: () => toast({ title: "Chuyển tiếp thư" }) },
                  { label: "Lưu trữ", icon: "folder", onSelect: () => toast({ title: "Đã lưu trữ" }) },
                  { label: "Xoá thư", icon: "trash", danger: true, onSelect: () => toast({ title: "Đã xoá", tone: "danger" }) },
                ]}
                action={{
                  label: "Trả lời",
                  icon: "send",
                  onClick: () => toast({ title: `Trả lời ${active.from}` }),
                }}
              />
              <div className="p-4 sm:p-5 flex flex-col gap-3">
                {active.paragraphs.map((text, idx) => (
                  <p key={idx} className="text-ui text-body">
                    {text}
                  </p>
                ))}
              </div>
            </>
          )
        }
      />
    </div>
  );
}
```

### In AppShell page="fixed"

Full-height list + reader inside AppShell page="fixed" and Page layout="two-column" fixed (zero calc()). Full screen at /demo/list-reader/.

```tsx
"use client";

import { useState } from "react";
import { AppShell, Button, Item, ListReaderLayout, Page, ReaderHeader, SubNav, toast, useDetailParam, type SubNavSection } from "@semi/ui";

type Thread = { id: string; subject: string; from: string; time: string; paragraphs: string[] };

const THREADS: Thread[] = Array.from({ length: 24 }, (_, i) => ({
  id: `m-${i + 1}`,
  subject:
    i === 0
      ? "Báo giá hạt tiêu đen hữu cơ xuất khẩu quý 4 và lịch giao container tại cảng Cát Lái"
      : `Trao đổi đơn hàng #${1040 + i} — xác nhận quy cách đóng gói`,
  from: ["Gia vị Tây Nguyên", "HTX Chư Sê", "Hương Quế Yên Bái", "Nông sản Đắk Lắk"][i % 4],
  time: `${9 + (i % 9)}:${String((i * 13) % 60).padStart(2, "0")}`,
  paragraphs: Array.from(
    { length: 18 },
    (_, p) =>
      `Đoạn ${p + 1}: Chúng tôi đã kiểm tra tồn kho và lịch tàu dự kiến trong tuần tới. Vui lòng xác nhận số lượng cuối cùng trước 15:00 để bộ phận kho giữ hàng và chuẩn bị hồ sơ xuất xưởng.`,
  ),
}));

/** Full-height ListReaderLayout inside AppShell page="fixed" + Page layout="two-column" fixed (zero calc()). */
export default function ListReaderInShell() {
  const detail = useDetailParam("open");
  const [folder, setFolder] = useState("inbox");
  const [fallbackId, setFallbackId] = useState<string | null>(THREADS[0].id);
  const openId = detail.openId ?? fallbackId;
  const active = THREADS.find((t) => t.id === openId) ?? null;

  const sections: SubNavSection[] = [
    {
      label: "Thư mục",
      items: [
        { id: "inbox", label: "Hộp thư đến", icon: "inbox", meta: THREADS.length },
        { id: "sent", label: "Đã gửi", icon: "send" },
        { id: "archive", label: "Lưu trữ", icon: "folder" },
      ],
    },
  ];

  return (
    <AppShell
      page="fixed"
      productName="Sales Hub"
      logoIcon="mail"
      activeId="inbox"
      sections={[
        {
          items: [
            { id: "inbox", label: "Hộp thư", icon: "mail", href: "/demo/list-reader/" },
            { id: "orders", label: "Đơn hàng", icon: "bag", href: "/demo/list-reader/" },
          ],
        },
      ]}
      header={{ account: { name: "Hoàng Huỳnh", detail: "Quản trị" } }}
    >
      <Page
        layout="two-column"
        fixed
        subNav={<SubNav sections={sections} activeId={folder} onSelect={setFolder} label="Thư mục hộp thư" />}
        title="Hộp thư"
        actions={
          <Button variant="inverse" icon="plus" onClick={() => toast.info("Soạn thư mới")}>
            Soạn thư
          </Button>
        }
      >
        <ListReaderLayout
          open={active !== null}
          openKey={active?.id}
          recordTitle={active?.subject}
          onClose={() => {
            setFallbackId(null);
            if (detail.openId) detail.close();
          }}
          listLabel="Danh sách thư"
          readerLabel="Nội dung thư"
          list={THREADS.map((item) => (
            <Item
              key={item.id}
              title={item.subject}
              description={item.from}
              meta={item.time}
              selected={active?.id === item.id}
              onClick={() => {
                setFallbackId(item.id);
                detail.open(item.id);
              }}
            />
          ))}
          reader={
            active && (
              <>
                <ReaderHeader
                  title={active.subject}
                  meta={`${active.from} · ${active.time}`}
                  moreActions={[
                    { label: "Chuyển tiếp", icon: "send", onSelect: () => toast.info("Chuyển tiếp") },
                    { label: "Lưu trữ", icon: "folder", onSelect: () => toast.info("Đã lưu trữ") },
                  ]}
                  action={{ label: "Trả lời", icon: "send", onClick: () => toast.success("Mở khung trả lời") }}
                />
                <div className="p-4 sm:p-5 flex flex-col gap-3">
                  {active.paragraphs.map((p, idx) => (
                    <p key={idx} className="text-ui text-body">
                      {p}
                    </p>
                  ))}
                </div>
              </>
            )
          }
        />
      </Page>
    </AppShell>
  );
}
```

## API

### ListReaderLayout

List + reader layout (#149, #118): a list card on the left and a reader card on the right, each its own independent
scroll container (`overflow-y-auto overscroll-contain`), filling the remaining height of `AppShell page="fixed"` /
`Page fixed` with zero hand-tuned `calc()`. Drive `open` and `onClose` from `useDetailParam()` (`?open=`, Back
closes); pass `recordTitle` to add the open record to `RouteHeader` breadcrumbs via `useRecordCrumb`.
Below `lg`, opening an item swaps the reader in place of the list (with `ReaderHeader`'s Back button).

| Prop | Type | Default | Description |
|---|---|---|---|
| `list` * | `React.ReactNode` |  | List items (e.g. `Item` rows with `selected={openId === id}`). Scrolls inside the list card. |
| `reader` * | `React.ReactNode` |  | The open record (`<ReaderHeader … />` + body). Shown when `open` is true. |
| `open` * | `boolean` |  | True while an item is open (`openId !== null` from `useDetailParam()`). |
| `openKey` | `null \| string` |  | Identifier of the open item (resets reader scroll to top when switching items). |
| `onClose` | `() => void` |  | Close handler (`useDetailParam().close`, wired to `ReaderHeader`'s below-`lg` Back button). |
| `recordTitle` | `null \| string` |  | Open record label pushed into `RouteHeader` breadcrumbs via `useRecordCrumb` while `open` is true. |
| `empty` | `React.ReactNode` |  | Empty state shown in the reader card on `lg+` when no item is open. |
| `listWidth` | `'sm' \| 'md' \| 'lg'` | `"md"` | Width of the list card from `lg`: `"sm"` 288px, `"md"` 352px (default), `"lg"` 400px. |
| `listLabel` | `string` |  | Accessible name of the list region (default locale `listLabel`). |
| `readerLabel` | `string` |  | Accessible name of the reader region (default locale `readerLabel`). |
| `className` | `string` |  |  |

### ReaderHeader

Sticky one-row header of a reader pane (general pattern for mail, tickets, chat; owner decision 2026-11-23):
- Left: below-`lg` Back button (wired automatically from `ListReaderLayout`'s `onClose`) + wrapping `title` (never
  truncated) and optional muted `meta` line underneath.
- Right: `[•••]` `Menu` (all secondary / overflow actions) then one main `action`, top-aligned (`items-start`),
  both buttons at identical `md` (`h-control`) height.
- Stays sticky (`sticky top-0 z-sticky bg-app`) while the reader body scrolls underneath.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` * | `React.ReactNode` |  | Subject or record title on the left; wraps cleanly onto multiple lines. |
| `meta` | `React.ReactNode` |  | Optional quiet meta line directly under the title (sender, timestamp, ticket id). |
| `action` | `ReaderMainAction \| React.ReactNode` |  | The one main action on the right (e.g. Trả lời / Reply), or a custom button element at `size="md"`. |
| `moreActions` | `MenuItem[]` |  | Every other reader action (Chuyển tiếp, Lưu trữ, Đóng ticket, Xoá…) goes into this `•••` Menu. |
| `moreLabel` | `string` |  | Accessible name of the `•••` menu (default locale `moreActions`). |
| `onBack` | `() => void` |  | Back handler below `lg` (defaults to the enclosing `ListReaderLayout`'s `onClose`). |
| `backLabel` | `string` |  | Accessible name of the phone Back button (default locale `backToList`). |
| `headingLevel` | `1 \| 2 \| 3` | `2` | Heading level for the reader title (default 2: the page `h1` sits above). |
| `className` | `string` |  |  |

## Accessibility

- List and reader are named <section> landmarks; the open item marks aria-current="true" on its row; below lg the Back button returns to the list and closes ?open=.
- ReaderHeader keeps [•••] and the main action top-aligned at identical height with every secondary action inside •••.

## Notes

- General pattern for every list + reader (mail, tickets, chat): title on the left (wraps), [•••] plus one main action on the right of the same row; every other action goes into •••.
- Pass `recordTitle` to `ListReaderLayout` so the open record is appended to `RouteHeader` breadcrumbs via `useRecordCrumb`.

<!-- GENERATED by scripts/build-docs.mjs from examples/list-reader/ and the types in src/ -->
