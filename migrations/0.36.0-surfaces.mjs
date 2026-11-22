// 0.36.0 (C-030, #93): cards separate by tone (bg-card, no border), secondary buttons are a tint fill without a border,
// and the main button reads the action fill (the accent, or the inverted neutral of a brand with primaryStyle inverted).
// `CARD`, `<Card>`, `BTN_*`, `<Button>` call sites need nothing. This rewrites the hand-made copies it can name exactly,
// inside one class string; anything else (a bg-panel block meant as a card in another order, a framed toolbar that
// should keep its line: Button variant="outline") is a CHANGELOG "Migration" note.
export const version = "0.36.0";
export const id = "surfaces";
export const description = "Hand-made cards → bg-card, copied secondary buttons → tint fill, copied primary buttons → action fill";

/** A class string that floats over the page (popover, menu, toast, toolbar, sticky bar): it keeps its panel fill and line.
 * A panel whose `fixed` sits on a parent is not seen here: the CHANGELOG migration note asks to review those. */
const FLOATING = /(?:^|\s)(?:[\w-]+:)*(?:shadow-overlay|shadow-float|fixed|absolute|sticky|backdrop-blur[\w-]*)(?=\s|$)/;

/** One class string. Exact sequences only; safe to run twice. */
export function surfaceClasses(cls) {
  let out = cls;
  // A hand-made static card (CARD before 0.36 spelled out): bg-panel border border-line rounded-card.
  if (!FLOATING.test(out)) out = out.replace(/(^|\s)bg-panel border border-line rounded-card(?=\s|$)/g, "$1bg-card rounded-card");
  // A copied BTN_SECONDARY / MODAL_BTN_SECONDARY.
  out = out.replace(/(^|\s)bg-field hover:bg-raised border border-line text-body hover:text-contrast(?=\s|$)/g, "$1bg-tint hover:bg-tint-hover text-body hover:text-contrast");
  // A copied BTN_PRIMARY / MODAL_BTN_PRIMARY / headerPrimary: the fill, its hover and its text change together.
  if (/(^|\s)bg-accent hover:bg-accent-hover(?=\s|$)/.test(out) && /(^|\s)text-on-accent(?=\s|$)/.test(out))
    out = out
      .replace(/(^|\s)bg-accent hover:bg-accent-hover(?=\s|$)/g, "$1bg-action hover:bg-action-hover")
      .replace(/(^|\s)text-on-accent(?=\s|$)/g, "$1text-on-action");
  return out;
}

/** Every string literal ("…", '…', `…` without ${}) of a source file goes through surfaceClasses. */
export function migrateSurfaces(src) {
  return src.replace(/(["'`])((?:(?!\1)[^\\\n$]|\\.)*)\1/g, (m, q, body) => {
    const next = surfaceClasses(body);
    return next === body ? m : `${q}${next}${q}`;
  });
}

export default function migrate({ files, read, write }) {
  for (const f of files) if (/\.(tsx?|jsx?)$/.test(f)) write(f, migrateSurfaces(read(f)));
}
