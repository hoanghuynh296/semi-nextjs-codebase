"use client";

import { useRouter } from "next/navigation";
import { CommandPalette, type CommandItem } from "../../../src/Command";

// The app-wide palette (#102): mounted bare in the root layout. useRouter does not suspend, so this is allowed;
// useSearchParams here would fail `next build` (CLIENT_HOOK_DYNAMIC).
export function Palette() {
  const router = useRouter();
  const items: CommandItem[] = [
    { id: "items", label: "Items", group: "Places", icon: "box", href: "/items/a", onSelect: () => router.push("/items/a") },
    { id: "item-3", label: "Item 3", hint: "Items · open over the list", group: "Records", icon: "box", href: "/items/a?open=r3", onSelect: () => router.push("/items/a?open=r3") },
  ];
  return <CommandPalette items={items} />;
}
