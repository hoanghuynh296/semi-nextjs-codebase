// node --test lint/test: the plugin scripts start tools without a shell on every OS (#216, docs/PLUGIN.md) and read
// both CHANGELOG heading forms. The `windows` job of check.yml runs this file on windows-latest (the win32 branch for real).
import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { binEntry, commandFor, runLocal, runTool } from "../../plugin/skills/semi-new-app/scripts/setup.mjs";
import { changelogBetween, changelogVersion } from "../../plugin/skills/semi-sync/scripts/migrate.mjs";

const SETUP = fileURLToPath(new URL("../../plugin/skills/semi-new-app/scripts/setup.mjs", import.meta.url));
const UPDATE = fileURLToPath(new URL("../../plugin/skills/semi-sync/scripts/update.mjs", import.meta.url));
const tmp = () => realpathSync(mkdtempSync(join(tmpdir(), "semi-spawn-")));
const write = (p, text) => (mkdirSync(dirname(p), { recursive: true }), writeFileSync(p, text));
const json = (v) => JSON.stringify(v, null, 2) + "\n";
const win = process.platform === "win32";

const CHANGELOG = `# Changelog

## Unreleased

- next

## 1.2.0 - 2026-11-26

- one two

## [1.1.0]

- bracket form

## 1.0.0 — 2026-11-25

- long dash

## 0.36.1 — 2026-11-23

- old
`;

test("changelogVersion: '## 1.2.0 - date', '## 0.36.1 — date' and '## [1.2.0]'; not Unreleased", () => {
  assert.equal(changelogVersion("## 1.2.0 - 2026-11-26"), "1.2.0");
  assert.equal(changelogVersion("## 0.36.1 — 2026-11-23"), "0.36.1");
  assert.equal(changelogVersion("## [1.2.0]"), "1.2.0");
  assert.equal(changelogVersion("## [1.2.0] - 2026-11-26"), "1.2.0");
  assert.equal(changelogVersion("## Unreleased"), null);
});

test("changelogBetween: every release after from up to to, in both heading forms", () => {
  const notes = changelogBetween(CHANGELOG, "0.36.1", "1.2.0");
  for (const s of ["## 1.2.0 - 2026-11-26", "## [1.1.0]", "## 1.0.0 — 2026-11-25"]) assert.ok(notes.includes(s), s);
  assert.ok(!notes.includes("0.36.1"), "the installed release is not repeated");
  assert.ok(!notes.includes("Unreleased"));
  assert.equal(changelogBetween(CHANGELOG, "1.0.0", "1.1.0"), "## [1.1.0]\n\n- bracket form");
  assert.match(changelogBetween(CHANGELOG, null, "0.36.1"), /^## 0\.36\.1 — /);
});

/** An app with a local CLI `semi-fake` whose JS entry writes its argv to out.json. */
function fakeApp() {
  const app = tmp();
  write(join(app, "package.json"), json({ name: "app" }));
  write(join(app, "node_modules/@acme/fake/package.json"), json({ name: "@acme/fake", bin: { "semi-fake": "cli.js" } }));
  write(join(app, "node_modules/@acme/fake/cli.js"), `require("node:fs").writeFileSync("out.json", JSON.stringify(process.argv.slice(2)));\n`);
  // On Windows the .cmd shim is never run (Node would refuse it): the JS entry is.
  if (win) write(join(app, "node_modules/.bin/semi-fake.cmd"), "@echo off\r\nexit /b 9\r\n");
  else {
    write(join(app, "node_modules/.bin/semi-fake"), `#!/bin/sh\nexec "${process.execPath}" "$(dirname "$0")/../@acme/fake/cli.js" "$@"\n`);
    chmodSync(join(app, "node_modules/.bin/semi-fake"), 0o755);
  }
  return app;
}

test("runLocal runs the app's CLI with its arguments as they are (on Windows through node + its bin entry)", () => {
  const app = fakeApp();
  try {
    const r = runLocal(app, "semi-fake", ["a b", 'q"uote', "--x=1"]);
    assert.equal(r.status, 0);
    assert.deepEqual(JSON.parse(readFileSync(join(app, "out.json"), "utf8")), ["a b", 'q"uote', "--x=1"]);
  } finally {
    rmSync(app, { recursive: true, force: true });
  }
});

test("runTool runs the package manager with no shell (npm --version)", () => {
  const r = runTool("npm", ["--version"], { cwd: tmpdir(), stdio: "pipe", encoding: "utf8" });
  assert.equal(r.status, 0, String(r.stderr));
  assert.match(r.stdout, /^\d+\.\d+\.\d+/);
  if (win) assert.equal(commandFor("npm", []).via, "node", "npm-cli.js found next to node");
});

/** Run a call to setup.mjs in a child, to see what it prints. */
const child = (code, cwd) =>
  spawnSync(process.execPath, ["--input-type=module", "-e", `import * as s from ${JSON.stringify(pathToFileURL(SETUP).href)}; ${code}`], { cwd, encoding: "utf8" });

test("a tool that cannot start is 'could not run <bin>' with the error and a non-zero status, never success", () => {
  const r = child(`const r = s.runTool("semi-no-such-tool-216", ["x"], {}); console.log("STATUS", r.status);`, tmpdir());
  assert.match(r.stdout, /STATUS [1-9]/, r.stdout + r.stderr);
  if (!win) assert.match(r.stderr, /could not run semi-no-such-tool-216: .*ENOENT/);
  else assert.match(r.stdout, /no JS entry found in its package, running semi-no-such-tool-216\.cmd through cmd\.exe/);
});

test("runLocal: a .bin entry that cannot be executed is reported (EACCES), with failed: true", { skip: win }, () => {
  const app = tmp();
  try {
    write(join(app, "node_modules/.bin/semi-lint"), "#!/bin/sh\n");
    chmodSync(join(app, "node_modules/.bin/semi-lint"), 0o644);
    const r = child(`const r = s.runLocal(${JSON.stringify(app)}, "semi-lint", []); console.log("STATUS", r.status, r.failed);`, app);
    assert.match(r.stdout, /STATUS 1 true/);
    assert.match(r.stderr, /could not run semi-lint: .*EACCES/);
  } finally {
    rmSync(app, { recursive: true, force: true });
  }
});

// --- the win32 branch, on any OS (paths and PATH given) -------------------------------------------------------------

test("commandFor on win32: local bin through node + the package's bin entry; elsewhere the .bin file itself", () => {
  const app = fakeApp();
  try {
    const entry = join(app, "node_modules/@acme/fake/cli.js");
    assert.equal(binEntry(join(app, "node_modules"), "semi-fake"), entry);
    assert.deepEqual(commandFor("semi-fake", ["--ci"], { appDir: app, platform: "win32", env: {}, execPath: "NODE" }), { file: "NODE", args: [entry, "--ci"], via: "node", entry });
    assert.deepEqual(commandFor("semi-fake", ["--ci"], { appDir: app, platform: "linux" }), { file: join(app, "node_modules/.bin/semi-fake"), args: ["--ci"], via: "direct" });
    assert.deepEqual(commandFor("npm", ["i"], { platform: "darwin" }), { file: "npm", args: ["i"], via: "direct" });
  } finally {
    rmSync(app, { recursive: true, force: true });
  }
});

test("commandFor on win32: npm / pnpm from the PATH folder holding <bin>.cmd, then node's folder; else the .cmd via cmd.exe", () => {
  const root = tmp();
  try {
    const nodeDir = join(root, "nodejs");
    write(join(nodeDir, "node_modules/npm/package.json"), json({ name: "npm", bin: { npm: "bin/npm-cli.js", npx: "bin/npx-cli.js" } }));
    write(join(nodeDir, "node_modules/npm/bin/npm-cli.js"), "");
    write(join(nodeDir, "node_modules/npm/bin/npx-cli.js"), "");
    const execPath = join(nodeDir, "node.exe");
    const globalDir = join(root, "AppData", "npm");
    write(join(globalDir, "pnpm.cmd"), "");
    write(join(globalDir, "node_modules/pnpm/package.json"), json({ name: "pnpm", bin: { pnpm: "bin/pnpm.cjs", pnpx: "bin/pnpx.cjs" } }));
    write(join(globalDir, "node_modules/pnpm/bin/pnpm.cjs"), "");
    const env = { Path: `${join(root, "Windows")};${globalDir}`, ComSpec: "C:\\Windows\\cmd.exe" };
    const o = { platform: "win32", env, execPath };

    assert.deepEqual(commandFor("npm", ["install"], o).args, [join(nodeDir, "node_modules/npm/bin/npm-cli.js"), "install"]);
    assert.equal(commandFor("npx", [], o).entry, join(nodeDir, "node_modules/npm/bin/npx-cli.js"));
    const pnpm = commandFor("pnpm", ["add", "x"], o);
    assert.deepEqual({ file: pnpm.file, args: pnpm.args }, { file: execPath, args: [join(globalDir, "node_modules/pnpm/bin/pnpm.cjs"), "add", "x"] });

    // A newer npm installed globally (npm.cmd first on PATH) wins over the one next to node.
    write(join(globalDir, "npm.cmd"), "");
    write(join(globalDir, "node_modules/npm/package.json"), json({ name: "npm", bin: { npm: "bin/npm-cli.js" } }));
    write(join(globalDir, "node_modules/npm/bin/npm-cli.js"), "");
    assert.equal(commandFor("npm", [], o).entry, join(globalDir, "node_modules/npm/bin/npm-cli.js"));

    const yarn = commandFor("yarn", ["add", "a b"], o);
    assert.equal(yarn.via, "cmd");
    assert.equal(yarn.file, "C:\\Windows\\cmd.exe");
    assert.deepEqual(yarn.args, ["/d", "/s", "/c", '""yarn.cmd" "add" "a b""']);
    assert.equal(yarn.verbatim, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// --- update.mjs end to end: CHANGELOG of 1.x printed, a lint baseline that was not written is not reported as written --

test("update.mjs: prints the 1.x CHANGELOG sections and reports a semi-lint that could not run (exit 1)", { skip: win }, () => {
  const root = tmp();
  try {
    write(join(root, "package-lock.json"), "{}\n");
    write(join(root, "package.json"), json({ name: "app", dependencies: { next: "15.0.0", react: "19.0.0", "@semi/ui": "github:o/r#v0.36.1" } }));
    const pkgJson = join(root, "node_modules/@semi/ui/package.json");
    write(pkgJson, json({ name: "@semi/ui", version: "0.36.1" }));
    // semi-lint is there but cannot be executed (on Windows this was EINVAL from the .cmd shim).
    write(join(root, "node_modules/.bin/semi-lint"), "#!/bin/sh\n");
    chmodSync(join(root, "node_modules/.bin/semi-lint"), 0o644);
    // The fake npm "installs" 1.2.0 with its CHANGELOG.
    const bin = join(root, "fakebin");
    write(join(root, "next/package.json"), json({ name: "@semi/ui", version: "1.2.0" }));
    write(join(root, "next/CHANGELOG.md"), CHANGELOG);
    write(join(bin, "npm"), `#!/bin/sh\ncp "${join(root, "next/package.json")}" "${pkgJson}"\ncp "${join(root, "next/CHANGELOG.md")}" "${join(root, "node_modules/@semi/ui/CHANGELOG.md")}"\n`);
    chmodSync(join(bin, "npm"), 0o755);
    const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, SEMI_UI_TAGS: "v0.36.1,v1.2.0", SEMI_PLUGIN_VERSION: "1.2.0" };
    delete env.SEMI_UI_SOURCE;
    const r = spawnSync(process.execPath, [UPDATE, "--cwd", root], { encoding: "utf8", env });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /--- CHANGELOG 0\.36\.1 → 1\.2\.0 ---/);
    for (const s of ["## 1.2.0 - 2026-11-26", "## [1.1.0]", "## 1.0.0 — 2026-11-25"]) assert.ok(r.stdout.includes(s), s);
    assert.match(r.stderr, /could not run semi-lint: .*EACCES/);
    assert.match(r.stdout, /semi-lint-baseline\.json KHÔNG được ghi/);
    assert.doesNotMatch(r.stdout, /lỗi cũ được ghi vào semi-lint-baseline\.json/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
