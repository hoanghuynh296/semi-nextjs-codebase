// npm run check:workflows — every file in .github/workflows must be valid YAML (GitHub fails an invalid workflow at
// 0 s and attaches no checks to the PR, e.g. an unquoted ": " in a step name).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDocument } from "yaml";

const dir = process.argv[2] ?? ".github/workflows";
let bad = 0;
const files = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f));
for (const f of files) {
  const doc = parseDocument(readFileSync(join(dir, f), "utf8"));
  for (const e of [...doc.errors, ...doc.warnings]) {
    bad++;
    console.error(`${join(dir, f)}:${e.linePos?.[0].line ?? "?"}: ${e.message.split("\n")[0]}`);
  }
}
if (bad) process.exit(1);
console.log(`workflows OK (${files.length} files)`);
