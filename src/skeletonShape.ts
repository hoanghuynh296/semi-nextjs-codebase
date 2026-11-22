// Internal (not exported from index): skeleton widths shared by SkeletonTable and DataTable's loading rows.
const CELL = ["w-28", "w-20", "w-24", "w-16", "w-32"];

/** Skeleton width of a table cell: the first column long, numbers short, the rest varied by row. */
export function skeletonCellClass(column: number, row: number, numeric = false) {
  if (numeric) return "w-14 ml-auto";
  if (column === 0) return ["w-40", "w-32", "w-36"][row % 3];
  return CELL[(column + row) % CELL.length];
}

