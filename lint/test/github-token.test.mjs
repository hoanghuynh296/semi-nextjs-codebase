// node --test lint/test/github-token.test.mjs — getGitHubToken() of /semi-propose and /semi-triage (#185).
// The two skills install as separate folders, so each script carries its own copy: they must stay byte-identical, and
// the token lookup must never go through a shell (cmd.exe has no printf or /dev/null). CI also runs this file on
// windows-latest (check.yml, job "windows").
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPTS = {
  propose: fileURLToPath(new URL("../../plugin/skills/semi-propose/scripts/propose.mjs", import.meta.url)),
  triage: fileURLToPath(new URL("../../plugin/skills/semi-triage/scripts/triage.mjs", import.meta.url)),
};

/** The source of getGitHubToken(), from its declaration to the first closing brace at column 0. */
function tokenFn(file) {
  const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const start = src.indexOf("function getGitHubToken() {");
  assert.ok(start !== -1, `${file}: no getGitHubToken()`);
  const end = src.indexOf("\n}\n", start);
  assert.ok(end !== -1, `${file}: getGitHubToken() not closed at column 0`);
  return src.slice(start, end + 2);
}

test("getGitHubToken() is byte-identical in propose.mjs and triage.mjs", () => {
  assert.equal(tokenFn(SCRIPTS.propose), tokenFn(SCRIPTS.triage), "copy the function from one script to the other");
});

test("getGitHubToken() builds no shell string: execFileSync with an argument array, no shell option", () => {
  for (const [name, file] of Object.entries(SCRIPTS)) {
    const fn = tokenFn(file).replace(/^\s*\/\/.*$/gm, ""); // comments may name what is avoided
    assert.doesNotMatch(fn, /\bexecSync\b|\bexec\(|\bspawnSync\(|shell\s*:/, `${name}: token lookup must not use a shell`);
    assert.doesNotMatch(fn, /printf|\/dev\/null|\|\s*git\b|2>/, `${name}: POSIX shell syntax in token lookup`);
    const calls = [...fn.matchAll(/execFileSync\(\s*("[^"]+")\s*,\s*(\[[^\]]*\])/g)].map((m) => [JSON.parse(m[1]), m[2]]);
    assert.deepEqual(calls.map((c) => c[0]), ["git", "gh"], `${name}: expected git credential fill, then gh auth token`);
    assert.match(fn, /GCM_INTERACTIVE: "never"/, `${name}: Git Credential Manager must not prompt`);
    assert.match(fn, /GIT_TERMINAL_PROMPT: "0"/, `${name}: git must not prompt`);
    assert.match(fn, /timeout:/, `${name}: lookups need a timeout`);
  }
});

/** Runs the real function with GITHUB_TOKEN / GH_TOKEN as given. */
function runTokenFn(env) {
  const make = new Function("execFileSync", "process", `${tokenFn(SCRIPTS.propose)}\nreturn getGitHubToken;`);
  return make(execFileSync, { env })();
}

test("env tokens come first, trimmed", () => {
  assert.equal(runTokenFn({ GITHUB_TOKEN: " a \n", GH_TOKEN: "b" }), "a");
  assert.equal(runTokenFn({ GH_TOKEN: "b\n" }), "b");
});

test("without GITHUB_TOKEN / GH_TOKEN the lookup returns a token or null (NO_TOKEN), never throws", () => {
  const env = { ...process.env };
  delete env.GITHUB_TOKEN;
  delete env.GH_TOKEN;
  let token;
  assert.doesNotThrow(() => { token = runTokenFn(env); });
  assert.ok(token === null || (typeof token === "string" && token.length > 0 && !/\s/.test(token)), "token or null");
});

test("both scripts' no-network path (--help) prints the usage and exits 0", () => {
  for (const [name, file] of Object.entries(SCRIPTS)) {
    const out = execFileSync(process.execPath, [file, "--help"], { encoding: "utf8", timeout: 15000 });
    assert.match(out, name === "propose" ? /Semi Propose CLI/ : /Semi Triage CLI/);
  }
});
