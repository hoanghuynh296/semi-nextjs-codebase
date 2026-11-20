// 0.30.0: tokens named after one component or product are renamed by role, like the big design systems do
// (Material, Carbon, Primer: a type role, not "KPI"; a layer, not "keypad"). The old names stay as deprecated aliases.
export const version = "0.30.0";
export const id = "role-token-names";
export const description = "text-kpi → text-figure, z-keypad → z-sheet (classes and CSS variables)";

/** Exact renames; safe to run twice. */
export function renameRoleTokens(src) {
  return src
    .replace(/(^|[^\w-])text-kpi(?![\w-])/g, "$1text-figure")
    .replace(/--text-kpi(?=--line-height|[^\w-]|$)/g, "--text-figure")
    .replace(/(^|[^\w-])z-keypad(?![\w-])/g, "$1z-sheet")
    .replace(/--z-keypad(?![\w-])/g, "--z-sheet");
}

export default function migrate({ files, read, write }) {
  for (const f of files) if (/\.(tsx?|jsx?|mdx?|css)$/.test(f)) write(f, renameRoleTokens(read(f)));
}
