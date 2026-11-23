// 1.0.0 (#144, T2): the 1.0 AppShell. The nav's main action is a general slot (`create` → `mainAction`, same data:
// label, icon, items / href / onClick) and its bottom row of 32×32 icon tools replaces the full-width utility rows
// (`utilities` → `tools`, the same id / label / icon / onClick / href / menu items). The nav has no account block any
// more: the account moves to the route header's avatar menu (`header={{ account: { name, detail, items, onSignOut } }}`),
// which also holds the theme. That move needs a person (a render prop becomes data or a slot), so `account` / `footer`
// on AppShell, a theme utility left in the tools and the old storage key are reported with the file, not rewritten.
// Safe to run twice: a tag that already has the new prop keeps the old one for a person to merge (reported).
import { hasTopLevelProp, shellTags } from "./0.36.0-shell.mjs";

export const version = "1.0.0";
export const id = "app-shell";
export const description = "AppShell create → mainAction, AppShell / DocsShell utilities → tools; reports account / footer on AppShell (moves to header.account), useThemeUtility in the tools (the theme is in the account menu) and a storageKey still holding the 0.x collapse value";

const RENAMES = [
  ["create", "mainAction", /^<AppShell\b/],
  ["utilities", "tools", /^<(?:AppShell|DocsShell)\b/],
];

/** Rename a prop at brace depth 0 of one opening tag (not inside an attribute's {…} or a string). */
function renameTopLevel(tag, from, to) {
  let depth = 0;
  let quote = "";
  for (let i = 0; i < tag.length; i++) {
    const ch = tag[i];
    if (quote) {
      if (ch === quote && tag[i - 1] !== "\\") quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (depth === 0 && /\s/.test(ch) && tag.startsWith(from, i + 1) && /[=\s/>]/.test(tag[i + 1 + from.length] ?? "")) {
      return tag.slice(0, i + 1) + to + tag.slice(i + 1 + from.length);
    }
  }
  return tag;
}

export function migrateShell(src) {
  if (!/<(?:AppShell|DocsShell)\b/.test(src)) return src;
  let out = src;
  // from the last tag to the first, so earlier ranges stay valid
  for (const [a, b] of shellTags(src).reverse()) {
    let tag = out.slice(a, b);
    for (const [from, to, which] of RENAMES) {
      if (which.test(tag) && hasTopLevelProp(tag, from) && !hasTopLevelProp(tag, to)) tag = renameTopLevel(tag, from, to);
    }
    out = out.slice(0, a) + tag + out.slice(b);
  }
  return out;
}

/** What the migration cannot rewrite, as hand-fix messages. */
export function shellFlags(src) {
  const out = [];
  const tags = shellTags(src).map(([a, b]) => src.slice(a, b));
  for (const tag of tags) {
    const name = /^<(\w+)/.exec(tag)[1];
    if (name === "AppShell") {
      for (const prop of ["account", "footer"]) {
        if (hasTopLevelProp(tag, prop)) {
          out.push(`AppShell ${prop}: the nav has no account block in 1.0. Move who is signed in to the route header's avatar menu: header={{ account: { name, detail, items, onSignOut } }} (the theme is in that menu); actions go to tools / toolsMenu.`);
        }
      }
    }
    for (const [from, to] of RENAMES) {
      if (hasTopLevelProp(tag, from) && hasTopLevelProp(tag, to)) out.push(`${name} sets both ${from} and ${to}: merge ${from} into ${to}.`);
    }
    if (name === "DocsShell" && (hasTopLevelProp(tag, "account") || hasTopLevelProp(tag, "footer"))) {
      out.push("DocsShell account / footer (deprecated): it now renders in its compact form in the route header; pass actions (the header's right side) instead.");
    }
  }
  if (tags.length && /\buseThemeUtility\s*\(/.test(src)) {
    out.push("useThemeUtility(): the theme is in the account avatar menu of the route header in 1.0 (header.account); remove the theme item from tools unless the app has no account.");
  }
  if (tags.some((t) => hasTopLevelProp(t, "storageKey"))) {
    out.push('AppShell storageKey: the stored value is now "rail" / "full" (was "1" / "0"); the 0.x value is ignored, so people choose once again.');
  }
  return out;
}

export default function migrate({ files, read, write, flag }) {
  for (const f of files) {
    if (!/\.(tsx?|jsx?)$/.test(f)) continue;
    const before = read(f);
    write(f, migrateShell(before));
    if (flag) for (const msg of shellFlags(before)) flag(f, msg);
  }
}
