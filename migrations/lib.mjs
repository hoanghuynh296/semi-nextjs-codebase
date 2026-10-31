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
