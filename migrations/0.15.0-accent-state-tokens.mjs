// 0.15.0: focus rings, selected tints and selected borders read themed accent tokens instead of the brand scale.
import { accentStateTokens } from "./lib.mjs";

export const version = "0.15.0";
export const id = "accent-state-tokens";
export const description = "ring-primary-500/50 → ring-focus, bg-primary-500/15 → bg-accent-subtle, border-primary-500/30 → border-accent-line";

export default function migrate({ files, read, write }) {
  for (const f of files) if (/\.(tsx?|jsx?|mdx?|css)$/.test(f)) write(f, accentStateTokens(read(f)));
}
