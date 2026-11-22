// 0.36.0 (#96, C-031 / C-032): AppShell's `footer` is split into `utilities` (actions: help, theme) and `account` (who
// is signed in). The footer content is the account in almost every app, so `footer=` becomes `account=` on AppShell and
// DocsShell (same `{ collapsed }` render prop). Moving actions out of it into `utilities` is a judgement: CHANGELOG note.
// Phones get the drawer by default, but an app that sets `mobileTabIds` keeps MobileTabBar (deprecated prop); whether to
// move to the drawer is the app's choice, so the migration only warns where it is set.
export const version = "0.36.0";
export const id = "shell";
export const description = "AppShell / DocsShell footer → account (not where account is already set); warns where mobileTabIds is set";

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

/** Whether a prop name appears at brace depth 0 of an opening tag (not inside an attribute's {…} or a string). */
function hasTopLevelProp(tag, name) {
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
    else if (depth === 0 && /\s/.test(ch) && tag.startsWith(name, i + 1) && /[=\s/>]/.test(tag[i + 1 + name.length] ?? "")) return true;
  }
  return false;
}

/** AppShell / DocsShell tags that set both footer and account: the migration leaves them for a person to merge. */
export function footerAndAccount(src) {
  return shellTags(src)
    .map(([a, b]) => src.slice(a, b))
    .filter((tag) => hasTopLevelProp(tag, "footer") && hasTopLevelProp(tag, "account")).length;
}

/** One source file; exact and safe to run twice. Only the `footer` prop at the top level of the tag is renamed. */
export function migrateShell(src) {
  if (!/@semi\/ui/.test(src)) return src;
  let out = "";
  let at = 0;
  for (const [a, b] of shellTags(src)) {
    const tag = src.slice(a, b);
    // a tag that already has `account` keeps its footer: two account props would not compile (migrate() warns)
    if (hasTopLevelProp(tag, "account")) {
      out += src.slice(at, b);
      at = b;
      continue;
    }
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

/** How many AppShell / DocsShell tags set mobileTabIds without mobileNav (it still keeps the tab bar, but is deprecated). */
export function deprecatedTabIds(src) {
  return shellTags(src)
    .map(([a, b]) => src.slice(a, b))
    .filter((tag) => /\smobileTabIds\b/.test(tag) && !/\smobileNav=/.test(tag)).length;
}

export default function migrate({ files, read, write }) {
  for (const f of files) {
    if (!/\.(tsx?|jsx?)$/.test(f)) continue;
    const src = read(f);
    write(f, migrateShell(src));
    if (deprecatedTabIds(src))
      console.warn(`${f}: mobileTabIds is deprecated. It still keeps MobileTabBar; add mobileNav="tabs" to keep it on purpose, or remove mobileTabIds for the phone drawer.`);
    if (footerAndAccount(src)) console.warn(`${f}: AppShell sets both footer and account; footer was left as is: merge it into account / utilities by hand.`);
  }
}
