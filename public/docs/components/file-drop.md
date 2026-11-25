# FileDrop

A file picker and dropzone with one row per file (size, upload progress, done, remove / retry on failure) plus DropZone, its compact dashed-tile variant for workspace panels (optional file rows). Controlled: the app owns the list and does the upload.

## When to use

- Choosing or dropping one or more files: CSV import, product photos, invoices, firmware, model files (FileDrop).
- Showing the progress of each upload and letting the user retry or remove a file.
- Attachments in a WorkspaceSection or narrow side panel where the section label carries the count (DropZone).
- Duplicates (same name and size as an item or earlier in the batch) and dropped folders are rejected too: onReject reasons are type, size, directory, duplicate, multiple.

## Use something else when

| Need | Use |
|---|---|
| A single progress bar not tied to files | Progress |
| A long blocking job after the files are sent | startTask + TaskHost |
| An avatar or logo picker | A Button that opens the picker, with the preview next to it |

## Import

```tsx
import { FileDrop, DropZone, type DropZoneProps } from "@semi/ui";
```

## Examples

### Import with validation

accept and maxSize filter files; rejected ones go to onReject, which here feeds the Field error.

```tsx
import { useState } from "react";
import { Field, FileDrop, type FileDropItem, type FileRejection } from "@semi/ui";

// Testing an upload (Playwright): the hidden input has the button's name, so
//   await page.getByLabel("Tệp nhập").and(page.locator('input[type="file"]')).setInputFiles("bang-gia.csv");
// (plain getByLabel("Tệp nhập") matches the button too). Or wait for the `filechooser` event after clicking the button.
export default function FileDropBasic() {
  const [items, setItems] = useState<FileDropItem[]>([
    { id: "seed", name: "bang-gia-2026.xlsx", size: 48_200, status: "done" },
  ]);
  const [error, setError] = useState<string>();

  const upload = (files: File[]) => {
    setError(undefined);
    for (const file of files) {
      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      setItems((cur) => [...cur, { id, name: file.name, size: file.size, status: "uploading", progress: 0 }]);
      let progress = 0;
      const timer = setInterval(() => {
        progress = Math.min(100, progress + 20);
        setItems((cur) => cur.map((i) => (i.id === id ? { ...i, progress, status: progress === 100 ? "done" : "uploading" } : i)));
        if (progress === 100) clearInterval(timer);
      }, 400);
    }
  };
  const WHY = { type: "sai định dạng", size: "quá 10 MB", directory: "là thư mục", duplicate: "đã có", multiple: "thừa" } as const;
  const reject = (rejections: FileRejection[]) => setError(rejections.map((r) => `${r.file.name}: ${WHY[r.reason]}`).join("; "));

  return (
    <Field label="Tệp nhập" error={error}>
      <FileDrop
        multiple
        accept={[".csv", ".xlsx"]}
        maxSize={10_000_000}
        hint="CSV hoặc XLSX, tối đa 10 MB"
        items={items}
        onAdd={upload}
        onReject={reject}
        onRemove={(id) => setItems((cur) => cur.filter((i) => i.id !== id))}
      />
    </Field>
  );
}
```

### Row states

Done, uploading (determinate and indeterminate), error with Retry, and a disabled drop area.

```tsx
import { useState } from "react";
import { FileDrop, type FileDropItem } from "@semi/ui";

const initial: FileDropItem[] = [
  { id: "1", name: "anh-san-pham-01.jpg", size: 2_400_000, status: "done" },
  { id: "2", name: "anh-san-pham-02.jpg", size: 3_100_000, status: "uploading", progress: 45 },
  { id: "3", name: "hoa-don-thang-10.pdf", size: 880_000, status: "uploading" },
  { id: "4", name: "anh-san-pham-03.jpg", size: 5_900_000, status: "error", error: "Mất kết nối, thử lại." },
];

export default function FileDropStates() {
  const [items, setItems] = useState(initial);
  const retry = (id: string) => {
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, status: "uploading", error: undefined } : i)));
    setTimeout(() => setItems((cur) => cur.map((i) => (i.id === id ? { ...i, status: "done" } : i))), 800);
  };
  return (
    <div className="grid gap-4 @2xl:grid-cols-2">
      <FileDrop
        multiple
        accept={["image/*", ".pdf"]}
        hint="Ảnh hoặc PDF"
        items={items}
        onAdd={() => {}}
        onRemove={(id) => setItems((cur) => cur.filter((i) => i.id !== id))}
        onRetry={retry}
      />
      <FileDrop disabled hint="Đang khoá" items={[]} onAdd={() => {}} />
    </div>
  );
}
```

### One file

Without multiple, only the first valid file is added; the rest go to onReject with reason "multiple".

```tsx
import { useState } from "react";
import { Field, FileDrop, type FileDropItem } from "@semi/ui";

export default function FileDropSingle() {
  const [items, setItems] = useState<FileDropItem[]>([]);
  const [error, setError] = useState<string>();
  return (
    <Field label="Hợp đồng (PDF)" error={error}>
      <FileDrop
        accept={["application/pdf", ".pdf"]}
        hint="Một tệp PDF"
        items={items}
        onAdd={(files) => {
          setError(undefined);
          setItems(files.map((f) => ({ id: f.name, name: f.name, size: f.size, status: "done" })));
        }}
        onReject={(r) => setError(r.map((x) => x.file.name).join(", ") + " không được thêm")}
        onRemove={() => setItems([])}
      />
    </Field>
  );
}
```

### Compact workspace drop zone (DropZone)

A light dashed tile on the panel surface for WorkspaceSection attachments, with optional file rows.

```tsx
import { useState } from "react";
import { DropZone, WorkspaceSection, type FileDropItem } from "@semi/ui";

export default function DropZoneBasic() {
  const [items, setItems] = useState<FileDropItem[]>([]);
  return (
    <div className="max-w-sm rounded-panel bg-panel-3 p-4">
      <WorkspaceSection label="Quy cách đính kèm" count={items.length} max={5}>
        <DropZone
          title="Kéo tệp quy cách vào đây"
          hint="PDF, ảnh mẫu hoặc Excel, tối đa 10 MB"
          accept={[".pdf", "image/*", ".xlsx"]}
          maxSize={10_000_000}
          multiple
          items={items}
          onAdd={(files) => setItems((cur) => [...cur, ...files.map((f) => ({ id: `${f.name}-${f.size}`, name: f.name, size: f.size, status: "done" as const }))])}
          onRemove={(id) => setItems((cur) => cur.filter((i) => i.id !== id))}
        />
      </WorkspaceSection>
    </div>
  );
}
```

## API

### FileDrop

Picker + drop area with a row per file (forms, import pages). In a narrow workspace panel use `DropZone`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` * | `FileDropItem[]` |  |  |
| `onAdd` * | `(files: File[]) => void` |  | Only the files that passed every check (see `onReject`); a batch never repeats a name + size. |
| `onReject` | `(rejections: FileRejection[]) => void` |  | Everything not added, with its reason: "type" / "size" (`accept`, `maxSize`), "directory" (a dropped folder), "duplicate" (same name + size as an item or an earlier file of the batch), "multiple" (extra files while `multiple` is off). The app decides whether to show them (e.g. as a Field error). |
| `onRemove` | `(id: string) => void` |  |  |
| `onRetry` | `(id: string) => void` |  |  |
| `accept` | `string[]` |  | MIME types, wildcards ("image/*") or extensions (".csv"). Omit to accept everything. |
| `maxSize` | `number` |  | Largest file in bytes. |
| `multiple` | `boolean` | `false` |  |
| `disabled` | `boolean` | `false` |  |
| `title` | `React.ReactNode` |  | Main line of the drop area (default from the locale). |
| `hint` | `React.ReactNode` |  | Second line, e.g. "CSV or XLSX, up to 10 MB". |
| `id` | `string` |  | Set by the surrounding Field when omitted. |
| `invalid` | `boolean` |  |  |
| `aria-describedby` | `string` |  |  |
| `aria-label` | `string` |  | Names the drop button and the hidden file input (wins over the Field label / title). Without it the input is named by the button (`aria-labelledby`), so `getByLabel(label)` in a test reaches the input too. |
| `className` | `string` |  |  |

### DropZone

Compact FileDrop for a workspace panel (`WorkspaceSection`, L12): a lighter dashed tile on the panel surface (no
field fill), smaller type, the same checks (`accept`, `maxSize`, duplicates), keyboard (Enter / Space opens the
picker) and announcements. `items` is optional.

| Prop | Type | Default | Description |
|---|---|---|---|
| `disabled` | `boolean` |  |  |
| `className` | `string` |  |  |
| `id` | `string` |  | Set by the surrounding Field when omitted. |
| `title` | `React.ReactNode` |  | Main line of the drop area (default from the locale). |
| `aria-describedby` | `string` |  |  |
| `aria-label` | `string` |  | Names the drop button and the hidden file input (wins over the Field label / title). Without it the input is named by the button (`aria-labelledby`), so `getByLabel(label)` in a test reaches the input too. |
| `multiple` | `boolean` |  |  |
| `onAdd` * | `(files: File[]) => void` |  | Only the files that passed every check (see `onReject`); a batch never repeats a name + size. |
| `onReject` | `(rejections: FileRejection[]) => void` |  | Everything not added, with its reason: "type" / "size" (`accept`, `maxSize`), "directory" (a dropped folder), "duplicate" (same name + size as an item or an earlier file of the batch), "multiple" (extra files while `multiple` is off). The app decides whether to show them (e.g. as a Field error). |
| `onRemove` | `(id: string) => void` |  |  |
| `onRetry` | `(id: string) => void` |  |  |
| `accept` | `string[]` |  | MIME types, wildcards ("image/*") or extensions (".csv"). Omit to accept everything. |
| `maxSize` | `number` |  | Largest file in bytes. |
| `hint` | `React.ReactNode` |  | Second line, e.g. "CSV or XLSX, up to 10 MB". |
| `invalid` | `boolean` |  |  |
| `items` | `FileDropItem[]` |  | Rows of the files already added; omit when the panel shows them elsewhere (a count in its section label). |

## Accessibility

- The drop area is a real button: Enter / Space open the file picker, with a visible focus ring.
- Inside a Field it takes the id, aria-describedby and invalid state; its label names the button.
- The hidden file input is named like the button (aria-labelledby, or the aria-label prop), so tests can find it by label: getByLabel(label).and(locator('input[type=file]')).setInputFiles(file). It is hidden, so keyboard and screen readers only meet the button.
- Added, rejected and failed files are announced in a polite live region; each progress bar and remove button names its file.

<!-- GENERATED by scripts/build-docs.mjs from examples/file-drop/ and the types in src/ -->
