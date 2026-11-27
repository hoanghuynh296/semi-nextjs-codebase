// Hover and press (#218): hover follows any-hover (an iPad with a trackpad gets it, a pure touch screen does not), one
// press (PRESS, 98%) on buttons and controls and none under reduced motion, rows and tiles never shrink, keyboard
// focus unchanged, and the built CSS wires the hover: variant to any-hover. Runs on the Button doc's "Hover and press"
// example (examples/button/feedback.tsx).
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const EXAMPLE = "Ô tuỳ chỉnh của ứng dụng (PRESSABLE)";

async function open(page: Page) {
  await page.goto("/components/button/");
  const tile = page.getByRole("link", { name: EXAMPLE });
  await expect(tile).toBeVisible();
  // the example's root holds the tile and the buttons
  const root = page.locator("div.space-y-4", { has: tile }).last();
  return { root, tile };
}


// any-hover is set by the device: a desktop context has a mouse (any-hover: hover); a touch context (hasTouch) has
// none. Chrome ignores an any-hover feature in CDP Emulation.setEmulatedMedia (tried: matchMedia does not change), so
// the iPad-with-trackpad case (hover: none, any-hover: hover) cannot be emulated here: the built-CSS test below proves
// hover: is keyed on any-hover alone, and a real iPad is UNVERIFIED.
for (const [label, opts, hovers] of [
  ["a mouse (any-hover: hover)", {}, true],
  ["a touch screen only (any-hover: none)", { hasTouch: true }, false],
] as const) {
  test(`hover shows only when a pointer can hover: ${label}`, async ({ browser }) => {
    const page = await browser.newPage({ ...opts, colorScheme: "dark" });
    const { root } = await open(page);
    expect(await page.evaluate(() => matchMedia("(any-hover: hover)").matches)).toBe(hovers);
    const btn = root.getByRole("button", { name: "Làm mới" });
    await btn.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(250);
    const rest = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
    const box = (await btn.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(250); // transition-hover is 150ms
    const hovered = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
    if (hovers) expect(hovered).not.toBe(rest);
    else expect(hovered).toBe(rest);
    await page.close();
  });
}

test("press: buttons and controls shrink to 98%, rows and tiles never; reduced motion keeps them still", async ({ page }) => {
  const { root, tile } = await open(page);
  const scaleWhilePressed = async (loc: ReturnType<typeof root.getByRole>) => {
    await loc.scrollIntoViewIfNeeded();
    const box = (await loc.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(250);
    const s = await loc.evaluate((el) => getComputedStyle(el).scale);
    await page.mouse.up();
    return s;
  };
  for (const name of ["Làm mới", "Chia sẻ", "Xem thêm", "Thêm"]) expect(await scaleWhilePressed(root.getByRole("button", { name, exact: true })), name).toBe("0.98");
  expect(await scaleWhilePressed(root.getByRole("switch", { name: "Tự động" }))).toBe("0.98");
  // a tile and a list row: no shrink, the hover fill while pressed
  expect(await scaleWhilePressed(tile)).toBe("none");
  expect(await scaleWhilePressed(root.getByRole("link", { name: /X1 Carbon 03/ }))).toBe("none");

  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await scaleWhilePressed(root.getByRole("button", { name: "Làm mới" }))).toBe("none");
});

test("keyboard: Tab reaches the Switch, Space toggles it, the focus outline shows and the press scale does not stick", async ({ page }) => {
  const { root } = await open(page);
  const sw = root.getByRole("switch", { name: "Tự động" });
  await root.getByRole("checkbox", { name: "Gửi email" }).focus();
  await page.keyboard.press("Tab");
  await expect(sw).toBeFocused();
  const before = await sw.getAttribute("aria-checked");
  await page.keyboard.press("Space");
  await expect(sw).toHaveAttribute("aria-checked", before === "true" ? "false" : "true");
  const s = await sw.evaluate((el) => ({ shadow: getComputedStyle(el).boxShadow, scale: getComputedStyle(el).scale }));
  expect(s.shadow).not.toBe("none"); // FOCUS_RING (ring-2) on keyboard focus
  expect(s.scale).toBe("none");
});

test("built CSS: hover: sits in @media (any-hover: hover), not (hover: hover); PRESS sits in prefers-reduced-motion: no-preference", async ({ page }) => {
  await page.goto("/components/button/");
  const found = await page.evaluate(() => {
    const out = { anyHover: 0, plainHover: 0, press: [] as string[] };
    const walk = (rules: CSSRuleList, media: string[]) => {
      for (const r of Array.from(rules)) {
        if (r instanceof CSSMediaRule) walk(r.cssRules, [...media, r.conditionText]);
        else if ("cssRules" in r && (r as CSSGroupingRule).cssRules?.length) walk((r as CSSGroupingRule).cssRules, media);
        if (r instanceof CSSStyleRule) {
          if (r.selectorText.includes(".hover\\:bg-item-hover:hover")) {
            if (media.some((m) => m.includes("any-hover: hover"))) out.anyHover++;
            if (media.some((m) => /(^|[^-])hover: hover/.test(m))) out.plainHover++;
          }
          if (r.selectorText.includes("motion-safe\\:active\\:scale-\\[0\\.98\\]")) out.press.push(media.join(" | "));
        }
      }
    };
    for (const s of Array.from(document.styleSheets)) {
      try {
        walk(s.cssRules, []);
      } catch {
        /* cross-origin sheet */
      }
    }
    return out;
  });
  expect(found.anyHover).toBeGreaterThan(0);
  expect(found.plainHover).toBe(0);
  expect(found.press.length).toBeGreaterThan(0);
  for (const m of found.press) expect(m).toContain("prefers-reduced-motion: no-preference");
});
