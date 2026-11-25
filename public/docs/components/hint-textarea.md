# Hint textarea

A text area that says what it can do (L15): a hint row under the text (“Gõ @ để nhắc nhà cung cấp · Gõ / để chèn mẫu”) and a suggestion list while the word at the caret starts with a trigger; the chosen item is inserted with a space after it.

## When to use

- A message or note where people mention a record (@ a supplier, a colleague) or insert a template or command (/).
- A prompt box of a workspace or an AI tool with a few shortcuts.

## Use something else when

| Need | Use |
|---|---|
| Pick one value from a list | CustomCombobox |
| A plain multi-line field | Field + textarea (FIELD_TEXTAREA) |
| An AI chat composer | ChatComposer |

## Import

```tsx
import { HintTextarea, type HintToken, type HintTrigger } from "@semi/ui";
```

## Examples

### Mentions and templates

Type @ or / at the start of a word. The suggestion list portals at z-popover and flips above when there is no room below.

```tsx
import { useState } from "react";
import { HintTextarea } from "@semi/ui";

export default function HintTextareaBasic() {
  const [msg, setMsg] = useState("Chào anh chị, bên em cần báo giá cho ");
  return (
    <div className="max-w-md">
      <HintTextarea
        label="Lời nhắn gửi nhà cung cấp"
        value={msg}
        onChange={setMsg}
        triggers={[
          {
            char: "@",
            hint: "để nhắc nhà cung cấp",
            items: [
              { value: "@taynguyen", label: "Gia vị Tây Nguyên", hint: "Đắk Lắk", icon: "truck" },
              { value: "@chuse", label: "HTX Tiêu Chư Sê", hint: "Gia Lai", icon: "truck" },
              { value: "@yenbai", label: "Hương Quế Yên Bái", hint: "Yên Bái", icon: "truck" },
            ],
          },
          {
            char: "/",
            hint: "để chèn mẫu",
            items: [
              { value: "/fob", label: "Hỏi giá FOB", hint: "Giá FOB Hải Phòng, hạn giao", icon: "fileText" },
              { value: "/mau", label: "Xin mẫu", hint: "Gửi 1 kg mẫu trước khi chốt", icon: "fileText" },
            ],
          },
        ]}
      />
    </div>
  );
}
```

### Plain-text snippets and reply box

value (or insert) replaces the trigger word with a token (@s1) or plain text (a snippet); resizable auto-grows from 3 rows to 50% and adds a top resize edge from md.

```tsx
"use client";

import { useState } from "react";
import { HintTextarea, type HintToken } from "@semi/ui";

const SNIPPETS: HintToken[] = [
  {
    value: "/vat",
    insert: "Giá chưa gồm VAT 8%, giao tại kho Bình Dương.",
    label: "Giá chưa gồm VAT",
    hint: "Điều khoản thuế và giao hàng tiêu chuẩn",
    icon: "fileText",
  },
  {
    value: "/mau",
    insert: "Bên em xin nhận 1 kg mẫu kiểm tra chất lượng trước khi chốt đơn.",
    label: "Xin mẫu kiểm tra",
    hint: "Mẫu 1 kg trước khi đặt lô chính",
    icon: "fileText",
  },
];

export default function HintTextareaSnippets() {
  const [reply, setReply] = useState("");
  return (
    <div className="max-w-lg h-72 flex flex-col justify-end border border-line rounded-card p-card bg-panel">
      <HintTextarea
        label="Trả lời nhà cung cấp"
        placeholder="Nhập trả lời… gõ / để chèn ghi chú nhanh"
        value={reply}
        onChange={setReply}
        autoGrow
        resizable
        triggers={[{ char: "/", hint: "để chèn ghi chú thường dùng", items: SNIPPETS }]}
      />
    </div>
  );
}
```

### In a Field

```tsx
import { useState } from "react";
import { Field, HintTextarea } from "@semi/ui";

export default function HintTextareaField() {
  const [note, setNote] = useState("");
  return (
    <div className="max-w-md">
      <Field label="Ghi chú nội bộ" hint="Người được nhắc sẽ nhận thông báo.">
        <HintTextarea
          rows={3}
          placeholder="Ghi chú cho đồng nghiệp…"
          value={note}
          onChange={setNote}
          triggers={[
            {
              char: "@",
              hint: "để nhắc đồng nghiệp",
              items: [
                { value: "@ha", label: "Trần Thu Hà", hint: "Mua hàng", icon: "user" },
                { value: "@minh", label: "Lê Văn Minh", hint: "Kho", icon: "user" },
              ],
            },
          ]}
        />
      </Field>
    </div>
  );
}
```

## API

### HintTextarea

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` * | `string` |  |  |
| `onChange` * | `(value: string) => void` |  |  |
| `triggers` * | `HintTrigger[]` |  | One per trigger character, each with its suggestions. |
| `label` | `string` |  | Accessible name when there is no surrounding `Field` label. |
| `placeholder` | `string` |  |  |
| `rows` | `number` |  | Visible row count (defaults to 3 when `autoGrow` / `resizable` is set, else 4). |
| `autoGrow` | `boolean` | `false` | Grow with typed text from `rows` (default 3) up to 50% of its container, then scroll inside. |
| `resizable` | `boolean` | `false` | From `md`: adds a top resize edge (`role="separator"`, drag / ArrowUp / ArrowDown ±24px / double-click reset, up to 80% of container). Phones: auto-grow only. |
| `containerRef` | `RefObject<HTMLElement \| null>` |  | Optional bounding container for 50% / 80% height caps (auto-detected when omitted). |
| `disabled` | `boolean` | `false` |  |
| `id` | `string` |  | Set by the surrounding Field when omitted. |
| `className` | `string` |  |  |

## Accessibility

- The textarea is a combobox (role="combobox", aria-expanded, aria-haspopup="listbox", aria-autocomplete="list"): while the list shows, aria-controls names the listbox and aria-activedescendant the current option. ↑ / ↓ move (wrapping), Enter or Tab inserts, Escape closes the list only (not a dialog around it); a polite status says how many suggestions there are.
- Keys typed while an input method composes (Vietnamese Telex; also the keyCode 229 Enter Safari sends to confirm) are left alone. The hint row is the field's description. Named by its Field label or label.

## Notes

- `value` (or `insert` when the inserted text differs from the short key) replaces the trigger word: use it for a token (`@s1`) or plain text (a snippet or canned reply). `showValue` defaults to `false` when `insert` is set, and long values truncate so the label stays readable.
- The suggestion list uses the Popover engine (`useAnchoredPosition` + portal at `z-popover`), so it flips above near the bottom and is never clipped by a scrolling pane or modal.
- Matching ignores case and Vietnamese marks (“tay nguyen” finds “Tây Nguyên”); at most six suggestions show. Telex IME composition (`isComposing`, `keyCode` 229) is verified across Chromium, WebKit and Firefox.

<!-- GENERATED by scripts/build-docs.mjs from examples/hint-textarea/ and the types in src/ -->
