// 0.36.0 (#96, C-031 / C-032): AppShell's `footer` is split into `utilities` (actions: help, theme) and `account` (who
// is signed in). The footer content is the account in almost every app, so `footer=` becomes `account=` on AppShell and
// DocsShell (same `{ collapsed }` render prop). Moving actions out of it into `utilities` is a judgement: CHANGELOG note.
// Phones now get the drawer instead of MobileTabBar; `mobileTabIds` is deprecated and only applies with
// `mobileNav="tabs"`. Whether an app keeps the tab bar is the app's choice, so the migration only warns where it is set.
export const version = "0.36.0";
export const id = "shell";
export const description = "AppShell / DocsShell footer → account; warns where mobileTabIds is set (phones use the drawer now)";

/** The opening tags of AppShell / DocsShell as [start, end) ranges: a `>` inside `{…}` (an arrow function) or a string
 * does not end the tag. */
function shellTags(src) {
  const out = [];
  for (const m of src.matchAll(/<(?:AppShell|DocsShell)\b/g)) {
    let depth = 0;
    let quote = "";
    for (let i = m.index + m[0].length; i < src.length; i++) {
      const ch = src[i];
      if (quote) {
        if (ch === quote && src[i - 1] !== "\\") quote = "";
      } else if (ch === '"' || ch === "'" || ch === "`") quote = ch;
      else if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (ch === ">" && depth === 0) {
        out.push([m.index, i + 1]);
        break;
      }
    }
  }
  return out;
}

/** One source file; exact and safe to run twice. Only the `footer` prop at the top level of the tag is renamed. */
export function migrateShell(src) {
  if (!/@semi\/ui/.test(src)) return src;
  let out = "";
  let at = 0;
  for (const [a, b] of shellTags(src)) {
    const tag = src.slice(a, b);
    // `footer` as a prop of the tag itself: at brace depth 0, after whitespace, followed by =, space, / or >
    let depth = 0;
    let quote = "";
    let renamed = tag;
    for (let i = 0; i < tag.length; i++) {
      const ch = tag[i];
      if (quote) {
        if (ch === quote && tag[i - 1] !== "\\") quote = "";
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") quote = ch;
      else if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (depth === 0 && /\s/.test(ch) && tag.startsWith("footer", i + 1) && /[=\s/>]/.test(tag[i + 7] ?? "")) {
        renamed = tag.slice(0, i + 1) + "account" + tag.slice(i + 7);
        break;
      }
    }
    out += src.slice(at, a) + renamed;
    at = b;
  }
  return out + src.slice(at);
}

/** How many AppShell / DocsShell tags still set mobileTabIds without mobileNav="tabs" (it no longer does anything there). */
export function deprecatedTabIds(src) {
  return shellTags(src)
    .map(([a, b]) => src.slice(a, b))
    .filter((tag) => /\smobileTabIds\b/.test(tag) && !/mobileNav=["']tabs["']/.test(tag)).length;
}

export default function migrate({ files, read, write }) {
  for (const f of files) {
    if (!/\.(tsx?|jsx?)$/.test(f)) continue;
    const src = read(f);
    write(f, migrateShell(src));
    if (deprecatedTabIds(src))
      console.warn(`${f}: mobileTabIds is deprecated: phones use AppShell's drawer now. Remove it, or add mobileNav="tabs" to keep MobileTabBar.`);
  }
}
