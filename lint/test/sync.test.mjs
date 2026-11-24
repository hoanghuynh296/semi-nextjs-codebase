// node --test lint/test — package manager detection (pnpm / yarn workspaces) and /semi-sync's install handling.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { addPackageCommand, brandSemiRange, detectPkgManager, GITHUB_SPEC_BASE, PLUGIN_ROOT, pluginVersion, resolveTargetSpec, satisfies } from "../../plugin/skills/semi-new-app/scripts/setup.mjs";

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

// --- brand "semi" range (#32): never downgrade; ">=X.Y.0 <1.0.0" allows later 0.x minors -----------------------------

const TAGS = "v0.24.0,v0.24.1,v0.26.0,v0.26.1,v1.0.0";

/** An npm app on installed @semi/ui `installed` whose brand kit declares `semi`; the remote has TAGS. */
function brandApp(installed, semi) {
  const root = tmp();
  write(join(root, "package-lock.json"), "{}\n");
  write(join(root, "package.json"), json({ name: "app", dependencies: { next: "15.0.0", react: "19.0.0", "@semi/ui": `github:hoanghuynh296/semi-nextjs-codebase#v${installed}` } }));
  write(join(root, "semi-lint.json"), json({ brand: "@acme/brand" }));
  write(join(root, "node_modules/@semi/ui/package.json"), json({ name: "@semi/ui", version: installed }));
  write(join(root, "node_modules/@acme/brand/dist/brand.json"), json({ name: "Acme", package: "@acme/brand", semi }));
  write(join(root, "node_modules/@acme/brand/package.json"), json({ name: "@acme/brand", version: "1.0.0" }));
  return root;
}

function runBrandUpdate(root, pm, pluginVersion = "1.0.0") {
  const env = { ...process.env, PATH: `${pm.bin}:${process.env.PATH}`, SEMI_UI_TAGS: TAGS, SEMI_PLUGIN_VERSION: pluginVersion };
  delete env.SEMI_UI_SOURCE;
  return spawnSync(process.execPath, [UPDATE, "--cwd", root], { encoding: "utf8", env });
}

test("satisfies / brandSemiRange: comparator ranges, caret unchanged", () => {
  assert.equal(brandSemiRange("0.26.1"), ">=0.26.0 <1.0.0");
  assert.ok(satisfies("0.26.1", ">=0.24.0 <1.0.0"));
  assert.ok(!satisfies("0.23.9", ">=0.24.0 <1.0.0"));
  assert.ok(!satisfies("1.0.0", ">=0.24.0 <1.0.0"));
  assert.ok(satisfies("0.24.5", "^0.24.0"));
  assert.ok(!satisfies("0.26.0", "^0.24.0"));
});

test("resolveTargetSpec: >=0.24.0 <1.0.0 gets the latest 0.x, a new major stays capped", () => {
  process.env.SEMI_UI_TAGS = TAGS;
  process.env.SEMI_PLUGIN_VERSION = "1.0.0";
  try {
    const r = resolveTargetSpec({ range: ">=0.24.0 <1.0.0" });
    assert.equal(r.version, "0.26.1");
    assert.equal(r.newest, "1.0.0");
    assert.equal(r.limited, true);
    assert.equal(resolveTargetSpec({ range: "^0.24.0" }).version, "0.24.1");
    assert.equal(resolveTargetSpec().version, "1.0.0");
    assert.equal(resolveTargetSpec().pluginBehind, false);
  } finally {
    delete process.env.SEMI_UI_TAGS;
    delete process.env.SEMI_PLUGIN_VERSION;
  }
});

test("resolveTargetSpec: never newer than the plugin's own version (the marketplace pins the plugin to its tag)", () => {
  process.env.SEMI_UI_TAGS = TAGS;
  process.env.SEMI_PLUGIN_VERSION = "0.26.1";
  try {
    const r = resolveTargetSpec();
    assert.equal(r.version, "0.26.1");
    assert.equal(r.spec, `${GITHUB_SPEC_BASE}#v0.26.1`);
    assert.equal(r.newest, "1.0.0");
    assert.equal(r.pluginBehind, true);
    assert.equal(r.limited, false);
    assert.equal(resolveTargetSpec({ range: "^0.24.0" }).version, "0.24.1");
    assert.equal(resolveTargetSpec({ range: "^0.24.0" }).limited, true);
  } finally {
    delete process.env.SEMI_UI_TAGS;
    delete process.env.SEMI_PLUGIN_VERSION;
  }
});

test("pluginVersion: the version in plugin/.claude-plugin/plugin.json", () => {
  delete process.env.SEMI_PLUGIN_VERSION;
  const manifest = JSON.parse(readFileSync(join(PLUGIN_ROOT, ".claude-plugin/plugin.json"), "utf8"));
  assert.equal(pluginVersion(), manifest.version);
});

test("update.mjs: installed 0.26.0 + brand ^0.24.0 stays 0.26.0 and warns", { skip: process.platform === "win32" }, () => {
  const root = brandApp("0.26.0", "^0.24.0");
  try {
    const pm = fakePm(root, "npm", 0);
    const r = runBrandUpdate(root, pm);
    assert.match(r.stdout, /KHÔNG hạ cấp, giữ 0\.26\.0/);
    assert.match(r.stdout, /\^0\.24\.0/);
    assert.match(r.stdout, /\/semi-brand update/);
    assert.ok(!existsSync(pm.log), "no install ran");
    assert.match(readFileSync(join(root, "package.json"), "utf8"), /#v0\.26\.0/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("update.mjs: brand >=0.24.0 <1.0.0 moves to the latest 0.x, never to 1.0.0", { skip: process.platform === "win32" }, () => {
  const root = brandApp("0.24.0", ">=0.24.0 <1.0.0");
  try {
    const pm = fakePm(root, "npm", 0);
    runBrandUpdate(root, pm);
    assert.match(readFileSync(pm.log, "utf8"), /@semi\/ui@github:hoanghuynh296\/semi-nextjs-codebase#v0\.26\.1/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/** An npm app on installed @semi/ui `installed`, no brand kit; the remote has TAGS. */
function plainApp(installed) {
  const root = tmp();
  write(join(root, "package-lock.json"), "{}\n");
  write(join(root, "package.json"), json({ name: "app", dependencies: { next: "15.0.0", react: "19.0.0", "@semi/ui": `github:hoanghuynh296/semi-nextjs-codebase#v${installed}` } }));
  write(join(root, "node_modules/@semi/ui/package.json"), json({ name: "@semi/ui", version: installed }));
  return root;
}

test("update.mjs: a plugin pinned to 0.26.1 moves the app to 0.26.1, not 1.0.0, and says to update the plugin", { skip: process.platform === "win32" }, () => {
  const root = plainApp("0.24.0");
  try {
    const pm = fakePm(root, "npm", 0);
    const r = runBrandUpdate(root, pm, "0.26.1");
    assert.match(readFileSync(pm.log, "utf8"), /#v0\.26\.1/);
    assert.doesNotMatch(readFileSync(pm.log, "utf8"), /#v1\.0\.0/);
    assert.match(r.stdout, /plugin semi-design này viết cho 0\.26\.1/);
    assert.match(r.stdout, /\/plugin marketplace update semi-marketplace/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("update.mjs: an app already newer than the plugin is never downgraded", { skip: process.platform === "win32" }, () => {
  const root = plainApp("1.0.0");
  try {
    const pm = fakePm(root, "npm", 0);
    const r = runBrandUpdate(root, pm, "0.26.1");
    assert.match(r.stdout, /KHÔNG hạ cấp, giữ 1\.0\.0/);
    assert.match(r.stdout, /Cập nhật plugin/);
    assert.ok(!existsSync(pm.log), "no install ran");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
