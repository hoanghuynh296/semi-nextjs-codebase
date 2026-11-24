// 1.0.0 (#144, T2): the 1.0 AppShell. The nav's main action is a general slot (`create` → `mainAction`, same data:
// label, icon, items / href / onClick) and its bottom row of 32×32 icon tools replaces the full-width utility rows
// (`utilities` → `tools`, the same id / label / icon / onClick / href / menu items). The nav has no account block any
// more: the account moves to the route header's avatar menu (`header={{ account: { name, detail, items, onSignOut } }}`),
// which also holds the theme. That move needs a person (a render prop becomes data or a slot), so `account` / `footer`
// on AppShell, a `{...spread}` on a shell tag, a theme utility left in the tools and a custom storage key are reported
// with the file, not rewritten. Comments inside a tag are skipped (`/* create */` is not the prop). Safe to run twice: a tag that already has the new prop keeps the old one for a person to merge (reported).
export const version = "1.0.0";
export const id = "app-shell";
export const description = "AppShell create → mainAction, AppShell / DocsShell utilities → tools; reports account / footer on AppShell (moves to header.account), a {...spread} on a shell tag (not rewritten), useThemeUtility in the tools (the theme is in the account menu) and a storageKey whose value format changed";

const RENAMES = [
  ["create", "mainAction", /^<AppShell\b/],
  ["utilities", "tools", /^<(?:AppShell|DocsShell)\b/],
];

/**
 * The AppShell / DocsShell opening tags of a file, as `{ a, b, masked }`: the range in the source and the tag with its
 * comments (`/* … *\/`, `// …`) and string contents blanked to spaces (same length), so a comment that names a prop or
 * holds a `>` is never read as code. A tag whose end cannot be found (an apostrophe in nested JSX text, `Don't`, reads
 * as an open string) comes back as `{ a, b: -1, masked: null }`: it is not rewritten and `shellFlags` reports it.
 */
export function shellTagsMasked(src) {
  const out = [];
  for (const m of src.matchAll(/<(?:AppShell|DocsShell)\b/g)) {
    let depth = 0;
    let quote = "";
    let masked = m[0];
    let closed = false;
    for (let i = m.index + m[0].length; i < src.length; i++) {
      const ch = src[i];
      if (quote) {
        if (ch === quote && src[i - 1] !== "\\") {
          quote = "";
          masked += ch;
        } else masked += ch === "\n" ? ch : " ";
        continue;
      }
      if (ch === "/" && (src[i + 1] === "*" || src[i + 1] === "/")) {
        const close = src[i + 1] === "*" ? src.indexOf("*/", i + 2) : src.indexOf("\n", i + 2);
        const stop = close === -1 ? src.length : src[i + 1] === "*" ? close + 2 : close;
        masked += src.slice(i, stop).replace(/[^\n]/g, " ");
        i = stop - 1;
        continue;
      }
      masked += ch;
      if (ch === '"' || ch === "'" || ch === "`") quote = ch;
      else if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (ch === ">" && depth === 0) {
        out.push({ a: m.index, b: i + 1, masked });
        closed = true;
        break;
      }
    }
    if (!closed) out.push({ a: m.index, b: -1, masked: null });
  }
  return out;
}

/** Index of a prop name at brace depth 0 of a masked tag (after whitespace, before `=`, space, `/` or `>`), or -1. */
function propAt(masked, name) {
  let depth = 0;
  for (let i = 0; i < masked.length; i++) {
    const ch = masked[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (depth === 0 && /\s/.test(ch) && masked.startsWith(name, i + 1) && /[=\s/>]/.test(masked[i + 1 + name.length] ?? "")) return i + 1;
  }
  return -1;
}

const hasProp = (masked, name) => propAt(masked, name) !== -1;

/** Whether a masked tag spreads props at its top level (`{...props}`): those props cannot be renamed here. */
const hasSpread = (masked) => {
  let depth = 0;
  for (let i = 0; i < masked.length; i++) {
    if (masked[i] === "{") {
      if (depth === 0 && /^\{\s*\.\.\./.test(masked.slice(i))) return true;
      depth++;
    } else if (masked[i] === "}") depth--;
  }
  return false;
};

export function migrateShell(src) {
  if (!/<(?:AppShell|DocsShell)\b/.test(src)) return src;
  let out = src;
  // from the last tag to the first, so earlier ranges stay valid
  for (const { a, b, masked: m0 } of shellTagsMasked(src).reverse()) {
    if (b === -1) continue;
    let tag = out.slice(a, b);
    let masked = m0;
    for (const [from, to, which] of RENAMES) {
      const at = which.test(masked) && !hasProp(masked, to) ? propAt(masked, from) : -1;
      if (at === -1) continue;
      tag = tag.slice(0, at) + to + tag.slice(at + from.length);
      masked = masked.slice(0, at) + to + masked.slice(at + from.length);
    }
    out = out.slice(0, a) + tag + out.slice(b);
  }
  return out;
}

/** What the migration cannot rewrite, as hand-fix messages. */
export function shellFlags(src) {
  const out = [];
  const all = shellTagsMasked(src);
  const unread = all.filter((t) => t.b === -1);
  if (unread.length) {
    const lines = unread.map((t) => src.slice(0, t.a).split("\n").length).join(", ");
    out.push(`AppShell / DocsShell tag on line ${lines}: the migration could not find where the tag ends (an apostrophe in JSX text inside an attribute, like Don't, reads as an open string), so it renamed nothing there; rename create → mainAction and utilities → tools by hand.`);
  }
  const tags = all.filter((t) => t.b !== -1).map((t) => t.masked);
  for (const tag of tags) {
    const name = /^<(\w+)/.exec(tag)[1];
    if (name === "AppShell") {
      for (const prop of ["account", "footer"]) {
        if (hasProp(tag, prop)) {
          out.push(`AppShell ${prop}: the nav has no account block in 1.0. Move who is signed in to the route header's avatar menu: header={{ account: { name, detail, items, onSignOut } }} (the theme is in that menu); actions go to tools / toolsMenu.`);
        }
      }
    }
    for (const [from, to] of RENAMES) {
      if (hasProp(tag, from) && hasProp(tag, to)) out.push(`${name} sets both ${from} and ${to}: merge ${from} into ${to}.`);
    }
    if (hasSpread(tag)) {
      out.push(`${name} {...spread}: props passed through a spread are not renamed; rename create → mainAction and utilities → tools in the spread object by hand (account / footer: see above).`);
    }
    if (name === "DocsShell" && (hasProp(tag, "account") || hasProp(tag, "footer"))) {
      out.push("DocsShell account / footer (deprecated): it now renders in its compact form in the route header; pass actions (the header's right side) instead.");
    }
  }
  if (tags.length && /\buseThemeUtility\s*\(/.test(src)) {
    out.push("useThemeUtility(): the theme is in the account avatar menu of the route header in 1.0 (header.account); remove the theme item from tools unless the app has no account.");
  }
  if (tags.some((t) => hasProp(t, "storageKey"))) {
    out.push('AppShell storageKey: the stored value is now "rail" / "full" (was "1" / "0"); AppShell upgrades a 0.x value once on load, so only code of your own that reads or writes this key needs changing.');
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
