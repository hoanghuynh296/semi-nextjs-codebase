"use client";

import { useRouter } from "next/navigation";
import { CommandPalette, type CommandItem } from "../../../src/Command";
import { openDetail } from "../../../src/DetailOverlay";

// The app-wide palette (#102): mounted bare in the root layout. useRouter does not suspend, so this is allowed;
// useSearchParams here would fail `next build` (CLIENT_HOOK_DYNAMIC). A record on the current route opens with
// openDetail (Next's same-route router.push is not heard without the Navigation API); another route gets router.push.
export function Palette() {
  const router = useRouter();
  const record = (id: string) => () => (window.location.pathname === "/items/a" ? openDetail(id) : router.push(`/items/a?open=${id}`));
  const items: CommandItem[] = [
    { id: "items", label: "Items", group: "Places", icon: "box", href: "/items/a", onSelect: () => router.push("/items/a") },
    { id: "item-3", label: "Item 3", hint: "Items · open over the list", group: "Records", icon: "box", href: "/items/a?open=r3", onSelect: record("r3") },
  ];
  return <CommandPalette items={items} />;
}
