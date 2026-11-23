// 1.0.0 (#146): the 1.0 Button variants. The neutral tint button was `secondary`; in 1.0 `secondary` is the brand
// secondary fill and the neutral default is `subtle`. So `variant="secondary"` on a Semi Button / SplitButton becomes
// `variant="subtle"`, and the class constants BTN_SECONDARY / MODAL_BTN_SECONDARY (imported from @semi/ui) become
// BTN_SUBTLE / MODAL_BTN_SUBTLE. Exact: only literal attributes of components imported from @semi/ui; a second run changes
// nothing (no `secondary` is left to rename). A variant chosen in an expression and `outline` (now transparent with a
// 1px outline-line, no field fill) are flagged.
import { renameExport } from "./lib.mjs";

export const version = "1.0.0";
export const id = "buttons";
export const description =
  'Button / SplitButton variant="secondary" → "subtle" (secondary is now the brand secondary), BTN_SECONDARY → BTN_SUBTLE, MODAL_BTN_SECONDARY → MODAL_BTN_SUBTLE; a variant in an expression and variant="outline" are flagged';

const COMPONENTS = ["Button", "SplitButton"];
const importsFromSemi = (src, name) =>
  [...src.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["']@semi\/ui(?:\/styles)?["']/g)].some((m) =>
    new RegExp(`(^|[\\s,])${name}(?=[\\s,]|$)`).test(m[1]),
  );

/** Each opening tag of `name` as [start, end) (end after its `>`), skipping `>` inside {…} and quotes. */
function openingTags(src, name) {
  const out = [];
  const rx = new RegExp(`<${name}(?=[\\s/>])`, "g");
  let m;
  while ((m = rx.exec(src))) {
    let depth = 0;
    let quote = null;
    let i = m.index + m[0].length;
    for (; i < src.length; i++) {
      const c = src[i];
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'" || c === "`") quote = c;
      else if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) break;
    }
    out.push([m.index, i + 1]);
  }
  return out;
}

const SECONDARY_ATTR = /(\bvariant=)(?:"secondary"|'secondary'|\{\s*["']secondary["']\s*\})/g;

/** One source text. */
export function migrateButtons(src) {
  let out = src;
  for (const name of COMPONENTS) {
    if (!importsFromSemi(out, name)) continue;
    // replace from the end so earlier offsets stay valid
    for (const [a, b] of openingTags(out, name).reverse()) {
      const tag = out.slice(a, b);
      const next = tag.replace(SECONDARY_ATTR, '$1"subtle"');
      if (next !== tag) out = out.slice(0, a) + next + out.slice(b);
    }
  }
  out = renameExport(out, "MODAL_BTN_SECONDARY", "MODAL_BTN_SUBTLE");
  out = renameExport(out, "BTN_SECONDARY", "BTN_SUBTLE");
  return out;
}

/** What a person must check (also in the CHANGELOG "Migration" note). */
export function buttonFlags(after) {
  const flags = [];
  for (const name of COMPONENTS) {
    if (!importsFromSemi(after, name)) continue;
    for (const [a, b] of openingTags(after, name)) {
      const tag = after.slice(a, b);
      if (/\bvariant=\{(?!\s*["'][a-z]+["']\s*\})/.test(tag) && /["']secondary["']/.test(after))
        flags.push(`${name} with a variant from an expression in a file that names "secondary": in 1.0 "secondary" is the brand secondary fill; the neutral button is "subtle"`);
      if (/\bvariant=(?:"outline"|\{\s*["']outline["']\s*\})/.test(tag))
        flags.push(`${name} variant="outline" is now transparent with a 1px outline-line (no field fill): check it on its surface, or use "subtle" / "surface"`);
    }
  }
  // What the rename cannot reach: an alias or namespace import, a wrapper passing a ButtonVariant through, and any
  // variant="secondary" left on another component (a local wrapper of Button, or another library's).
  const semiImport = /import\s*\{[^}]*\bButton\s+as\s+\w+[^}]*\}\s*from\s*["']@semi\/ui["']|import\s*\*\s*as\s+\w+\s+from\s*["']@semi\/ui["']/;
  if (semiImport.test(after) && /["']secondary["']/.test(after))
    flags.push('Button imported under another name (as / import * as) in a file that names "secondary": not rewritten; in 1.0 "secondary" is the brand secondary fill, the neutral button is "subtle"');
  if (importsFromSemi(after, "ButtonVariant"))
    flags.push('a wrapper typed with ButtonVariant passes the variant through: a "secondary" its callers pass is now the brand secondary fill; the neutral button is "subtle"');
  for (const m of after.matchAll(/<([A-Za-z][\w.]*)(?=[\s>])[^<>]*?\bvariant=(?:"secondary"|'secondary'|\{\s*["']secondary["']\s*\})/g))
    flags.push(`<${m[1]} variant="secondary"> is not a Semi Button / SplitButton imported from @semi/ui, so it was not rewritten: if it wraps Button, "secondary" is now the brand secondary fill (the neutral one is "subtle")`);
  return [...new Set(flags)];
}

export default function migrate({ files, read, write, flag }) {
  for (const f of files) {
    if (!/\.(tsx?|jsx?|mdx?)$/.test(f)) continue;
    const after = migrateButtons(read(f));
    write(f, after);
    if (flag) for (const msg of buttonFlags(after)) flag(f, msg);
  }
}
