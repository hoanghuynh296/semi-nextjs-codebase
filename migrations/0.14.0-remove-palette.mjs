// v0.14.0 removed palettes (three colour variants per style). An app that set one has `"palette"` in semi-lint.json
// and `data-palette` on <html>; both are dropped, so the app gets its style's own neutrals (the look of its default
// palette). An app on a non-default palette changes its neutrals: CHANGELOG 0.14.0 says how to keep them.
import { existsSync } from "node:fs";
import { join } from "node:path";

export const version = "0.14.0";
export const id = "remove-palette";
export const description = "palette: removed from semi-lint.json and from <html data-palette>";

const HTML_PALETTE = /(<html\b[^>]*?)\s+data-palette=["'][\w-]*["']/g;

export default function migrate({ appDir, files, read, write }) {
  const cfg = join(appDir, "semi-lint.json");
  if (existsSync(cfg)) {
    const json = JSON.parse(read(cfg));
    if ("palette" in json) {
      delete json.palette;
      write(cfg, JSON.stringify(json, null, 2) + "\n");
    }
  }
  for (const f of files) {
    if (!/\.(tsx|jsx|html)$/.test(f)) continue;
    const src = read(f);
    write(f, src.replace(HTML_PALETTE, "$1"));
  }
}
