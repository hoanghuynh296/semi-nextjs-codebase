// node --test lint/test — package manager detection (pnpm / yarn workspaces) and /semi-sync's install handling.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { addPackageCommand, detectPkgManager } from "../../plugin/skills/semi-new-app/scripts/setup.mjs";

const UPDATE = new URL("../../plugin/skills/semi-sync/scripts/update.mjs", import.meta.url).pathname;
const tmp = () => realpathSync(mkdtempSync(join(tmpdir(), "semi-sync-")));
const write = (p, text) => (mkdirSync(join(p, ".."), { recursive: true }), writeFileSync(p, text));
const json = (v) => JSON.stringify(v, null, 2) + "\n";

/** pnpm workspace: lockfile at the root, app in apps/web with a workspace:* dependency. */
function pnpmWorkspace() {
  const root = tmp();
  write(join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n  - packages/*\n");
  write(join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
  write(join(root, "package.json"), json({ name: "root", private: true }));
  write(join(root, "packages/kit/package.json"), json({ name: "@acme/kit", version: "1.0.0" }));
  const app = join(root, "apps/web");
  write(join(app, "package.json"), json({ name: "web", dependencies: { next: "15.0.0", react: "19.0.0", "@acme/kit": "workspace:*", "@semi/ui": "github:o/r#v0.1.0" } }));
  return { root, app };
}

test("detectPkgManager finds the pnpm workspace root above the app", () => {
  const { root, app } = pnpmWorkspace();
  try {
    assert.equal(detectPkgManager(app), "pnpm");
    assert.deepEqual(addPackageCommand(app, "@semi/ui@github:o/r#v0.2.0").args, ["add", "@semi/ui@github:o/r#v0.2.0"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("detectPkgManager: yarn.lock at the root, packageManager wins, plain npm app stays npm", () => {
  const root = tmp();
  try {
    write(join(root, "yarn.lock"), "# yarn\n");
    write(join(root, "apps/web/package.json"), json({ name: "web" }));
    assert.equal(detectPkgManager(join(root, "apps/web")), "yarn");
    assert.deepEqual(addPackageCommand(join(root, "apps/web"), "x", { dev: true }).args, ["add", "-D", "x"]);

    write(join(root, "apps/web/package.json"), json({ name: "web", packageManager: "pnpm@9.1.0" }));
    assert.equal(detectPkgManager(join(root, "apps/web")), "pnpm", "packageManager beats the yarn.lock above");

    const npmApp = join(root, "plain");
    write(join(npmApp, "package.json"), json({ name: "plain" }));
    write(join(npmApp, "package-lock.json"), "{}\n");
    assert.equal(detectPkgManager(npmApp), "npm");
    assert.deepEqual(addPackageCommand(npmApp, "x").args, ["install", "--install-links", "x"]);
    assert.deepEqual(addPackageCommand(npmApp, "x", { dev: true }).args, ["install", "--install-links", "-D", "x"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("detectPkgManager stops at the git root: a lockfile above a nested repo is not used", () => {
  const root = tmp();
  try {
    write(join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    mkdirSync(join(root, "inner/.git"), { recursive: true });
    write(join(root, "inner/package.json"), json({ name: "inner" }));
    assert.equal(detectPkgManager(join(root, "inner")), "npm");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/** A fake package manager first on PATH: logs "cwd args" and exits with `code`. */
function fakePm(root, name, code) {
  const bin = join(root, "fakebin");
  mkdirSync(bin, { recursive: true });
  const file = join(bin, name);
  writeFileSync(file, `#!/bin/sh\necho "$PWD $@" >> "${join(root, "pm.log")}"\nexit ${code}\n`);
  chmodSync(file, 0o755);
  return { bin, log: join(root, "pm.log") };
}

function runUpdate(root, pm) {
  return spawnSync(process.execPath, [UPDATE, "--cwd", root], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${pm.bin}:${process.env.PATH}`, SEMI_UI_SOURCE: "github:o/r#v0.2.0" },
  });
}

test("update.mjs in a pnpm workspace runs `pnpm add` in the app dir", { skip: process.platform === "win32" }, () => {
  const { root, app } = pnpmWorkspace();
  try {
    const pm = fakePm(root, "pnpm", 0);
    const r = runUpdate(root, pm);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(readFileSync(pm.log, "utf8").trim(), `${app} add @semi/ui@github:o/r#v0.2.0`);
    assert.equal(JSON.parse(readFileSync(join(app, "package.json"), "utf8")).dependencies["@acme/kit"], "workspace:*");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("update.mjs: a failed install names the command, keeps package.json and still wires the AGENTS.md rules", { skip: process.platform === "win32" }, () => {
  const { root, app } = pnpmWorkspace();
  try {
    const pm = fakePm(root, "pnpm", 1);
    const before = readFileSync(join(app, "package.json"), "utf8");
    const r = runUpdate(root, pm);
    assert.equal(r.status, 1);
    assert.match(r.stdout + r.stderr, /pnpm add @semi\/ui@github:o\/r#v0\.2\.0/);
    assert.match(r.stdout, /Tự chạy trong/);
    assert.equal(readFileSync(join(app, "package.json"), "utf8"), before);
    assert.ok(existsSync(join(app, "AGENTS.md")) || existsSync(join(root, "AGENTS.md")), "rules block still written");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("update.mjs in a plain npm app still uses npm install --install-links", { skip: process.platform === "win32" }, () => {
  const root = tmp();
  try {
    write(join(root, "package-lock.json"), "{}\n");
    write(join(root, "package.json"), json({ name: "plain", dependencies: { next: "15.0.0", react: "19.0.0", "@semi/ui": "github:o/r#v0.1.0" } }));
    const pm = fakePm(root, "npm", 0);
    const r = runUpdate(root, pm);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(readFileSync(pm.log, "utf8").trim(), `${root} install --install-links @semi/ui@github:o/r#v0.2.0`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
