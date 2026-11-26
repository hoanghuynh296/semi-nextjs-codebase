"use client";

// The action row of a form (docs/DESIGN_SYSTEM.md §9b): Huỷ (ghost) then Lưu / Tạo (primary), right-aligned, a destructive
// action alone on the left. On a page it sticks to the bottom (above the keyboard and the safe area on phones); in a
// Modal it is the footer.
//   <form onSubmit={save}>
//     …fields…
//     <FormActions onCancel={() => router.back()} loading={saving} />
//   </form>
//   <Modal footer={<FormActions placement="modal" onCancel={close} onSubmit={save} create />}>…</Modal>
import React, { useEffect, useState } from "react";
import { Button } from "./Button";
import { keyboardInset } from "./formGuard";
import { useSemiLocale } from "./locale";
import { FORM_ACTIONS, FORM_ACTIONS_STICKY } from "../styles/surfaces";
import { cn } from "../styles/utils";

/** Height of the on-screen keyboard over the layout viewport (0 when closed). Follows `visualViewport`. */
function useKeyboardInset(active: boolean): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    const update = () => setInset(keyboardInset(vv, window.innerHeight));
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [active]);
  return inset;
}

// Cancel is a ghost button; phones get the 44px touch target (h-11) the modal buttons use.
const CANCEL = "max-sm:h-11 max-sm:px-4 max-sm:text-lead";

export interface FormActionsProps {
  /** Huỷ: leaves the form (route back, close the modal). Omit for a form that cannot be cancelled. */
  onCancel?: () => void;
  /** Text of the cancel button (default "Huỷ"). */
  cancelLabel?: React.ReactNode;
  /** Text of the primary button (default "Lưu", or "Tạo" with `create`). */
  submitLabel?: React.ReactNode;
  /** The form makes something new: the primary reads "Tạo" instead of "Lưu". */
  create?: boolean;
  /**
   * Runs when the primary is pressed. Omit it inside a `<form>`: the button is then `type="submit"` and the form's
   * `onSubmit` handles it (Enter in a field works too). Pass it in a Modal footer, which sits outside the form.
   */
  onSubmit?: () => void;
  /** The save is running: the primary shows a spinner and blocks clicks. */
  loading?: boolean;
  /** Disables the primary (nothing changed, or the form is invalid and the screen chose not to say so on press). */
  disabled?: boolean;
  /** A destructive action (Xoá…) shown alone on the left, away from the primary. A `variant="danger"` Button. */
  destructive?: React.ReactNode;
  /** `page` (default): sticky at the bottom of the page. `modal`: the footer of a Modal (not sticky, stretched on phones by the footer). */
  placement?: "page" | "modal";
  className?: string;
}

/**
 * Cancel (ghost) then Save / Create (primary), right-aligned, `destructive` on the left. Page forms stick to the bottom
 * of the screen, above the on-screen keyboard and the home indicator; in a Modal pass `placement="modal"` as the footer.
 */
export function FormActions({ onCancel, cancelLabel, submitLabel, create = false, onSubmit, loading = false, disabled = false, destructive, placement = "page", className }: FormActionsProps) {
  const t = useSemiLocale();
  const page = placement === "page";
  const kbd = useKeyboardInset(page);
  return (
    <div data-semi="FormActions"
      data-form-actions={placement}
      className={cn(FORM_ACTIONS, page && FORM_ACTIONS_STICKY, !page && "w-full", className)}
      // above the keyboard: lift by its height; closed: keep the home-indicator inset below the buttons
      style={page ? { bottom: kbd || undefined, paddingBottom: kbd ? "0.75rem" : "max(0.75rem, env(safe-area-inset-bottom))" } : undefined}
    >
      {destructive && <div className="mr-auto flex items-center">{destructive}</div>}
      {onCancel && (
        <Button variant="subtle" className={CANCEL} onClick={onCancel} disabled={loading}>
          {cancelLabel ?? t.cancel}
        </Button>
      )}
      <Button
        variant="primary"
        size="modal"
        type={onSubmit ? "button" : "submit"}
        onClick={onSubmit}
        loading={loading}
        disabled={disabled}
      >
        {submitLabel ?? (create ? t.create : t.save)}
      </Button>
    </div>
  );
}
