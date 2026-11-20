#!/usr/bin/env node
// PostToolUse hook for Edit / Write / MultiEdit: runs semi-lint on the edited .ts/.tsx/.css file if the project uses
// Semi, and flags an edit of semi-lint.json or the baseline (silencing a rule needs the user's OK).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

let payload = "";
try {
  payload = readFileSync(0, "utf8");
} catch {
  process.exit(0);
}
if (!payload.trim()) process.exit(0);

let file = "";
try {
  const data = JSON.parse(payload);
  file = data?.tool_input?.file_path || data?.tool_input?.Path || data?.file_path || "";
} catch {
  process.exit(0);
}
if (!file || !existsSync(file)) process.exit(0);
// The lint config and its baseline: they may only shrink without the user's OK (semi-lint --ci checks it in CI too).
if (/(?:^|[\\/])(?:semi-lint\.json|semi-lint-baseline\.json)$/.test(file)) {
  process.stderr.write(
    `Semi: you edited ${file}. Do not silence lint with a skip, a disabled rule or a bigger baseline: fix the code. ` +
      "A skip needs the user's explicit OK and a reason (illustration / data colours); the baseline only shrinks " +
      "(semi-lint --update-baseline), and new hits are recorded only after a Semi upgrade (/semi-sync). Revert the change unless the user asked for it.\n",
  );
  process.exit(2);
}
if (!/\.(?:tsx?|css)$/.test(file) || file.endsWith(".d.ts")) process.exit(0);
if (/\/(node_modules|\.next|out|dist)\//.test(file)) process.exit(0);

// Walk up from the edited file to find the nearest directory with semi-lint.json
let dir = dirname(resolve(file));
let configDir = null;
while (dir && dir !== dirname(dir)) {
  if (existsSync(join(dir, "semi-lint.json"))) {
    configDir = dir;
    break;
  }
  dir = dirname(dir);
}
if (!configDir) process.exit(0);

const localBin = join(configDir, "node_modules", ".bin", "semi-lint");
const cmd = existsSync(localBin) ? localBin : "npx";
const args = existsSync(localBin) ? ["--files", resolve(file)] : ["--no-install", "semi-lint", "--files", resolve(file)];

const res = spawnSync(cmd, args, { cwd: configDir, encoding: "utf8" });
if (res.status !== 0 && res.stdout) {
  process.stderr.write(`Semi design-system lint failed for ${file}:\n${res.stdout}\n`);
  process.exit(2);
}
process.exit(0);
