# Field, Input, Textarea

Field gives any control a label, a hint and an error, wired for screen readers; `kind` sets the phone keyboard, autofill and Enter key of an email, phone, number, money, URL, search or password field. Input and Textarea are the standard text controls (bg-field, h-field).

## When to use

- Every form control: wrap it in Field instead of writing a <label>.
- Text, email, password, search inside forms; multi-line notes.
- An email, phone, number, money, URL, search or password field: set `kind` so phones show the right keyboard.

## Use something else when

| Need | Use |
|---|---|
| Numbers with a touch keypad | NumberInput |
| A date | DatePicker |
| Pick from a list | CustomSelect or CustomCombobox |
| Filter a list in a toolbar | SearchInput |
| Save / Cancel under the fields, validation timing, warn before leaving | FormActions, useFormValidation, useUnsavedGuard |

## Import

```tsx
import { Field, Input, Textarea } from "@semi/ui";
```

## Examples

### Label and hint

```tsx
import { Field, Input } from "@semi/ui";

export default function FieldBasic() {
  return (
    <Field label="Tên máy in" hint="Hiện trên thẻ và trong thông báo.">
      <Input placeholder="VD: X1 Carbon xưởng A" icon="printer" />
    </Field>
  );
}
```

### Kinds

kind="email | tel | number | money | url | search | password" sets type, inputMode, autoComplete and enterKeyHint.

```tsx
import { Field, Input } from "@semi/ui";

export default function FieldKinds() {
  return (
    <div className="grid gap-stack max-w-md">
      <Field label="Email" kind="email" hint="Bàn phím có @ và dấu chấm; trình duyệt gợi ý email đã lưu.">
        <Input placeholder="ten@congty.vn" />
      </Field>
      <Field label="Số điện thoại" kind="tel">
        <Input placeholder="0901 234 567" />
      </Field>
      <Field label="Số lượng" kind="number">
        <Input defaultValue="12" />
      </Field>
      <Field label="Giá bán (₫)" kind="money">
        <Input defaultValue="250000" />
      </Field>
      <Field label="Website" kind="url">
        <Input placeholder="3dnoobs.vn" />
      </Field>
      <Field label="Mật khẩu" kind="password">
        <Input />
      </Field>
      <Field label="Tìm kiếm" kind="search">
        <Input icon="search" placeholder="Tên máy in" />
      </Field>
    </div>
  );
}
```

### Error and required

Pass error to show the message under the control and mark it invalid.

```tsx
"use client";

import { useState } from "react";
import { Field, Input } from "@semi/ui";

export default function FieldValidation() {
  const [name, setName] = useState("ab");
  const error = name.length > 0 && name.length < 3 ? "Tên cần ít nhất 3 ký tự." : undefined;
  return (
    <Field label="Tên dự án" required error={error}>
      <Input value={name} onChange={(e) => setName(e.target.value)} />
    </Field>
  );
}
```

### Textarea

```tsx
import { Field, Textarea } from "@semi/ui";

export default function FieldTextarea() {
  return (
    <Field label="Ghi chú">
      <Textarea rows={3} placeholder="Ghi chú cho đơn in…" />
    </Field>
  );
}
```

### Overline section labels and reply box

Use text-overline text-muted for form section labels (never for a single field), and Textarea resizable for an auto-growing reply box.

```tsx
"use client";

import { useState } from "react";
import { Field, Input, Textarea } from "@semi/ui";

export default function FieldSections() {
  const [model, setModel] = useState("claude-sonnet");
  const [prompt, setPrompt] = useState("");
  return (
    <div className="max-w-lg space-y-6">
      <div className="space-y-3">
        <div className="text-overline text-muted">Mô hình</div>
        <Field label="Tên mô hình">
          <Input value={model} onChange={(e) => setModel(e.target.value)} />
        </Field>
      </div>
      <div className="space-y-3">
        <div className="text-overline text-muted">Lời nhắc</div>
        <div className="h-64 flex flex-col justify-end rounded-card border border-line bg-panel p-card">
          <Field label="Nội dung trả lời">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Gõ nhiều dòng để tự giãn, kéo mép trên (từ md) để đổi chiều cao…"
              autoGrow
              resizable
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
```

## API

### Field

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` * | `React.ReactNode` |  |  |
| `hint` | `React.ReactNode` |  | One short helper line under the control (hidden while an error shows). |
| `error` | `React.ReactNode` |  | Error message; marks the control aria-invalid and announces the message. |
| `required` | `boolean` | `false` |  |
| `kind` | `'number' \| 'search' \| 'email' \| 'tel' \| 'money' \| 'url' \| 'password'` |  | What the control holds: `email`, `tel`, `number`, `money`, `url`, `search` or `password`. Sets the control's `type`, `inputMode` (the phone keyboard), `autoComplete` and `enterKeyHint`; a prop on the control itself wins. |
| `id` | `string` |  |  |
| `className` | `string` |  |  |
| `children` * | `React.ReactNode` |  |  |

### Input

Text input on the field surface (FIELD_INPUT). For numbers use NumberInput, for dates DatePicker.

| Prop | Type | Default | Description |
|---|---|---|---|
| `ref` | `React.Ref<HTMLInputElement>` |  |  |
| `icon` | `IconName` |  | Leading icon inside the field. |

### Textarea

Multi-line text on the field surface (FIELD_TEXTAREA), with optional reply-box auto-grow and top resize edge.

| Prop | Type | Default | Description |
|---|---|---|---|
| `ref` | `React.Ref<HTMLTextAreaElement>` |  |  |
| `autoGrow` | `boolean` | `false` | Grow with typed text from `rows` (default 3) up to 50% of its container, then scroll inside. |
| `resizable` | `boolean` | `false` | From `md`: adds a top resize edge (`role="separator"`, drag / ArrowUp / ArrowDown ±24px / double-click reset, up to 80% of container). Phones: auto-grow only. |
| `containerRef` | `RefObject<HTMLElement \| null>` |  | Optional bounding container for 50% / 80% height caps (auto-detected when omitted). |

## Accessibility

- Field links label (htmlFor), hint and error (aria-describedby) and sets aria-invalid on error.
- The error is announced when it appears; required adds a visible mark and aria-required.
- kind sets inputMode (the keyboard), autoComplete (autofill) and enterKeyHint (the Enter key label); a prop on the control wins, e.g. autoComplete="new-password" on a sign-up password.

## Notes

- kind: email (type email, keyboard with @, autocomplete email), tel (tel keypad), number (decimal keypad), money (decimal keypad: amounts are typed with separators, parse in the app with a locale-aware parser, not Number(); inputMode="numeric" for whole numbers), url (type url: the browser rejects a bare 3dnoobs.vn on submit; next to an https:// addon pass type="text"), search (Enter reads "search"), password (autocomplete current-password, Enter reads "go"). number and money stay type="text": never a native type="number" (use NumberInput for a touch numpad; inside a Field it takes only autoComplete and enterKeyHint from the kind).
- Labels sit above the control, required fields get `*` (and "bắt buộc" for screen readers), the error shows under the field (`error`). Page forms are at most max-w-2xl (FORM_PAGE).

<!-- GENERATED by scripts/build-docs.mjs from examples/field/ and the types in src/ -->
