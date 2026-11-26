// Component name → its docs page and one-line description, from components.json (#194). Loaded on demand by the
// inspector, so the 150 kB manifest is not in every page's first bundle.

export type NameInfo = { name: string; id: string; summary: string };
export type NameMap = Map<string, { id: string; summary: string }>;

/** The first sentence, without markdown code marks, at most about 160 characters. */
export function oneLine(summary: string): string {
  const plain = summary.replace(/`([^`]*)`/g, "$1").replace(/\s+/g, " ").trim();
  const first = plain.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? plain;
  return first.length > 160 ? `${first.slice(0, 157).trimEnd()}…` : first;
}

export async function loadNames(): Promise<NameMap> {
  const { default: manifest } = await import("../../components.json");
  const map: NameMap = new Map();
  for (const c of manifest.components as { name: string; summary?: string; doc?: string }[]) {
    const id = c.doc?.match(/([\w-]+)\.md$/)?.[1];
    if (id) map.set(c.name, { id, summary: oneLine(c.summary ?? "") });
  }
  return map;
}

/**
 * A marked name ("Button", or a part such as "ToastHost.Toast") with the page it opens. A part, or a name without a
 * page of its own, links to its parent's page.
 */
export function describe(name: string, map: NameMap | null): NameInfo {
  const parent = name.split(".")[0];
  const own = map?.get(name);
  const base = map?.get(parent);
  return { name, id: own?.id ?? base?.id ?? "", summary: own?.summary ?? base?.summary ?? "" };
}
