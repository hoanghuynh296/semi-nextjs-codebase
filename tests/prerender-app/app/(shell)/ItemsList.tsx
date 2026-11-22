"use client";

import { useMemo } from "react";
import { DetailOverlay, useDetailParam } from "../../../../src/DetailOverlay";
import { SplitButton } from "../../../../src/SplitButton";
import { CardActions } from "../../../../src/CardActions";
import { useRegisterCommands, type CommandItem } from "../../../../src/Command";

const ROWS = Array.from({ length: 40 }, (_, i) => ({ id: `r${i + 1}`, name: `Item ${i + 1}` }));

// A list whose items open in a DetailOverlay by URL (#102), as products mount it: outside the page's Suspense, so a
// router hook that suspends or a window access in render fails `next build` here. The page also registers quick
// actions in the app-wide CommandPalette (root layout).
export function ItemsList() {
  const { openId, open, show, close } = useDetailParam();
  const index = ROWS.findIndex((r) => r.id === openId);
  const item = index >= 0 ? ROWS[index] : null;
  const commands = useMemo<CommandItem[]>(
    () => [{ id: "new-item", label: "New item", group: "Quick actions", icon: "plus", tone: "blue", shortcut: ["⌘", "N"], onSelect: () => open("r1") }],
    [open],
  );
  useRegisterCommands(commands);
  return (
    <>
      <SplitButton label="New item" icon="plus" onClick={() => {}} items={[{ label: "Import file", icon: "upload", onSelect: () => {} }]} menuLabel="Other ways to add" />
      <div className="group relative w-64 h-24 rounded-card bg-card">
        <CardActions label="Actions for Item 1" actions={[{ icon: "pin", label: "Pin", onClick: () => {} }]} menu={[{ label: "Delete", icon: "trash", danger: true, onSelect: () => {} }]} />
      </div>
      <ul aria-label="Items">
        {ROWS.map((r) => (
          <li key={r.id}>
            <button type="button" className="block w-full h-12 text-left" onClick={() => open(r.id)}>
              {r.name}
            </button>
          </li>
        ))}
      </ul>
      <DetailOverlay
        open={item !== null}
        onClose={close}
        title={item?.name}
        index={index}
        total={ROWS.length}
        onPrev={index > 0 ? () => show(ROWS[index - 1].id) : undefined}
        onNext={index >= 0 && index < ROWS.length - 1 ? () => show(ROWS[index + 1].id) : undefined}
        side={<SplitButton label="Send" onClick={() => {}} items={[{ label: "Send later", onSelect: () => {} }]} menuLabel="Other ways to send" />}
      >
        <p>Details of {item?.name}</p>
      </DetailOverlay>
    </>
  );
}
