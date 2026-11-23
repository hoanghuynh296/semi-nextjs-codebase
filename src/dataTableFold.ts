// Internal (not exported from index): which DataTable columns fold into the first column when the table is narrower
// than its columns need (#130). Pure, so the rule is unit-tested in lint/test/data-table.test.mjs.

/** The part of a column the fold rule reads. */
export interface FoldColumn {
  key: string;
  priority?: 1 | 2 | 3;
}

/**
 * Keys of the columns to fold so the rest fit in `available` px. `widths` are the columns' minimum widths (what each
 * needs on one line, measured on the table's own container); `extra` is what else the row takes (the checkbox
 * column). Only columns with a `priority` fold, never the first one nor `keep` (the sorted column: its header is the
 * only control that shows and changes the sort): priority 3 first, then 2, then 1, and within
 * a priority the rightmost first. A column with no known width counts as 0. Folds no more than it must; when every
 * candidate is folded and it still does not fit, the table scrolls sideways.
 */
export function foldColumns(columns: FoldColumn[], widths: Record<string, number>, available: number, extra = 0, keep?: string): string[] {
  let need = extra + columns.reduce((sum, c) => sum + (widths[c.key] ?? 0), 0);
  if (need <= available) return [];
  const candidates = columns
    .map((c, i) => ({ c, i }))
    .filter(({ c, i }) => i > 0 && c.priority != null && c.key !== keep)
    .sort((a, b) => b.c.priority! - a.c.priority! || b.i - a.i);
  const folded: string[] = [];
  for (const { c } of candidates) {
    if (need <= available) break;
    folded.push(c.key);
    need -= widths[c.key] ?? 0;
  }
  return folded;
}
