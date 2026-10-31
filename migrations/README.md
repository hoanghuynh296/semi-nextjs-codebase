# Release migrations

Code changes a release of `@semi/ui` ships for its **own breaking changes** (a renamed component, prop or class
constant, a removed API with a 1:1 replacement). `/semi-update` runs the migrations of every release between the
app's old version and the new one, in version order. They are not an audit: rule checks stay in `/semi-audit`.

One file per change, `migrations/<version>-<id>.mjs`:

```js
import { renameExport } from "./lib.mjs";

export const version = "0.8.0"; // the release that makes the change
export const id = "rename-kpi-card";
export const description = "KpiCard → MetricCard";

export default function migrate({ files, read, write }) {
  for (const f of files) if (/\.(tsx?|jsx?)$/.test(f)) write(f, renameExport(read(f), "KpiCard", "MetricCard"));
}
```

Rules:
- Safe to run twice (the second run changes nothing) and exact: change only what you can name; anything that needs a
  judgement goes in the CHANGELOG "Migration" note instead.
- `files` are the app's scanned sources (`semi-lint.json` `scan`); `write` records what changed for the report.
- Add a test in `lint/test/migrations.test.mjs` and a CHANGELOG line; `npm test` checks every migration's shape.
