# Toast

One toast API for feedback after an action: toast.success / error / warning / info, toast.undo for a reversible destructive action, toast.promise for work in progress. Irreversible actions ask first (confirmDelete). Mount ToastHost once in the root layout.

## When to use

- Confirm an action happened (Đã lưu): toast.success, shown once, never a modal.
- Right after a reversible destructive action (archive, remove from a list, move): toast.undo with Hoàn tác.
- Work that takes a moment (save, import, send): toast.promise.

## Use something else when

| Need | Use |
|---|---|
| A message that must stay on the page | Alert |
| Ask before an irreversible action (delete, disconnect) | confirmDelete() / confirmDialog() |
| A problem inside a field | Field error |

## Import

```tsx
import { ToastHost, toast, updateToast, dismissToast } from "@semi/ui";
```

## Examples

### Tones and actions

```tsx
"use client";

import { Button, toast } from "@semi/ui";

export default function ToastTones() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => toast({ title: "Đã lưu thay đổi", tone: "success", action: { label: "Hoàn tác", onClick: () => toast({ title: "Đã hoàn tác" }) } })}>
        Thành công + hoàn tác
      </Button>
      <Button onClick={() => toast({ title: "Mất kết nối máy in", description: "Thử lại sau vài giây.", tone: "warning" })}>Cảnh báo</Button>
      <Button onClick={() => toast({ title: "Tệp sẽ được gửi khi máy rảnh", tone: "info", duration: 0 })}>Không tự tắt</Button>
    </div>
  );
}
```

### Undo after a reversible delete

The row goes at once; the toast offers Hoàn tác for 8 seconds.

```tsx
"use client";

import { Button, toast } from "@semi/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

// A reversible destructive action: do it at once, then offer "Hoàn tác" for 8 seconds. No question first.
// onCommit runs when the window closes without an undo: that is where a real app deletes on the server, and its
// undo must restore on the server too (it can run after this component is gone).
export default function ToastUndo() {
  const [rows, setRows] = useState(["Bản in mẫu A", "Bản in mẫu B", "Bản in mẫu C"]);
  const [gone, setGone] = useState(0);
  const router = useRouter();

  // delete on a detail page, then back to the list: the toast shown just before the navigation stays, and Hoàn tác works
  const archiveAndLeave = () => {
    toast.undo('Đã lưu trữ "Bản in mẫu D"', () => toast.success("Đã khôi phục bản in mẫu D"));
    router.push("/components/confirm-dialog/");
  };

  const archive = (name: string, index: number) => {
    setRows((r) => r.filter((x) => x !== name));
    toast.undo(`Đã lưu trữ "${name}"`, () => setRows((r) => [...r.slice(0, index), name, ...r.slice(index)]), { onCommit: () => setGone((n) => n + 1) });
  };

  return (
    <ul data-undo-list className="w-full max-w-sm flex flex-col gap-2">
      {rows.map((name, i) => (
        <li key={name} className="flex items-center justify-between gap-2 rounded-control border border-line bg-panel px-3 py-2 text-ui text-strong">
          {name}
          <Button size="sm" variant="ghost" icon="trash" onClick={() => archive(name, i)}>
            Lưu trữ
          </Button>
        </li>
      ))}
      {rows.length === 0 && <li className="text-ui text-muted">Đã lưu trữ hết, bấm Hoàn tác để khôi phục.</li>}
      <li>
        <Button size="sm" variant="subtle" onClick={archiveAndLeave}>
          Lưu trữ rồi chuyển trang
        </Button>
      </li>
      <li data-committed className="text-ui text-muted">
        Đã chốt: {gone}
      </li>
    </ul>
  );
}
```

### Promise toast

A spinner toast that turns into the result.

```tsx
"use client";

import { Button, toast, updateToast } from "@semi/ui";

const save = (fail: boolean) => new Promise<number>((resolve, reject) => setTimeout(() => (fail ? reject(new Error("offline")) : resolve(12)), 1500));
const forever = () => new Promise<number>(() => {});

// toast.promise: one toast follows the work, then becomes the result (success once, or the failure with the reason).
// `timeout` (default 30 s) ends the wait with the error text. updateToast changes a toast in place, by its id.
export default function ToastPromise() {
  const progress = () => {
    const id = toast({ title: "Đang gửi 0/3", tone: "info", duration: 0 });
    [1, 2, 3].forEach((n) => setTimeout(() => updateToast(id, n === 3 ? { title: "Đã gửi 3/3", tone: "success", duration: 6000 } : { title: `Đang gửi ${n}/3` }), n * 300));
    return id;
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => toast.promise(save(false), { loading: "Đang lưu…", success: (n) => `Đã lưu ${n} dòng`, error: "Không lưu được" })}>Lưu</Button>
      <Button variant="subtle" onClick={() => toast.promise(save(true), { loading: "Đang lưu…", success: "Đã lưu", error: (e) => `Không lưu được: ${e instanceof Error ? e.message : "lỗi"}` }).catch(() => {})}>
        Lưu (lỗi)
      </Button>
      <Button variant="subtle" onClick={() => toast.promise(forever(), { timeout: 1500, loading: "Đang kết nối…", success: "Đã kết nối", error: "Quá thời gian chờ" })}>
        Kết nối (treo)
      </Button>
      <Button variant="subtle" onClick={progress}>
        Tiến độ
      </Button>
    </div>
  );
}
```

## API

### ToastHost

| Prop | Type | Default | Description |
|---|---|---|---|
| `hotkey` | `string \| false` | `"Alt+T"` | Keyboard shortcut that focuses the newest toast's action (default "Alt+T"; `false` turns it off). Modifiers `Alt` `Ctrl` `Shift` `Meta` plus one letter. It is ignored while typing (inputs, textareas, contenteditable) and during IME composition. Firefox on Windows and Linux may open its Alt menu bar on Alt+letter; choose `"Ctrl+Alt+T"` or turn it off there. |
| `durationScale` | `number` | `1` | Multiplies every auto-dismiss time (WCAG 2.2.1, "time to read"): 2 doubles them, for a product whose users read slowly or use a screen magnifier. Default 1; 0 keeps every toast until it is dismissed. |
| `label` | `string` |  | Name of the notification region (default: locale `notifications`, "Thông báo"). Change it when a page section has the same name, e.g. a "Thông báo" settings group, so the two landmarks can be told apart. |

## Accessibility

- A live region (polite, assertive for danger); toasts with an action stay until dismissed or wait longer.
- The stack is a region named by the locale's notifications string with two sibling live regions (danger assertive, the rest polite), never nested. Auto-dismiss pauses on hover and on keyboard focus.
- A toast with an action or undo waits 8 s (and while hovered or focused); undo is a real button, so it is reachable by keyboard. A pending (promise) toast has no timer until it settles.
- Alt+T (ToastHost hotkey, false turns it off; ignored while typing and in IME composition; Firefox's Alt menu is a caveat) moves keyboard focus to the newest toast's action; focus pauses its timer. ToastHost durationScale multiplies every auto-dismiss time (WCAG 2.2.1).

## Notes

- <ToastHost /> goes once in the root layout (see Theme › Root layout); every toast() call anywhere shows there. No <Suspense> is needed around it: the route-change watcher inside ToastHost has its own boundary, so it is safe in a root layout that prerenders dynamic routes.
- Feedback rule (§14c): reversible destructive action → toast.undo; irreversible → confirmDelete (names the object, red Xoá, Huỷ); success is one toast, never a modal. The same text still showing is replaced, not stacked.
- `toast(opts)` keeps working; `toast.success(title, opts | ms)` etc. are shorthands. Use `updateToast(id, patch)` to change a toast that is still showing.
- Undo: `onUndo` must restore on the server too (it can run after the component is gone); `onCommit` runs when the window closes without an undo (also on pagehide: best effort, use keepalive / sendBeacon; commit first, undo restores). Undo toasts already showing close on a route change; one shown just before the action's own navigation stays. `toast.promise` has `timeout` (default 30 s: a neutral "Vẫn đang xử lý…", not an error). `updateToast` keeps the id.

<!-- GENERATED by scripts/build-docs.mjs from examples/toast/ and the types in src/ -->
