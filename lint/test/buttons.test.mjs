// node --test lint/test — Button's classes (styles/buttons.ts, imported as TypeScript: Node strips the types).
import { test } from "node:test";
import assert from "node:assert/strict";
import { buttonClass, BTN_HIT } from "../../styles/buttons.ts";

const has = (cls, c) => cls.split(/\s+/).includes(c);

test("Button classes: relative only when className does not position it, so absolute / fixed / sticky keep their place (#146)", () => {
  assert.ok(has(buttonClass("subtle", "md"), "relative"));
  for (const c of ["absolute top-2 right-2", "fixed bottom-4", "sticky top-0", "sm:absolute"]) {
    const cls = buttonClass("subtle", "md", { className: c });
    assert.ok(!has(cls, "relative"), c);
    assert.ok(cls.endsWith(c), "className comes last");
  }
  assert.ok(has(buttonClass("ghost", "md", { className: "absolutely-not" }), "relative"));
});

test("Button classes: the hit area is 24px on a fine pointer and 44px under any-pointer-coarse, at every size", () => {
  for (const size of ["xs", "sm", "md", "modal"]) assert.ok(buttonClass("subtle", size).includes(BTN_HIT), size);
  assert.match(BTN_HIT, /before:size-6/);
  assert.match(BTN_HIT, /any-pointer-coarse:before:size-\[44px\]/);
});

test("Button classes: every variant has its own modal look (no silent fallback to subtle)", () => {
  const variants = ["subtle", "surface", "inverse", "outline", "ghost", "primary", "secondary", "danger"];
  const modal = variants.map((v) => buttonClass(v, "modal"));
  assert.equal(new Set(modal).size, variants.length);
  assert.match(buttonClass("inverse", "modal"), /bg-inverted/);
  assert.match(buttonClass("surface", "modal"), /bg-raised/);
});
