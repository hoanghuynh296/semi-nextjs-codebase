// Dense data table (transactions, logs, admin lists). Entity overviews stay Bento cards (docs/DESIGN_SYSTEM.md §5);
// use a table when rows are compared column by column. Wrap in a CARD. Cells stay on one line, so on a phone the table
// scrolls sideways instead of squeezing columns; `wrap` on a TD lets a long-text column (notes, descriptions) wrap.
//   <Table>
//     <THead><TR><TH>Mã đơn</TH><TH align="right">Tổng</TH></TR></THead>
//     <TBody>{rows.map((r) => <TR key={r.id} onClick={…}><TD>{r.code}</TD><TD align="right" numeric>{r.total}</TD></TR>)}</TBody>
//   </Table>
import React from "react";
import { cn } from "../styles/utils";

export const TABLE = "w-full text-label border-collapse";
export const TABLE_HEAD_CELL = "h-9 px-3 text-left text-label font-medium text-muted bg-field border-b border-line whitespace-nowrap first:rounded-tl-xl last:rounded-tr-xl";
export const TABLE_CELL = "h-11 px-3 text-body border-b border-divider whitespace-nowrap";
export const TABLE_ROW_HOVER = "hover:bg-field/60 transition-colors";

type Align = "left" | "right" | "center";
const ALIGN: Record<Align, string> = { left: "text-left", right: "text-right", center: "text-center" };

export function Table({ className, children, ...rest }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto overscroll-x-contain">
      <table className={cn(TABLE, className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

export const THead = (p: React.HTMLAttributes<HTMLTableSectionElement>) => <thead {...p} />;

export function TBody({ className, ...rest }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&>tr:last-child>td]:border-b-0", className)} {...rest} />;
}

/** A clickable row (onClick) gets the hover fill and a pointer; give it a link or button inside for keyboard users. */
export function TR({ className, onClick, ...rest }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr onClick={onClick} className={cn(onClick && cn(TABLE_ROW_HOVER, "cursor-pointer"), className)} {...rest} />;
}

export function TH({ align = "left", className, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement> & { align?: Align }) {
  return <th scope="col" className={cn(TABLE_HEAD_CELL, ALIGN[align], className)} {...rest} />;
}

/** `numeric` right-aligns and sets tabular-nums (money, counts, dates); `wrap` lets long text wrap (min 12rem wide). */
export function TD({
  align,
  numeric = false,
  wrap = false,
  className,
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement> & { align?: Align; numeric?: boolean; wrap?: boolean }) {
  return (
    <td
      className={cn(TABLE_CELL, ALIGN[align ?? (numeric ? "right" : "left")], numeric && "tabular-nums", wrap && "!whitespace-normal min-w-48", className)}
      {...rest}
    />
  );
}
