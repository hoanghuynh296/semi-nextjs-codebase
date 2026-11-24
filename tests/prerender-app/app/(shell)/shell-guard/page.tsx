"use client";

import { useState } from "react";
import { ConfirmHost } from "../../../../../src/confirmDialog";
import { useUnsavedGuard } from "../../../../../src/useUnsavedGuard";

// A form with unsaved changes (#144): a nav shortcut (Alt + digit) clicks the nav link, so this guard asks first.
export default function GuardPage() {
  const [text, setText] = useState("");
  useUnsavedGuard(text !== "");
  return (
    <>
      <label>
        Note <input value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <div contentEditable suppressContentEditableWarning data-testid="editor">
        Rich text
      </div>
      <ConfirmHost />
    </>
  );
}
