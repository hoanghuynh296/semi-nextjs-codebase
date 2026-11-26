// Migrating an app in stages (#184): a migrated route loads the app's own Tailwind build next to Semi's scoped entry
// (`@semi/ui/scoped.css`, docs/BRANDS.md). Semi's utilities and theme sit in the `semi` layer, after `utilities`, so
// AppShell's responsive variants win over the app's `.flex` / `.hidden` whichever sheet loads first. /staged links
// the legacy sheet first, /staged2 Semi's first (tests/prerender-app/app/(staged), (staged2)).
// /staged2 is the regression guard: with Semi's sheet first, a plain `@layer utilities` / `@layer base` setup loses to
// the legacy build. /staged passes on that setup too (the later sheet wins there anyway); it stays to show both orders.
import { expect, test, type Browser, type Page } from "@playwright/test";
import { PRERENDER_PORT } from "../playwright.config";

const BASE = `http://127.0.0.1:${PRERENDER_PORT}`;

async function open(browser: Browser, path: string, width: number, height: number) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: "dark" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}${path}`);
  await page.waitForFunction(() => {
    const el = document.querySelector("#main");
    return !!el && Object.keys(el).some((k) => k.startsWith("__reactFiber$"));
  });
  return page;
}

/** Where the two builds sit in the page's CSS, and which cascade layer holds the rules the test needs. */
async function cascade(page: Page) {
  return page.evaluate(() => {
    let i = 0;
    let semiAt = -1;
    let legacyAt = -1;
    const layerOf: Record<string, string[]> = {};
    const walk = (rules: CSSRuleList, layer: string) => {
      for (const r of Array.from(rules)) {
        i++;
        if (((r instanceof CSSLayerStatementRule && r.nameList.includes("semi")) || (r instanceof CSSLayerBlockRule && r.name === "semi")) && semiAt < 0) semiAt = i;
        if (r instanceof CSSStyleRule) {
          if (/^0?\.3rem$/.test(r.style.getPropertyValue("--spacing").trim()) && legacyAt < 0) legacyAt = i;
          (layerOf[r.selectorText] ??= []).push(layer);
        }
        if (r instanceof CSSLayerBlockRule) walk(r.cssRules, layer ? `${layer}.${r.name}` : r.name);
        else if ("cssRules" in r && (r as CSSGroupingRule).cssRules) walk((r as CSSGroupingRule).cssRules, layer);
      }
    };
    for (const s of Array.from(document.styleSheets)) walk(s.cssRules, "");
    return { semiAt, legacyAt, bodyRule: (layerOf["html, body"] ?? []).filter((l) => l.startsWith("semi")), mdHidden: layerOf[".md\\:hidden"] ?? [], appClass: layerOf[".tracking-\\[0\\.37em\\]"] ?? [], flex: layerOf[".flex"] ?? [] };
  });
}

for (const [path, legacyFirst] of [["/staged/orders", true], ["/staged2/orders", false]] as const) {
  test(`Scoped entry (#184) ${path}: Semi's utilities in the \`semi\` layer win over a second Tailwind build loaded ${legacyFirst ? "before" : "after"} them`, async ({ browser }) => {
    const page = await open(browser, path, 1280, 800);
    const c = await cascade(page);
    // both builds are on the page, in the order this route group links them
    expect(c.semiAt).toBeGreaterThan(0);
    expect(c.legacyAt).toBeGreaterThan(0);
    expect(c.legacyAt < c.semiAt).toBe(legacyFirst);
    // Semi's variant and the app's own migrated class are in `semi`; `.flex` is in both builds
    expect(c.mdHidden).toContain("semi");
    expect(c.appClass).toContain("semi");
    expect(c.flex).toEqual(expect.arrayContaining(["semi", "utilities"]));
    await expect(page.getByTestId("staged-app-class")).toHaveCSS("letter-spacing", /^\d/);

    // desktop: the shell is a row (nav beside the content), the phone top bar is hidden, Semi's spacing holds
    const shell = page.locator('[data-semi="AppShell"]');
    await expect(shell).toHaveCSS("flex-direction", "row");
    const nav = (await page.locator("aside[data-semi-nav-panel]").boundingBox())!;
    const main = (await page.locator("#main").boundingBox())!;
    expect(nav.x + nav.width).toBeLessThanOrEqual(main.x + 1);
    await expect(page.getByRole("button", { name: "Mở menu" })).toBeHidden();
    // Semi's theme variables are in `semi` too: the app's same-name theme variables (`--spacing`, Tailwind's default
    // emerald) never replace them
    const root = (name: string) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);
    expect(await root("--spacing")).not.toMatch(/^0?\.3rem$/);
    expect((await root("--color-emerald-500")).toLowerCase()).toBe("#28a25a");
    // Semi's base rules are in `semi.base`: the app's shadcn-style base (red page, blue text, red borders) never wins
    const body = await page.evaluate(() => {
      const s = getComputedStyle(document.body);
      return { bg: s.backgroundColor, color: s.color, border: s.borderTopColor };
    });
    expect(body.bg).not.toBe("rgb(255, 0, 0)");
    expect(body.color).not.toBe("rgb(0, 0, 255)");
    expect(body.border).not.toBe("rgb(255, 0, 0)");
    expect(c.bodyRule).toContain("semi.base");
    await page.context().close();

    // phone: the drawer top bar shows
    const phone = await open(browser, path, 375, 800);
    await expect(phone.getByRole("button", { name: "Mở menu" })).toBeVisible();
    await phone.context().close();
  });
}
