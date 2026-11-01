// Helpers for release migrations (migrations/*.mjs). Text-level, conservative: they only touch what they can name
// exactly, so a migration can run again on code it already changed.

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Rename a named export of @semi/ui: the import specifier, JSX tags and plain identifier uses in files importing it. */
export function renameExport(src, from, to) {
  const importRx = /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["']@semi\/ui(?:\/styles)?["']/g;
  let imports = false;
  let out = src.replace(importRx, (m, names) => {
    if (!new RegExp(`(^|[\\s,])${escape(from)}(?=[\\s,]|$)`).test(names)) return m;
    imports = true;
    return m.replace(new RegExp(`(^|[\\s,{])${escape(from)}(?=[\\s,}]|$)`), `$1${to}`);
  });
  if (!imports) return src;
  out = out.replace(new RegExp(`(?<![\\w.$])${escape(from)}(?![\\w$])`, "g"), to);
  return out;
}

/** Rename a JSX prop of one component: <Component from=…> → <Component to=…> (also `from` with no value). */
export function renameProp(src, component, from, to) {
  return src.replace(new RegExp(`<${escape(component)}\\b[^>]*>`, "g"), (tag) =>
    tag.replace(new RegExp(`(\\s)${escape(from)}(?=[\\s=/>])`, "g"), `$1${to}`),
  );
}

/**
 * Brand-scale state classes → themed accent tokens (0.14.0): ring-primary-500/50 → ring-focus, focus:border-primary-*
 * → border-focus, bg-primary-500/5…15 → bg-accent-subtle, /20…25 → bg-accent-subtle-hover, border-primary-500/20…60 →
 * border-accent-line. Variants (hover:, focus-visible:, md:) are kept. Solid fills (bg-primary-500) are left alone.
 */
export function accentStateTokens(src) {
  return src
    .replace(/\b((?:[\w-]+:)*?(?:focus|focus-visible|focus-within):(?:[\w-]+:)*)border-primary-\d{2,3}(?:\/\d+)?(?![\w/-])/g, "$1border-focus")
    .replace(/\b(ring|outline)-primary-\d{2,3}(?:\/\d+)?(?![\w/-])/g, "$1-focus")
    .replace(/\bbg-primary-\d{2,3}\/(?:5|10|15)(?![\w/-])/g, "bg-accent-subtle")
    .replace(/\bbg-primary-\d{2,3}\/(?:20|25|30)(?![\w/-])/g, "bg-accent-subtle-hover")
    .replace(/\b(border(?:-[xytrblse])?)-primary-\d{2,3}\/(?:10|20|30|40|50|60)(?![\w/-])/g, "$1-accent-line");
}
