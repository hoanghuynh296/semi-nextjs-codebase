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

Multi-line text on the field surface (FIELD_TEXTAREA).

| Prop | Type | Default | Description |
|---|---|---|---|
| `ref` | `React.Ref<HTMLTextAreaElement>` |  |  |

## Accessibility

- Field links label (htmlFor), hint and error (aria-describedby) and sets aria-invalid on error.
- The error is announced when it appears; required adds a visible mark and aria-required.
- kind sets inputMode (the keyboard), autoComplete (autofill) and enterKeyHint (the Enter key label); a prop on the control wins, e.g. autoComplete="new-password" on a sign-up password.

## Notes

- kind: email (type email, keyboard with @, autocomplete email), tel (tel keypad), number (decimal keypad), money (numeric keypad, whole units; inputMode="decimal" for cents), url, search (Enter reads "search"), password (autocomplete current-password, Enter reads "go"). number and money stay type="text": never a native type="number" (use NumberInput for a touch numpad).
- Labels sit above the control, required fields get `*` (and "bắt buộc" for screen readers), the error shows under the field (`error`). Page forms are at most max-w-2xl (FORM_PAGE).

<!-- GENERATED by scripts/build-docs.mjs from examples/field/ and the types in src/ -->
