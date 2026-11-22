# Form actions, unsaved guard, validation

The same form behaviour everywhere: FormActions (Huỷ then Lưu / Tạo, sticky on a page, the footer of a Modal), useUnsavedGuard (nobody loses typed work), and validation that shows on blur then follows changes, with an Alert summary for several errors.

## When to use

- Every form: the action row is FormActions, never a hand-ordered pair of buttons.
- Any form the user can lose by leaving (a page, a long modal): useUnsavedGuard(dirty).
- Validation of a form with more than one required field: useFormValidation + Field error.

## Use something else when

| Need | Use |
|---|---|
| The action row of a confirmation (Xoá? Huỷ / Xoá) | confirmDialog |
| A setting that applies at once, no Save | Switch (a toast says it was saved) |
| The result of Save (saved, failed to reach the server) | toast; a problem inside a field is Field error, never a toast |
| Page-level buttons of a list (Thêm máy in) | PageActions / PageTitle |

## Import

```tsx
import { FormActions, useUnsavedGuard, useFormValidation, FormErrorSummary } from "@semi/ui";
```

## Examples

### Page form

Required fields, kinds for the phone keyboard, validation on blur then change, the summary for several errors, the guard, and Huỷ / Tạo.

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Field, FormActions, FormErrorSummary, Input, toast, useFormValidation, useUnsavedGuard } from "@semi/ui";

const EMPTY = { name: "", email: "", phone: "", price: "" };

export default function FormActionsPageForm() {
  const [values, setValues] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [key]: e.target.value }));

  // errors show after a field loses focus, then follow every change
  const form = useFormValidation(values, {
    name: (v) => (v.trim() ? undefined : "Nhập tên máy in."),
    email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? undefined : "Email chưa đúng, ví dụ ten@congty.vn."),
    phone: (v) => (v && !/^0\d{9}$/.test(v) ? "Số điện thoại gồm 10 số, bắt đầu bằng 0." : undefined),
  });
  // warns on reload, tab close, a link or back while this is true
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const { confirmLeave } = useUnsavedGuard(dirty);
  const router = useRouter();

  // after a save, go on with confirmLeave: the form is clean, so it only drops the guard's history entry (Back stays one press)
  useEffect(() => {
    if (saved !== EMPTY) void confirmLeave(() => router.push("/components/button/"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.validate()) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(values); // not dirty any more: leaving does not ask
      toast({ title: "Đã tạo máy in", tone: "success" });
    }, 600);
  };

  return (
    <form data-form="page-form" onSubmit={save} noValidate className="w-full max-w-2xl flex flex-col gap-stack">
      <Field label="Tên máy in" required error={form.errors.name}>
        <Input value={values.name} onChange={set("name")} onBlur={form.blur("name")} />
      </Field>
      <Field label="Email liên hệ" kind="email" required error={form.errors.email}>
        <Input value={values.email} onChange={set("email")} onBlur={form.blur("email")} />
      </Field>
      <Field label="Số điện thoại" kind="tel" hint="Không bắt buộc." error={form.errors.phone}>
        <Input value={values.phone} onChange={set("phone")} onBlur={form.blur("phone")} />
      </Field>
      <Field label="Giá bán" kind="money">
        <Input value={values.price} onChange={set("price")} />
      </Field>
      <FormErrorSummary errors={form.errors} />
      <FormActions create loading={saving} onCancel={() => confirmLeave(() => router.back())} />
    </form>
  );
}
```

### Destructive action on the left

Editing an existing record: Xoá is alone on the left, away from Lưu, and asks first (after the unsaved-changes question, if the form is dirty).

```tsx
"use client";

import { Button, confirmDelete, Field, FormActions, Input, toast, useUnsavedGuard } from "@semi/ui";
import { useState } from "react";

export default function FormActionsDestructive() {
  const [name, setName] = useState("Bambu X1C");
  const [saved, setSaved] = useState("Bambu X1C");
  const { confirmLeave } = useUnsavedGuard(name !== saved);

  const remove = async () => {
    if (await confirmDelete({ name: saved, message: "Lịch sử in của máy cũng bị xoá." })) toast.success("Đã xoá máy in");
  };

  return (
    <form
      data-form="destructive"
      className="w-full max-w-2xl flex flex-col gap-stack"
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(name);
      }}
    >
      <Field label="Tên máy in" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <FormActions
        onCancel={() => confirmLeave(() => setName(saved))}
        destructive={
          <Button variant="danger" icon="trash" onClick={() => confirmLeave(remove)}>
            Xoá máy in
          </Button>
        }
      />
    </form>
  );
}
```

### In a Modal footer

placement="modal": the same order, 44px buttons on phones; the primary is type="button" with onSubmit because the footer sits outside the form.

```tsx
"use client";

import { useState } from "react";
import { Button, Field, FormActions, Input, Modal } from "@semi/ui";

export default function FormActionsModal() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Button icon="edit" onClick={() => setOpen(true)}>
        Đổi tên máy in
      </Button>
      <Modal
        open={open}
        onClose={close}
        title="Đổi tên máy in"
        closeOnBackdrop={false}
        footer={<FormActions placement="modal" onCancel={close} onSubmit={close} />}
      >
        <Field label="Tên máy in" required>
          <Input defaultValue="Bambu X1C" />
        </Field>
      </Modal>
    </>
  );
}
```

## API

### FormActions

Cancel (ghost) then Save / Create (primary), right-aligned, `destructive` on the left. Page forms stick to the bottom
of the screen, above the on-screen keyboard and the home indicator; in a Modal pass `placement="modal"` as the footer.

| Prop | Type | Default | Description |
|---|---|---|---|
| `onCancel` | `() => void` |  | Huỷ: leaves the form (route back, close the modal). Omit for a form that cannot be cancelled. |
| `cancelLabel` | `React.ReactNode` |  | Text of the cancel button (default "Huỷ"). |
| `submitLabel` | `React.ReactNode` |  | Text of the primary button (default "Lưu", or "Tạo" with `create`). |
| `create` | `boolean` | `false` | The form makes something new: the primary reads "Tạo" instead of "Lưu". |
| `onSubmit` | `() => void` |  | Runs when the primary is pressed. Omit it inside a `<form>`: the button is then `type="submit"` and the form's `onSubmit` handles it (Enter in a field works too). Pass it in a Modal footer, which sits outside the form. |
| `loading` | `boolean` | `false` | The save is running: the primary shows a spinner and blocks clicks. |
| `disabled` | `boolean` | `false` | Disables the primary (nothing changed, or the form is invalid and the screen chose not to say so on press). |
| `destructive` | `React.ReactNode` |  | A destructive action (Xoá…) shown alone on the left, away from the primary. A `variant="danger"` Button. |
| `placement` | `'modal' \| 'page'` | `"page"` | `page` (default): sticky at the bottom of the page. `modal`: the footer of a Modal (not sticky, stretched on phones by the footer). |
| `className` | `string` |  |  |

### useUnsavedGuard

`dirty` is true while the form holds changes that are not saved (compare with the loaded values; false right after a
successful save, before navigating on). Prompt texts come from the locale table (`unsavedTitle`, `unsavedChanges`,
`leave`, `stay`).

No props of its own.

### useFormValidation

No props of its own.

### FormErrorSummary

The summary of a form with several errors: an `Alert` listing them, placed above `FormActions`. One error shows only
under its field (the summary renders nothing), so a form never says the same thing twice.

| Prop | Type | Default | Description |
|---|---|---|---|
| `errors` * | `Record<string, string \| undefined>` |  |  |
| `className` | `string` |  |  |

## Accessibility

- Tab order follows the visual order: destructive action, Huỷ, then the primary; Enter in a field submits the form (the primary is type="submit").
- Buttons are 44px high (h-11) below sm; the page bar sits above the on-screen keyboard and the home-indicator inset.
- A field error is announced (role="alert") and sets aria-invalid; the Alert summary (several errors) is role="alert" too.
- useUnsavedGuard asks with confirmDialog (a focus-trapped dialog, Escape stays); reload and tab close use the browser's own prompt.

## Notes

- Order: [destructive … ] Huỷ (ghost) Lưu (primary), right-aligned. "Tạo" (`create`) when the form makes something new, "Lưu" when it edits. Page forms are at most `max-w-2xl` (`FORM_PAGE`), labels above the fields, required fields marked `*` (Field `required`).
- Sticky: on a page FormActions is `sticky bottom-0` in the page's scroll area, over `bg-app` with a line above, lifted above the keyboard (visualViewport) and padded by the safe-area inset. A page that scrolls inside an `overflow` box keeps the bar at the end of that box. In a Modal pass `placement="modal"` as the footer.
- Validation timing: nothing while a field is first filled, its error on blur, then on every change (it clears the moment it is fixed). On submit `form.validate()` touches every field. One error shows only under its field; two or more also show a FormErrorSummary above FormActions.
- Guard: `dirty` must be false right after a successful save, before you navigate on. It covers reload and tab close (beforeunload), link clicks and back / forward; for a navigation your own code starts (router.push after a button, a Huỷ that goes back) wrap it: `confirmLeave(() => router.back())`. While dirty one history entry is added so back can be asked about; an agreed leave drops it first (Back stays one press, nothing asks twice), and after a save it is a spent marker: navigate on with `confirmLeave(() => router.push(x))` (clean form, no question; the spent entry is popped first so Back is one press).
- Texts (Huỷ, Lưu, Tạo, "Bạn có thay đổi chưa lưu…", Rời đi, Ở lại, "Có n mục cần sửa") are Vietnamese by default and come from SemiLocaleProvider. Mount ConfirmHost once in the root layout (useUnsavedGuard asks through it).

<!-- GENERATED by scripts/build-docs.mjs from examples/form-actions/ and the types in src/ -->
