// 0.37.0 (#113): the rail step of 0.36.0-shell for apps that already ran it on 0.36. AppShell's `account` render prop
// gets `{ collapsed, rail }`; `rail` is also true at md (iPad) where `collapsed` is false, so an account written for 0.35
// (`({ collapsed }) => (collapsed ? null : <Block />)`) rendered its full block squeezed into the 60px rail.
// `({ collapsed }) => …collapsed…` becomes `({ collapsed, rail }) => …(collapsed || rail)…`; other shapes are reported
// with file:line. Safe to run twice and after 0.36.0-shell (a prop that mentions rail is left alone).
import { migrateRail } from "./0.36.0-shell.mjs";

export const version = "0.37.0";
export const id = "account-rail";
export const description = "AppShell / DocsShell account render prop: collapsed → collapsed || rail (warns with file:line where it cannot)";

export default function migrate({ files, read, write }) {
  for (const f of files) if (/\.(tsx?|jsx?)$/.test(f)) write(f, migrateRail(f, read(f)));
}
